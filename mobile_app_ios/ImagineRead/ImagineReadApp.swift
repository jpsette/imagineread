//
//  ImagineReadApp.swift
//  ImagineRead
//
//  Created by ImagineClub
//

import SwiftUI

@main
struct ImagineReadApp: App {
    
    // Create the shared container
    @StateObject private var container = AppContainer.shared
    
    // Deep link handler
    @StateObject private var deepLinkHandler = DeepLinkHandler.shared
    
    // Lite download service
    @StateObject private var liteService = LiteDownloadService.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(container)
                .environmentObject(container.localization)
                .environmentObject(container.preferences)
                .environmentObject(deepLinkHandler)
                .environmentObject(liteService)
                .onOpenURL { url in
                    handleIncomingURL(url)
                }
        }
    }
    
    // MARK: - URL Handling
    
    private func handleIncomingURL(_ url: URL) {
        print("📱 Deep link received: \(url)")
        deepLinkHandler.handle(url)
    }
}
