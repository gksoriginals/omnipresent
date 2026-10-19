import SwiftUI
import Charts

struct RootView: View {
    @ObservedObject var model: AppModel
    @Environment(\.openSettings) private var openSettings

    var body: some View {
        NavigationSplitView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 10) {
                    Image(systemName: "rectangle.on.rectangle.angled").font(.system(size: 18, weight: .semibold)).foregroundStyle(Color(red: 0.20, green: 0.39, blue: 0.29))
                    Text("Omnipresent").font(.system(size: 18, weight: .semibold, design: .rounded))
                }.padding(.horizontal, 14).padding(.top, 18)
                VStack(spacing: 3) {
                    sidebarItem("Prepare", icon: "text.bubble", route: "prepare")
                    sidebarItem("Canvas", icon: "rectangle.inset.filled", route: "canvas")
                }.padding(.horizontal, 8)
                if model.route == "prepare" {
                    HStack {
                        Text("SESSIONS").font(.system(size: 10, weight: .semibold)).tracking(0.8).foregroundStyle(.secondary)
                        Spacer()
                        Button { model.createProject() } label: { Image(systemName: "plus").font(.system(size: 12, weight: .medium)) }.buttonStyle(.plain).help("New session")
                    }.padding(.horizontal, 14).padding(.top, 14)
                    ScrollView {
                        VStack(spacing: 3) {
                            ForEach(model.projects.indices, id: \.self) { index in
                                let project = model.projects[index]
                                let id = project["id"]?.string ?? ""
                                Button { Task { await model.selectProject(id) } } label: {
                                    HStack(spacing: 9) {
                                        Image(systemName: "bubble.left").font(.system(size: 12)).foregroundStyle(.secondary)
                                        Text(project["title"]?.string ?? "New presentation").lineLimit(1)
                                        Spacer(minLength: 0)
                                    }.font(.system(size: 12)).padding(.vertical, 8).padding(.horizontal, 10)
                                        .background(model.workspace["activeProjectId"]?.string == id ? Color(red: 0.30, green: 0.55, blue: 0.39).opacity(0.18) : .clear, in: RoundedRectangle(cornerRadius: 6))
                                }.buttonStyle(.plain).contextMenu { Button("Remove session", role: .destructive) { model.removeProject(id) } }
                            }
                        }.padding(.horizontal, 8)
                    }
                }
                Spacer(minLength: 4)
                HStack(spacing: 8) {
                    Circle().fill(model.connected ? Color.green : Color.orange).frame(width: 7, height: 7)
                    Text(model.connected ? "On this Mac" : "Starting local service…").font(.system(size: 11)).foregroundStyle(.secondary)
                }.padding(.horizontal, 15).padding(.bottom, 14)
            }
            .frame(minWidth: 205)
            .background(Color(nsColor: .windowBackgroundColor))
            .navigationSplitViewColumnWidth(min: 190, ideal: 220, max: 260)
        } detail: {
            VStack(spacing: 0) {
                HStack(spacing: 14) {
                    Text(model.route == "prepare" ? (model.state["flow"] == .null ? "Prepare" : "Story") : "Canvas")
                        .font(.system(size: 14, weight: .semibold))
                    Text(model.activeProject["title"]?.string ?? "").font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(1)
                    Spacer()
                    if !model.notice.isEmpty { Text(model.notice).font(.system(size: 11)).foregroundStyle(.secondary).lineLimit(1) }
                    if model.presenting {
                        Button { Task { await model.togglePause() } } label: { Label(model.paused ? "Resume" : "Pause", systemImage: model.paused ? "play.fill" : "pause.fill") }.buttonStyle(.bordered)
                        Button("End") { Task { await model.stopPresentation() } }.buttonStyle(.borderedProminent).tint(Color(red: 0.22, green: 0.39, blue: 0.29))
                    }
                    Button { openSettings() } label: { Image(systemName: "slider.horizontal.3") }.buttonStyle(.borderless).help("Model settings")
                }.padding(.horizontal, 22).padding(.vertical, 13).background(.bar)
                if !model.error.isEmpty {
                    HStack { Text(model.error).font(.system(size: 12)); Spacer(); Button("Dismiss") { model.error = "" }.buttonStyle(.plain) }
                        .padding(.horizontal, 18).padding(.vertical, 8).background(Color.red.opacity(0.08)).foregroundStyle(Color.red)
                }
                if model.route == "prepare" { PrepareWorkspace(model: model) }
                else { CanvasWorkspace(model: model) }
            }
            .background(Color(nsColor: .textBackgroundColor))
            .toolbar { ToolbarItem(placement: .automatic) { Button { openSettings() } label: { Label("Settings", systemImage: "gearshape") } } }
        }
        .navigationSplitViewStyle(.balanced)
    }

    private func sidebarItem(_ title: String, icon: String, route: String) -> some View {
        Button { model.route = route; if route == "canvas" { model.chooseStory(nil) } } label: {
            HStack(spacing: 10) { Image(systemName: icon).frame(width: 16); Text(title); Spacer() }
                .font(.system(size: 13, weight: model.route == route ? .medium : .regular)).padding(.vertical, 9).padding(.horizontal, 10)
                .background(model.route == route ? Color(red: 0.30, green: 0.55, blue: 0.39).opacity(0.18) : .clear, in: RoundedRectangle(cornerRadius: 6))
                .contentShape(Rectangle())
        }.buttonStyle(.plain)
    }
}

private struct PrepareWorkspace: View {
    @ObservedObject var model: AppModel
    @State private var uploadBusy = false
    var body: some View {
        HStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(model.state["flow"] == .null ? "Let's prepare your presentation" : "Refine the story")
                        .font(.system(size: 20, weight: .semibold, design: .rounded))
                    Text(model.state["flow"] == .null ? "Talk through the audience, purpose, and material." : "Chat with the storyteller. Your flow stays beside the conversation.")
                        .font(.system(size: 12)).foregroundStyle(.secondary)
                }.padding(.bottom, 18)
                Divider()
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 18) {
                            if model.messages.isEmpty && !model.busy {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("What are you presenting?").font(.system(size: 26, weight: .medium, design: .rounded))
                                    Text("Share the topic, who it is for, and what you want the audience to understand. You can attach source material as you go.").font(.system(size: 14)).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                                }.padding(.vertical, 30).id("empty")
                            }
                            ForEach(Array(model.messages.enumerated()), id: \.offset) { _, message in
                                HStack {
                                    if message["role"]?.string == "user" { Spacer(minLength: 38) }
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(message["role"]?.string == "user" ? "You" : "Omnipresent")
                                            .font(.system(size: 10, weight: .medium)).foregroundStyle(.secondary)
                                        Text(message["content"]?.string ?? "").font(.system(size: 13)).lineSpacing(4).textSelection(.enabled)
                                    }.padding(12).frame(maxWidth: .infinity, alignment: .leading)
                                        .background(message["role"]?.string == "user" ? Color(nsColor: .controlBackgroundColor) : .clear, in: RoundedRectangle(cornerRadius: 7))
                                    if message["role"]?.string != "user" { Spacer(minLength: 38) }
                                }.id("message-\(message["content"]?.string.hashValue ?? 0)")
                            }
                            if model.busy { HStack(spacing: 8) { ProgressView().controlSize(.small); Text(model.activity.isEmpty ? "Thinking…" : model.activity).font(.system(size: 12)).foregroundStyle(.secondary) }.padding(.vertical, 6) }
                        }.padding(.vertical, 14)
                    }
                    .onChange(of: model.messages.count) { _, _ in withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo("message-\(model.messages.last?["content"]?.string.hashValue ?? 0)", anchor: .bottom) } }
                }
                VStack(spacing: 8) {
                    if let artifacts = model.state["artifacts"]?.array, !artifacts.isEmpty {
                        ScrollView(.horizontal) { HStack { ForEach(Array(artifacts.enumerated()), id: \.offset) { _, item in Label(item["name"]?.string ?? "Material", systemImage: "paperclip").font(.system(size: 11)).padding(.horizontal, 8).padding(.vertical, 5).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 5)) } } }
                    }
                    VStack(spacing: 8) {
                        TextField(model.flow == nil || model.flow == .null ? "Describe the presentation you have in mind…" : "What should change in the story?", text: $model.input, axis: .vertical)
                            .lineLimit(2...5).font(.system(size: 13)).textFieldStyle(.plain).onSubmit { Task { await model.sendChat() } }
                        HStack {
                            Button { chooseMaterial() } label: { Image(systemName: "paperclip") }.buttonStyle(.plain).help("Attach a file")
                            Spacer()
                            if model.busy { Button("Stop") { Task { await model.cancelAgent() } }.buttonStyle(.bordered) }
                            else { Button { Task { await model.sendChat() } } label: { Label("Send", systemImage: "arrow.up") }.buttonStyle(.borderedProminent).tint(Color(red: 0.22, green: 0.39, blue: 0.29)).disabled(!model.connected || model.input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || uploadBusy) }
                        }
                    }.padding(12).background(Color(nsColor: .textBackgroundColor), in: RoundedRectangle(cornerRadius: 8)).overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(nsColor: .separatorColor), lineWidth: 1))
                    if model.flow == nil || model.flow == .null {
                        HStack { Spacer(); Button { Task { await model.finishInterview() } } label: { Label("Create story from conversation", systemImage: "arrow.right") }.buttonStyle(.bordered).disabled(model.messages.isEmpty || model.busy || !model.connected) }
                    }
                }.padding(.top, 10)
            }.padding(20).frame(minWidth: 380, maxWidth: .infinity, maxHeight: .infinity)
            Divider()
            StoryPanel(model: model).frame(minWidth: 350, idealWidth: 460, maxWidth: 600, maxHeight: .infinity)
        }
    }

    private func chooseMaterial() {
        let panel = NSOpenPanel(); panel.allowsMultipleSelection = true; panel.canChooseDirectories = false; panel.allowedContentTypes = [.pdf, .plainText, .commaSeparatedText, .image, .spreadsheet, .presentation, .data]
        guard panel.runModal() == .OK else { return }
        Task { for file in panel.urls { await model.attachMaterial(file) } }
    }
}

private struct StoryPanel: View {
    @ObservedObject var model: AppModel
    var body: some View {
        Group {
            if let flow = model.flow, flow != .null {
                VStack(alignment: .leading, spacing: 0) {
                    HStack { Text("Story").font(.system(size: 13, weight: .semibold)); Spacer(); Text("\(model.storyBeats.count) scenes").font(.system(size: 11)).foregroundStyle(.secondary) }.padding(.bottom, 18)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 0) {
                            Text(flow["title"]?.string ?? "Untitled story").font(.system(size: 25, weight: .medium, design: .rounded)).fixedSize(horizontal: false, vertical: true)
                            Text(flow["summary"]?.string ?? "").font(.system(size: 13)).foregroundStyle(.secondary).lineSpacing(4).padding(.top, 8)
                            ForEach(Array(model.storyBeats.enumerated()), id: \.offset) { index, beat in
                                HStack(alignment: .top, spacing: 12) {
                                    Text(String(format: "%02d", index + 1)).font(.system(size: 10, design: .monospaced)).foregroundStyle(.secondary).padding(.top, 3)
                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(beat["title"]?.string ?? "Scene").font(.system(size: 15, weight: .semibold))
                                        Text(beat["audienceText"]?.string ?? "").font(.system(size: 12)).foregroundStyle(.secondary).lineSpacing(3)
                                        if let direction = beat["visualDirection"]?.string, !direction.isEmpty { Label(direction, systemImage: "sparkle").font(.system(size: 10)).foregroundStyle(Color(red: 0.28, green: 0.44, blue: 0.34)).padding(.top, 2) }
                                    }.frame(maxWidth: .infinity, alignment: .leading)
                                }.padding(.vertical, 15).overlay(alignment: .top) { Rectangle().fill(Color(nsColor: .separatorColor).opacity(0.6)).frame(height: 1) }
                            }
                        }
                    }
                    Divider().padding(.top, 8)
                    HStack { Text(model.state["approvedRevision"] == model.state["revision"] ? "Ready for Canvas" : "Review before saving").font(.system(size: 11)).foregroundStyle(.secondary); Spacer(); Button { Task { await model.approveStory() } } label: { Label("Save story", systemImage: "bookmark") }.buttonStyle(.borderedProminent).tint(Color(red: 0.22, green: 0.39, blue: 0.29)).disabled(model.busy || !model.connected || model.state["flowBasedOnRevision"] == .null) }.padding(.top, 12)
                }.padding(20)
            } else {
                VStack(alignment: .leading, spacing: 10) { Image(systemName: "text.book.closed").font(.system(size: 22)).foregroundStyle(.secondary); Text("Your story will appear here").font(.system(size: 17, weight: .medium)); Text("Gather the context and attach material in the conversation. When the brief is ready, create a story to review it here.").font(.system(size: 12)).foregroundStyle(.secondary).lineSpacing(4) }.padding(28).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading).background(Color(nsColor: .controlBackgroundColor).opacity(0.35))
            }
        }.background(Color(nsColor: .textBackgroundColor))
    }
}

private struct CanvasWorkspace: View {
    @ObservedObject var model: AppModel
    var body: some View {
        if model.presenting, let story = model.selectedStory {
            LivePresentationView(model: model, story: story)
        } else if let story = model.selectedStory {
            VStack(spacing: 0) {
                HStack { Button { model.chooseStory(nil) } label: { Label("All stories", systemImage: "chevron.left") }.buttonStyle(.plain); Spacer(); Text(story["state"]?["flow"]?["title"]?.string ?? "Story").font(.system(size: 12)).foregroundStyle(.secondary); Spacer(); Color.clear.frame(width: 70) }.padding(16)
                Divider()
                VStack(alignment: .leading, spacing: 18) {
                    let beats = story["state"]?["flow"]?["beats"]?.array ?? []
                    if let first = beats.first {
                        Spacer()
                        Text(first["title"]?.string ?? "").font(.system(size: 38, weight: .medium, design: .rounded))
                        Text(first["audienceText"]?.string ?? "").font(.system(size: 20)).foregroundStyle(.secondary).lineSpacing(5)
                        Spacer()
                    }
                    HStack { Spacer(); Button { Task { await model.startPresentation() } } label: { Label(model.starting ? "Starting…" : "Start presentation", systemImage: "play.fill") }.buttonStyle(.borderedProminent).controlSize(.large).tint(Color(red: 0.22, green: 0.39, blue: 0.29)).disabled(!model.connected || model.starting); Spacer() }
                }.padding(54).frame(maxWidth: 900).frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    HStack(alignment: .firstTextBaseline) { VStack(alignment: .leading, spacing: 5) { Text("Your stories").font(.system(size: 28, weight: .semibold, design: .rounded)); Text("Choose a story and let the canvas follow your explanation.").font(.system(size: 12)).foregroundStyle(.secondary) }; Spacer(); Button { model.route = "prepare"; model.createProject() } label: { Label("New project", systemImage: "plus") }.buttonStyle(.bordered) }
                    if model.stories.isEmpty { ContentUnavailableView("No saved stories yet", systemImage: "rectangle.inset.filled", description: Text("Start a project in Prepare, shape its story, and save it to Canvas.")) }
                    else { LazyVGrid(columns: [GridItem(.adaptive(minimum: 250), spacing: 14)], spacing: 14) { ForEach(model.stories.indices, id: \.self) { index in storyCard(model.stories[index]) } } }
                }.padding(28)
            }
        }
    }
    private func storyCard(_ story: JSONValue) -> some View {
        Button { model.chooseStory(story["id"]?.string) } label: {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 10) {
                    let first = story["state"]?["flow"]?["beats"]?.array.first
                    Text(first?["title"]?.string ?? "Presentation").font(.system(size: 20, weight: .medium, design: .rounded)).lineLimit(3)
                    Text(first?["audienceText"]?.string ?? "").font(.system(size: 12)).foregroundStyle(.secondary).lineLimit(3)
                }.frame(maxWidth: .infinity, minHeight: 155, alignment: .leading).padding(18).background(Color(red: 0.94, green: 0.96, blue: 0.92))
                VStack(alignment: .leading, spacing: 7) {
                    Text(story["state"]?["flow"]?["title"]?.string ?? "Untitled story").font(.system(size: 14, weight: .semibold)).lineLimit(1)
                    Text("\(story["state"]?["flow"]?["beats"]?.array.count ?? 0) scenes").font(.system(size: 11)).foregroundStyle(.secondary)
                }.frame(maxWidth: .infinity, alignment: .leading).padding(16)
            }.background(Color(nsColor: .textBackgroundColor), in: RoundedRectangle(cornerRadius: 8)).overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(nsColor: .separatorColor), lineWidth: 1))
        }.buttonStyle(.plain).contextMenu { Button("Remove story", role: .destructive) { if let id = story["id"]?.string { model.removeStory(id) } } }
    }
}

private struct LivePresentationView: View {
    @ObservedObject var model: AppModel
    let story: JSONValue
    @Environment(\.openWindow) private var openWindow
    var body: some View {
        VStack(spacing: 0) {
            HStack { Text(story["state"]?["flow"]?["title"]?.string ?? "Presentation").font(.system(size: 13, weight: .medium)); Spacer(); if !model.transcript.isEmpty { Text(model.transcript).font(.system(size: 11)).foregroundStyle(.secondary).lineLimit(1) }; Button { openWindow(id: "audience") } label: { Label("Audience display", systemImage: "arrow.up.right.square") }.buttonStyle(.bordered); }.padding(14)
            Divider()
            let storyState = story["state"] ?? .object([:])
            let beats = storyState["flow"]?["beats"]?.array ?? []
            if let composition = model.stage?["composition"], let blocks = composition["adaptive"]?["blocks"]?.array, !blocks.isEmpty {
                HStack(spacing: 0) {
                    ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                        let index = block["beat"]?.int ?? 0
                        if let beat = beats[safe: index] { NativePresentationBlock(beat: beat, state: storyState, kind: block["kind"]?.string ?? "statement", model: model) }
                    }
                }.frame(maxWidth: 1300, maxHeight: .infinity).padding(30)
            } else if let beat = beats.first {
                NativePresentationBlock(beat: beat, state: storyState, kind: "statement", model: model).frame(maxWidth: 1200, maxHeight: .infinity).padding(42)
            } else { ContentUnavailableView("Waiting for the canvas", systemImage: "waveform") }
        }.background(Color(nsColor: .textBackgroundColor))
    }
}

private struct NativePresentationBlock: View {
    let beat: JSONValue
    let state: JSONValue
    let kind: String
    @ObservedObject var model: AppModel
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(title)
                .font(.system(size: 34, weight: .medium, design: .rounded)).fixedSize(horizontal: false, vertical: true)
            if kind == "statement" { Text(beat["audienceText"]?.string ?? "").font(.system(size: 22)).lineSpacing(5).foregroundStyle(.secondary) }
            if kind == "visual", let visual { NativeVisualView(spec: visual) }
            if kind == "image", let image, let url = URL(string: "http://127.0.0.1:\(model.port)\(image.url ?? "")") { AsyncImage(url: url) { $0.resizable().scaledToFit() } placeholder: { ProgressView() }.frame(maxHeight: 480) }
        }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center).padding(24)
    }
    private var title: String {
        if kind == "visual" { return visual?["title"]?.string ?? beat["title"]?.string ?? "" }
        if kind == "image" { return image?.alt ?? beat["title"]?.string ?? "" }
        return beat["title"]?.string ?? ""
    }
    private var visual: JSONValue? { guard let id = beat["visualId"]?.string else { return nil }; return state["visuals"]?.array.first { $0["id"]?.string == id }?["spec"] }
    private var image: (url: String?, alt: String?)? { guard let id = beat["imageArtifactId"]?.string, let item = state["artifacts"]?.array.first(where: { $0["id"]?.string == id }), let media = item["media"] else { return nil }; return (media["url"]?.string, media["alt"]?.string) }
}

private struct NativeVisualView: View {
    let spec: JSONValue
    var body: some View {
        if spec["kind"]?.string == "chart" {
            let rows = spec["data"]?.array ?? []
            Chart(rows.indices, id: \.self) { index in
                let row = rows[index]
                if spec["chartType"]?.string == "line" { LineMark(x: .value("", index), y: .value("", row["value"]?.int ?? 0)).foregroundStyle(Color(red: 0.22, green: 0.39, blue: 0.29)); PointMark(x: .value("", index), y: .value("", row["value"]?.int ?? 0)).foregroundStyle(Color(red: 0.22, green: 0.39, blue: 0.29)) }
                else { BarMark(x: .value("", index), y: .value("", row["value"]?.int ?? 0)).foregroundStyle(Color(red: 0.22, green: 0.39, blue: 0.29)) }
            }.chartXAxis { AxisMarks(values: Array(0..<rows.count)) { value in AxisValueLabel { if let index = value.as(Int.self), index < rows.count { Text(rows[index]["label"]?.string ?? "") } } } }.frame(height: 260)
        } else {
            let nodes = spec["nodes"]?.array ?? []
            HStack(spacing: 12) { ForEach(Array(nodes.enumerated()), id: \.offset) { index, node in if index > 0 { Image(systemName: "arrow.right").foregroundStyle(.secondary) }; Text(node.string ?? "").font(.system(size: 13, weight: .medium)).padding(.horizontal, 16).padding(.vertical, 12).background(Color(nsColor: .controlBackgroundColor), in: RoundedRectangle(cornerRadius: 7)).overlay(RoundedRectangle(cornerRadius: 7).stroke(Color(nsColor: .separatorColor), lineWidth: 1)) } }.frame(maxWidth: .infinity).padding(.vertical, 30)
        }
    }
}

struct AudienceDisplayView: View {
    @ObservedObject var model: AppModel
    var body: some View {
        Group { if let story = model.selectedStory { LivePresentationView(model: model, story: story) } else { ContentUnavailableView("Start a presentation to show the audience canvas", systemImage: "rectangle.inset.filled") } }
    }
}

struct ModelSettingsView: View {
    @ObservedObject var model: AppModel
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 5) { Text("Model settings").font(.system(size: 24, weight: .semibold, design: .rounded)); Text("Choose the model used by the interview and storyteller.").font(.system(size: 12)).foregroundStyle(.secondary) }
            Form {
                Section("Language model") {
                    TextField("OpenAI-compatible endpoint", text: $model.settings.baseURL).textFieldStyle(.roundedBorder)
                    TextField("Model name", text: $model.settings.model).textFieldStyle(.roundedBorder)
                    SecureField(model.settings.apiKeyConfigured ? "Saved key — leave blank to keep it" : "API key (optional for local models)", text: $model.settings.apiKey).textFieldStyle(.roundedBorder)
                    if model.settings.apiKeyConfigured { Toggle("Remove saved key", isOn: $model.settings.clearApiKey) }
                    Text("Local Ollama is the default. A remote endpoint receives your preparation conversation and uploaded text.").font(.system(size: 11)).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
                }
                Section("Live presentation") {
                    LabeledContent("Selection", value: "Local hybrid + evidence checks")
                    LabeledContent("Speech", value: "Apple on-device English recognition")
                    Text("Live selection stays local and does not use a billed decision model.").font(.system(size: 11)).foregroundStyle(.secondary)
                }
            }.formStyle(.grouped)
            if !model.settingsStatus.isEmpty { Text(model.settingsStatus).font(.system(size: 11)).foregroundStyle(model.settingsStatus.contains("Saved") || model.settingsStatus.contains("Connected") ? .green : .secondary).fixedSize(horizontal: false, vertical: true) }
            HStack { Button("Save & test connection") { Task { await model.testSettings() } }.disabled(model.settingsWorking); Spacer(); Button("Save") { Task { await model.saveSettings() } }.buttonStyle(.borderedProminent).tint(Color(red: 0.22, green: 0.39, blue: 0.29)).disabled(model.settingsWorking) }
        }.task { if !model.settingsWorking { try? await model.loadSettings() } }
    }
}

private extension Collection { subscript(safe index: Index) -> Element? { indices.contains(index) ? self[index] : nil } }
