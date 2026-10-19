import Foundation
import Speech
import AVFoundation

@MainActor
final class LocalSpeechCapture {
    private let engine = AVAudioEngine()
    private let recognizer: SFSpeechRecognizer
    private let request: SFSpeechAudioBufferRecognitionRequest
    private var task: SFSpeechRecognitionTask?
    private var paused = false

    private init(recognizer: SFSpeechRecognizer, request: SFSpeechAudioBufferRecognitionRequest) { self.recognizer = recognizer; self.request = request }

    static func start(onTranscript: @escaping (String, Bool) -> Void) async throws -> LocalSpeechCapture {
        let speechStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0) }
        }
        guard speechStatus == .authorized else { throw NSError(domain: "Omnipresent", code: 20, userInfo: [NSLocalizedDescriptionKey: "Allow Speech Recognition in System Settings to present with voice."]) }
        let audioStatus = AVCaptureDevice.authorizationStatus(for: .audio)
        if audioStatus == .notDetermined { _ = await AVCaptureDevice.requestAccess(for: .audio) }
        guard AVCaptureDevice.authorizationStatus(for: .audio) == .authorized else { throw NSError(domain: "Omnipresent", code: 21, userInfo: [NSLocalizedDescriptionKey: "Allow microphone access in System Settings to present with voice."]) }
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US")), recognizer.isAvailable else { throw NSError(domain: "Omnipresent", code: 22, userInfo: [NSLocalizedDescriptionKey: "On-device English speech recognition is unavailable on this Mac."]) }
        guard recognizer.supportsOnDeviceRecognition else { throw NSError(domain: "Omnipresent", code: 23, userInfo: [NSLocalizedDescriptionKey: "This Mac does not offer on-device English speech recognition. Omnipresent will not send your speech to a network service."]) }
        let request = SFSpeechAudioBufferRecognitionRequest(); request.shouldReportPartialResults = true; request.requiresOnDeviceRecognition = true
        let capture = LocalSpeechCapture(recognizer: recognizer, request: request)
        let input = capture.engine.inputNode; let format = input.outputFormat(forBus: 0)
        input.installTap(onBus: 0, bufferSize: 2048, format: format) { buffer, _ in request.append(buffer) }
        capture.engine.prepare(); try capture.engine.start()
        capture.task = recognizer.recognitionTask(with: request) { result, error in
            if let result { let text = result.bestTranscription.formattedString.trimmingCharacters(in: .whitespacesAndNewlines); if !text.isEmpty { onTranscript(text, result.isFinal) } }
            if error != nil { Task { @MainActor in capture.stop() } }
        }
        return capture
    }
    func setPaused(_ value: Bool) { paused = value; if value { engine.pause() } else if !engine.isRunning { try? engine.start() } }
    func stop() { engine.inputNode.removeTap(onBus: 0); engine.stop(); request.endAudio(); task?.cancel(); task = nil }
}
