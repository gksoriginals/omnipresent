import Foundation
import Combine
import Speech
import AVFoundation
import Darwin
import UniformTypeIdentifiers

enum JSONValue: Codable, Equatable {
    case object([String: JSONValue]), array([JSONValue]), string(String), number(Double), bool(Bool), null
    init(from decoder: Decoder) throws {
        let box = try decoder.singleValueContainer()
        if box.decodeNil() { self = .null }
        else if let value = try? box.decode(Bool.self) { self = .bool(value) }
        else if let value = try? box.decode(Double.self) { self = .number(value) }
        else if let value = try? box.decode(String.self) { self = .string(value) }
        else if let value = try? box.decode([JSONValue].self) { self = .array(value) }
        else { self = .object(try box.decode([String: JSONValue].self)) }
    }
    func encode(to encoder: Encoder) throws {
        var box = encoder.singleValueContainer()
        switch self {
        case .object(let value): try box.encode(value)
        case .array(let value): try box.encode(value)
        case .string(let value): try box.encode(value)
        case .number(let value): try box.encode(value)
        case .bool(let value): try box.encode(value)
        case .null: try box.encodeNil()
        }
    }
    subscript(_ key: String) -> JSONValue? {
        get { guard case .object(let object) = self else { return nil }; return object[key] }
        set { guard case .object(var object) = self else { return }; object[key] = newValue; self = .object(object) }
    }
    var object: [String: JSONValue] { if case .object(let value) = self { return value }; return [:] }
    var array: [JSONValue] { if case .array(let value) = self { return value }; return [] }
    var string: String? { if case .string(let value) = self { return value }; return nil }
    var int: Int? { if case .number(let value) = self { return Int(value) }; return nil }
    var bool: Bool? { if case .bool(let value) = self { return value }; return nil }
    static func text(_ value: String) -> JSONValue { .string(value) }
    static func list(_ value: [JSONValue]) -> JSONValue { .array(value) }
    static func num(_ value: Int) -> JSONValue { .number(Double(value)) }
}

struct ModelSettings: Codable, Equatable {
    var baseURL: String
    var model: String
    var apiKeyConfigured: Bool
    var apiKey: String = ""
    var clearApiKey: Bool = false
    enum CodingKeys: String, CodingKey { case baseURL, model, apiKeyConfigured, apiKey, clearApiKey }
    init(baseURL: String, model: String, apiKeyConfigured: Bool, apiKey: String = "", clearApiKey: Bool = false) { self.baseURL = baseURL; self.model = model; self.apiKeyConfigured = apiKeyConfigured; self.apiKey = apiKey; self.clearApiKey = clearApiKey }
    init(from decoder: Decoder) throws { let values = try decoder.container(keyedBy: CodingKeys.self); baseURL = try values.decode(String.self, forKey: .baseURL); model = try values.decode(String.self, forKey: .model); apiKeyConfigured = try values.decode(Bool.self, forKey: .apiKeyConfigured); apiKey = try values.decodeIfPresent(String.self, forKey: .apiKey) ?? ""; clearApiKey = false }
}

@MainActor
final class AppModel: ObservableObject {
    @Published var workspace: JSONValue = .object([:])
    @Published var route = "prepare"
    @Published var selectedStoryID: String?
    @Published var connected = false
    @Published var busy = false
    @Published var activity = ""
    @Published var error = ""
    @Published var notice = ""
    @Published var input = ""
    @Published var stage: JSONValue?
    @Published var paused = false
    @Published var transcript = ""
    @Published var presenting = false
    @Published var starting = false
    @Published var settings = ModelSettings(baseURL: "http://127.0.0.1:11434/v1", model: "qwen3.5:4b", apiKeyConfigured: false)
    @Published var settingsStatus = ""
    @Published var settingsWorking = false
    private var process: Process?
    private var socket: URLSessionWebSocketTask?
    private(set) var port: UInt16 = 0
    private var pendingStorySave = false
    private var speech: LocalSpeechCapture?
    private var workspaceGeneration = 0
    private var workspaceSaveTask: Task<Void, Never>?

    var projects: [JSONValue] { workspace["projects"]?.array ?? [] }
    var stories: [JSONValue] { workspace["stories"]?.array ?? [] }
    var activeProject: JSONValue { projects.first(where: { $0["id"]?.string == workspace["activeProjectId"]?.string }) ?? projects.first ?? .object([:]) }
    var state: JSONValue { activeProject["state"] ?? .object([:]) }
    var flow: JSONValue? { state["flow"] }
    var messages: [JSONValue] {
        (state["messages"]?["interview"]?.array ?? []) + (state["messages"]?["storyteller"]?.array ?? [])
    }
    var storyBeats: [JSONValue] { flow?["beats"]?.array ?? [] }
    var selectedStory: JSONValue? { stories.first(where: { $0["id"]?.string == selectedStoryID }) }
    var selectedState: JSONValue? { selectedStory?["state"] }
    var selectedFlow: JSONValue? { selectedState?["flow"] }
    var pendingPreparation: JSONValue? { activeProject["pendingPreparation"] }

    func start() async {
        guard process == nil else { return }
        do {
            try launchCoordinator()
            try await waitUntilReady()
            await loadWorkspace()
            try await loadSettings()
            await connect()
        } catch { self.error = error.localizedDescription }
    }

    private func appData() throws -> URL {
        let root = try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("Omnipresent", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root
    }

    private func launchCoordinator() throws {
        let resources = Bundle.main.resourceURL ?? URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
        let appDirectory = resources.appendingPathComponent("app", isDirectory: true)
        let bundledNode = resources.appendingPathComponent("node/bin/node")
        let nodePath = ProcessInfo.processInfo.environment["OMNIPRESENT_NODE_BINARY"] ?? (FileManager.default.isExecutableFile(atPath: bundledNode.path) ? bundledNode.path : "/opt/homebrew/bin/node")
        let serverPath = appDirectory.appendingPathComponent("server.mjs")
        guard FileManager.default.fileExists(atPath: serverPath.path) else { throw NSError(domain: "Omnipresent", code: 1, userInfo: [NSLocalizedDescriptionKey: "The local coordinator is missing from this app build."]) }
        port = Self.availablePort()
        let data = try appData()
        let child = Process()
        child.executableURL = URL(fileURLWithPath: nodePath)
        child.arguments = [serverPath.path, "--production"]
        child.currentDirectoryURL = appDirectory
        child.environment = ProcessInfo.processInfo.environment.merging([
            "PORT": String(port), "OMNIPRESENT_DATA_DIR": data.path,
            "OMNIPRESENT_SETTINGS_PATH": data.appendingPathComponent("settings.json").path,
            "OMNIPRESENT_DB_PATH": data.appendingPathComponent("omnipresent.sqlite").path,
            "OMNIPRESENT_MATERIALS_PATH": data.appendingPathComponent("materials", isDirectory: true).path,
            "OMNIPRESENT_MODEL_CACHE_DIR": data.appendingPathComponent("models/huggingface", isDirectory: true).path,
        ]) { _, value in value }
        let stdoutURL = data.appendingPathComponent("coordinator.log")
        let stderrURL = data.appendingPathComponent("coordinator-error.log")
        if FileManager.default.fileExists(atPath: stdoutURL.path) { try? FileManager.default.removeItem(at: stdoutURL) }
        if FileManager.default.fileExists(atPath: stderrURL.path) { try? FileManager.default.removeItem(at: stderrURL) }
        _ = FileManager.default.createFile(atPath: stdoutURL.path, contents: nil)
        _ = FileManager.default.createFile(atPath: stderrURL.path, contents: nil)
        child.standardOutput = try FileHandle(forWritingTo: stdoutURL)
        child.standardError = try FileHandle(forWritingTo: stderrURL)
        try child.run(); process = child
    }

    private static func availablePort() -> UInt16 {
        let fd = Darwin.socket(AF_INET, SOCK_STREAM, 0)
        guard fd >= 0 else { return 4317 }
        defer { close(fd) }
        var address = sockaddr_in(); address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size); address.sin_family = sa_family_t(AF_INET); address.sin_port = 0; address.sin_addr = in_addr(s_addr: in_addr_t(0x0100007f))
        let result = withUnsafePointer(to: &address) { pointer in pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) } }
        guard result == 0 else { return 4317 }
        var length = socklen_t(MemoryLayout<sockaddr_in>.size)
        let readResult = withUnsafeMutablePointer(to: &address) { pointer in pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { getsockname(fd, $0, &length) } }
        return readResult == 0 ? UInt16(bigEndian: address.sin_port) : 4317
    }

    private func waitUntilReady() async throws {
        for _ in 0..<120 {
            if process?.isRunning == false { throw NSError(domain: "Omnipresent", code: 2, userInfo: [NSLocalizedDescriptionKey: "The local coordinator exited during startup."]) }
            if let response = try? await URLSession.shared.data(from: url("/api/health")).0, !response.isEmpty { return }
            try await Task.sleep(for: .milliseconds(100))
        }
        throw NSError(domain: "Omnipresent", code: 3, userInfo: [NSLocalizedDescriptionKey: "The local coordinator did not become ready."])
    }

    private func url(_ path: String) -> URL { URL(string: "http://127.0.0.1:\(port)\(path)")! }
    private func request(_ path: String, method: String = "GET", body: Data? = nil) -> URLRequest {
        var request = URLRequest(url: url(path)); request.httpMethod = method; request.httpBody = body
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        return request
    }
    private func decode(_ data: Data) throws -> JSONValue { try JSONDecoder().decode(JSONValue.self, from: data) }

    func loadWorkspace() async {
        do {
            let (data, response) = try await URLSession.shared.data(for: request("/api/workspace"))
            guard (response as? HTTPURLResponse)?.statusCode == 200, let value = try decode(data)["workspace"] else { throw NSError(domain: "Omnipresent", code: 4, userInfo: [NSLocalizedDescriptionKey: "Could not load the local workspace."]) }
            workspace = value
            if activeProject.object.isEmpty { createProject() }
            if pendingPreparation?["status"]?.string == "working" {
                updatePendingPreparation(status: "interrupted")
            }
        } catch { self.error = error.localizedDescription }
    }

    func saveWorkspace() {
        workspaceGeneration += 1; let generation = workspaceGeneration
        guard let data = try? JSONEncoder().encode(workspace) else { error = "Workspace could not be encoded."; return }
        let previous = workspaceSaveTask
        workspaceSaveTask = Task { [weak self] in
            await previous?.value
            guard let self else { return }
            do { let (_, response) = try await URLSession.shared.data(for: self.request("/api/workspace", method: "PUT", body: data)); guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw NSError(domain: "Omnipresent", code: 5, userInfo: [NSLocalizedDescriptionKey: "Workspace save failed."]) }; if generation == self.workspaceGeneration { self.error = "" } }
            catch { if generation == self.workspaceGeneration { self.error = error.localizedDescription } }
        }
    }

    func createProject() {
        let now = Int(Date().timeIntervalSince1970 * 1000), id = UUID().uuidString
        let messages: JSONValue = .object(["interview": .array([]), "storyteller": .array([])])
        let state: JSONValue = .object(["revision": .num(0), "brief": .null, "flow": .null, "flowBasedOnRevision": .null, "approvedRevision": .null, "artifacts": .array([]), "messages": messages, "events": .array([])])
        let project: JSONValue = .object(["id": .text(id), "title": .text("New presentation"), "createdAt": .num(now), "updatedAt": .num(now), "state": state, "composer": .text("")])
        var all = projects; all.append(project); workspace["projects"] = .list(all); workspace["activeProjectId"] = .text(id); route = "prepare"; saveWorkspace()
        Task { await send(["type": .text("preparation_open"), "state": state]) }
    }

    func selectProject(_ id: String) async {
        workspace["activeProjectId"] = .text(id); route = "prepare"; saveWorkspace()
        await send(["type": .text("preparation_open"), "state": activeProject["state"] ?? .object([:])])
    }

    func removeProject(_ id: String) {
        var rest = projects.filter { $0["id"]?.string != id }
        if rest.isEmpty { createProject(); rest = projects }
        let removed = workspace["removedProjects"]?.array ?? []
        let target = projects.first { $0["id"]?.string == id }
        workspace["projects"] = .list(rest)
        if workspace["activeProjectId"]?.string == id { workspace["activeProjectId"] = rest.first?["id"] ?? .null }
        if let target { workspace["removedProjects"] = .list(removed + [target]) }
        saveWorkspace()
    }

    func sendChat() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !busy else { return }
        let role = flow == nil || flow == .null ? "interview" : "storyteller"
        input = ""; busy = true
        beginPendingPreparation(kind: "message", text: text, role: role)
        await workspaceSaveTask?.value
        await send(["type": .text("agent_turn"), "role": .text(role), "text": .text(text)])
    }

    func finishInterview() async {
        guard !busy else { return }
        busy = true
        beginPendingPreparation(kind: "finishInterview", text: "", role: "interview")
        await workspaceSaveTask?.value
        await send(["type": .text("finish_interview")])
    }
    func cancelAgent() async {
        await send(["type": .text("agent_cancel")]); busy = false
        updatePendingPreparation(status: "interrupted")
    }
    func retryPendingPreparation() async {
        guard let pending = pendingPreparation else { return }
        let kind = pending["kind"]?.string ?? "message"
        let text = pending["text"]?.string ?? ""
        let role = pending["role"]?.string ?? "interview"
        busy = true; error = ""
        updatePendingPreparation(status: "working")
        await workspaceSaveTask?.value
        if kind == "finishInterview" {
            await send(["type": .text("finish_interview")])
        } else {
            await send(["type": .text("agent_turn"), "role": .text(role), "text": .text(text)])
        }
    }
    func dismissPendingPreparation() { updatePendingPreparation(status: nil) }

    private func beginPendingPreparation(kind: String, text: String, role: String) {
        let pending: JSONValue = .object([
            "kind": .text(kind), "text": .text(text), "role": .text(role),
            "status": .text("working"), "baseRevision": state["revision"] ?? .num(0),
            "startedAt": .num(Int(Date().timeIntervalSince1970 * 1000)),
        ])
        updatePendingPreparation(value: pending)
    }

    private func updatePendingPreparation(status: String?) {
        guard var pending = pendingPreparation else { return }
        if let status { pending["status"] = .text(status); updatePendingPreparation(value: pending) }
        else { updatePendingPreparation(value: nil) }
    }

    private func updatePendingPreparation(value: JSONValue?) {
        var all = projects
        guard let index = all.firstIndex(where: { $0["id"]?.string == workspace["activeProjectId"]?.string }) else { return }
        all[index]["pendingPreparation"] = value
        workspace["projects"] = .list(all)
        saveWorkspace()
    }

    func approveStory() async { pendingStorySave = true; await send(["type": .text("flow_approve")]) }

    private func storePreparation(_ newState: JSONValue) {
        var all = projects
        guard let index = all.firstIndex(where: { $0["id"]?.string == workspace["activeProjectId"]?.string }) else { return }
        all[index]["state"] = newState
        all[index]["updatedAt"] = .num(Int(Date().timeIntervalSince1970 * 1000))
        if let pending = all[index]["pendingPreparation"], pending["status"]?.string == "working" {
            let finished = pending["kind"]?.string == "finishInterview"
                ? newState["flow"] != .null
                : (newState["revision"]?.int ?? 0) > (pending["baseRevision"]?.int ?? 0)
            if finished { all[index]["pendingPreparation"] = nil }
        }
        if let title = newState["flow"]?["title"]?.string { all[index]["title"] = .text(title) }
        workspace["projects"] = .list(all)
        if pendingStorySave, newState["flow"] != .null, newState["approvedRevision"] == newState["revision"] {
            pendingStorySave = false
            let projectID = all[index]["id"]?.string ?? ""
            let existing = stories.first { $0["projectId"]?.string == projectID }
            let story: JSONValue = .object(["id": existing?["id"] ?? .text(UUID().uuidString), "projectId": .text(projectID), "savedAt": .num(Int(Date().timeIntervalSince1970 * 1000)), "state": newState])
            workspace["stories"] = .list(stories.filter { $0["projectId"]?.string != projectID } + [story]); route = "canvas"; notice = "Story saved to Canvas."
        }
        saveWorkspace()
    }

    func removeStory(_ id: String) {
        guard let target = stories.first(where: { $0["id"]?.string == id }) else { return }
        workspace["stories"] = .list(stories.filter { $0["id"]?.string != id }); workspace["removedStories"] = .list((workspace["removedStories"]?.array ?? []) + [target]); saveWorkspace()
    }

    func attachMaterial(_ file: URL) async {
        guard let data = try? Data(contentsOf: file), data.count <= 8_000_000 else { error = "Choose a file smaller than 8 MB."; return }
        var request = URLRequest(url: url("/api/materials")); request.httpMethod = "POST"; request.setValue(file.lastPathComponent.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? file.lastPathComponent, forHTTPHeaderField: "X-File-Name"); request.httpBody = data
        do {
            let (body, response) = try await URLSession.shared.data(for: request)
            let value = try decode(body)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw NSError(domain: "Omnipresent", code: 9, userInfo: [NSLocalizedDescriptionKey: value["error"]?.string ?? "Could not read this material."]) }
            var artifact = value.object; artifact["type"] = .text("artifact_add"); await send(artifact)
        } catch { self.error = error.localizedDescription }
    }

    func chooseStory(_ id: String?) { selectedStoryID = id; stage = nil; presenting = false }
    func startPresentation() async {
        guard let story = selectedStory, let state = story["state"] else { return }
        starting = true; error = ""
        await send(["type": .text("presentation_load"), "engine": .text("adaptive"), "state": state, "projectId": story["projectId"] ?? .null, "storyId": story["id"] ?? .null, "sessionId": .text("\(story["projectId"]?.string ?? ""):\(story["id"]?.string ?? "")")])
    }
    func stopPresentation() async { speech?.stop(); speech = nil; await send(["type": .text("presentation_stop")]); presenting = false; starting = false; stage = nil }
    func togglePause() async { paused.toggle(); speech?.setPaused(paused); await send(["type": .text("pause"), "value": .bool(paused)]) }
    func cue(_ index: Int) async { await send(["type": .text("presentation_cue"), "beatIndex": .num(index)]) }
    func loadSettings() async throws {
        let (data, response) = try await URLSession.shared.data(for: request("/api/settings/model"))
        guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw NSError(domain: "Omnipresent", code: 6, userInfo: [NSLocalizedDescriptionKey: "Could not load model settings."]) }
        settings = try JSONDecoder().decode(ModelSettings.self, from: data)
    }
    func saveSettings() async {
        settingsWorking = true; settingsStatus = ""
        defer { settingsWorking = false }
        do {
            var body: [String: JSONValue] = ["baseURL": .text(settings.baseURL), "model": .text(settings.model)]
            if !settings.apiKey.isEmpty { body["apiKey"] = .text(settings.apiKey) }
            if settings.clearApiKey { body["clearApiKey"] = .bool(true) }
            let data = try JSONEncoder().encode(JSONValue.object(body)); let (responseData, response) = try await URLSession.shared.data(for: request("/api/settings/model", method: "PUT", body: data))
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { let message = (try? decode(responseData)["error"]?.string) ?? "Settings could not be saved."; throw NSError(domain: "Omnipresent", code: 7, userInfo: [NSLocalizedDescriptionKey: message]) }
            settings = try JSONDecoder().decode(ModelSettings.self, from: responseData); settingsStatus = "Saved. New preparation turns will use this model."
        } catch { settingsStatus = error.localizedDescription }
    }
    func testSettings() async {
        await saveSettings(); guard settingsStatus.hasPrefix("Saved") else { return }
        settingsWorking = true; defer { settingsWorking = false }
        do {
            var request = request("/api/settings/model/test", method: "POST"); request.httpBody = Data("{}".utf8)
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { let message = (try? decode(data)["error"]?.string) ?? "The endpoint did not respond."; throw NSError(domain: "Omnipresent", code: 8, userInfo: [NSLocalizedDescriptionKey: message]) }
            let result = try decode(data); settingsStatus = result["modelFound"]?.bool == true ? "Connected. Model is available at this endpoint." : (result["modelFound"]?.bool == false ? "Connected, but the selected model was not listed." : "Endpoint responded. Model availability could not be confirmed.")
        } catch { settingsStatus = error.localizedDescription }
    }

    private func connect() async {
        guard let url = URL(string: "ws://127.0.0.1:\(port)/session") else { return }
        let task = URLSession.shared.webSocketTask(with: url); socket = task; task.resume(); connected = true
        await send(["type": .text("preparation_open"), "state": activeProject["state"] ?? .object([:])])
        await receiveLoop(task)
    }
    private func receiveLoop(_ task: URLSessionWebSocketTask) async {
        while socket === task {
            do {
                let message = try await task.receive(); let data: Data
                switch message { case .data(let value): data = value; case .string(let value): data = Data(value.utf8); @unknown default: continue }
                let event = try JSONDecoder().decode(JSONValue.self, from: data)
                await handle(event)
            } catch {
                connected = false; busy = false
                if pendingPreparation?["status"]?.string == "working" { updatePendingPreparation(status: "interrupted") }
                try? await Task.sleep(for: .seconds(1)); break
            }
        }
        if !Task.isCancelled { await connect() }
    }
    private func send(_ event: [String: JSONValue]) async {
        guard let socket, let data = try? JSONEncoder().encode(JSONValue.object(event)), let text = String(data: data, encoding: .utf8) else { return }
        do { try await socket.send(.string(text)) } catch { connected = false; self.error = "The local presentation service disconnected." }
    }
    private func handle(_ event: JSONValue) async {
        switch event["type"]?.string {
        case "preparation":
            if let state = event["state"] {
                storePreparation(state)
                let finishingInterview = pendingPreparation?["kind"]?.string == "finishInterview"
                    && pendingPreparation?["status"]?.string == "working"
                    && state["flow"] == .null
                if !finishingInterview { busy = false; activity = "" }
            }
        case "agent_status":
            let finishingInterview = pendingPreparation?["kind"]?.string == "finishInterview"
                && pendingPreparation?["status"]?.string == "working"
                && (state["flow"] == nil || state["flow"] == .null)
            if event["status"]?.string == "working",
               pendingPreparation != nil,
               pendingPreparation?["status"]?.string != "working" {
                updatePendingPreparation(status: "working")
            }
            busy = event["status"]?.string == "working" || finishingInterview
            if event["status"]?.string != "working" {
                activity = ""
            }
        case "agent_activity": activity = event["label"]?.string ?? "Working…"
        case "agent_error", "error", "worker_error": error = event["message"]?.string ?? "The local service returned an error."; busy = false; starting = false; updatePendingPreparation(status: "failed")
        case "presentation_loaded": if let title = event["title"]?.string { notice = "Loaded \(title)" }; await send(["type": .text("presentation_start"), "requestId": .text("native-\(UUID().uuidString)")])
        case "presentation_ready": starting = false; do { speech = try await LocalSpeechCapture.start(onTranscript: { [weak self] text, final in Task { @MainActor in guard let self else { return }; self.transcript = text; await self.send(["type": .text("presentation_speech"), "text": .text(text), "final": .bool(final)]) } }); presenting = true } catch { self.error = error.localizedDescription; starting = false }
        case "stage": stage = event["stage"]
        case "snapshot": stage = event["stage"]; paused = event["paused"]?.bool ?? false
        case "transcript": transcript = event["text"]?.string ?? transcript
        case "presentation_stopped": presenting = false; starting = false
        default: break
        }
    }
    deinit { process?.terminate(); socket?.cancel(with: .goingAway, reason: nil) }
}
