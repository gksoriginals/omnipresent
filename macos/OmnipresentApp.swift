import SwiftUI
import AppKit

@main
struct OmnipresentApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView(model: model)
                .tint(Color(red: 0.30, green: 0.55, blue: 0.39))
                .frame(minWidth: 1040, minHeight: 720)
                .task { await model.start() }
        }
        .commands {
            CommandGroup(replacing: .newItem) { }
        }
        Settings {
            ModelSettingsView(model: model)
                .frame(width: 560, height: 560)
                .padding(28)
                .tint(Color(red: 0.30, green: 0.55, blue: 0.39))
        }
        WindowGroup("Audience Display", id: "audience") {
            AudienceDisplayView(model: model)
                .frame(minWidth: 900, minHeight: 600)
                .tint(Color(red: 0.30, green: 0.55, blue: 0.39))
        }
    }
}
