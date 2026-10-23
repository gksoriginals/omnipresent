import Foundation
import FoundationModels

@available(macOS 26.0, *)
@Generable
struct ProbeBeat {
    var title: String
    var claim: String
    var sourceIDs: [String]
}

@available(macOS 26.0, *)
@Generable
struct ProbeProposal {
    var title: String
    @Guide(.count(3))
    var beats: [ProbeBeat]
    var missingEvidence: [String]
    var questionForPresenter: String
}

@available(macOS 26.0, *)
@main
struct FoundationModelProbe {
    static func main() async throws {
        let model = SystemLanguageModel.default
        guard case .available = model.availability else {
            FileHandle.standardError.write(Data("Foundation Models unavailable: \(model.availability)\n".utf8))
            exit(2)
        }
        let input = try JSONDecoder().decode(Input.self, from: FileHandle.standardInput.readDataToEndOfFile())
        let session = LanguageModelSession(instructions: Instructions(input.instructions))
        let response = try await session.respond(to: input.prompt, generating: ProbeProposal.self)
        let output = Output(contextSize: model.contextSize, response: response.content.generatedContent.jsonString)
        let data = try JSONEncoder().encode(output)
        print(String(decoding: data, as: UTF8.self))
    }
}

struct Input: Decodable {
    let instructions: String
    let prompt: String
}

struct Output: Encodable {
    let contextSize: Int
    let response: String
}
