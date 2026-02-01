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
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(container)
                .environmentObject(container.localization)
                .environmentObject(container.preferences)
        }
    }
}
