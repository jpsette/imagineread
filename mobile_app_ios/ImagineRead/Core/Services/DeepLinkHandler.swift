//
//  DeepLinkHandler.swift
//  ImagineRead
//
//  Handles deep links from ImagineRead Lite QR codes
//

import SwiftUI
import Combine

// MARK: - Deep Link Types

enum DeepLinkDestination: Equatable {
    case liteCode(String)           // imagineread://lite/{code}
    case comic(String)              // imagineread://comic/{id}
    case collection(String)         // imagineread://collection/{id}
    case settings                   // imagineread://settings
    case unknown
}

// MARK: - Handler

class DeepLinkHandler: ObservableObject {
    static let shared = DeepLinkHandler()
    
    /// Current pending destination from deep link
    @Published var pendingDestination: DeepLinkDestination?
    
    /// Pending Lite code to download
    @Published var pendingLiteCode: String?
    
    /// Should show the add comic sheet
    @Published var shouldShowAddSheet = false
    
    /// Flag to show download in progress
    @Published var isProcessingDeepLink = false
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// Handle incoming URL
    func handle(_ url: URL) {
        guard url.scheme == "imagineread" else {
            pendingDestination = .unknown
            return
        }
        
        let host = url.host ?? ""
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        
        switch host {
        case "lite":
            // imagineread://lite/ABC123
            if let code = pathComponents.first {
                pendingLiteCode = code
                pendingDestination = .liteCode(code)
                shouldShowAddSheet = true
            }
            
        case "comic":
            // imagineread://comic/{id}
            if let id = pathComponents.first {
                pendingDestination = .comic(id)
            }
            
        case "collection":
            // imagineread://collection/{id}
            if let id = pathComponents.first {
                pendingDestination = .collection(id)
            }
            
        case "settings":
            pendingDestination = .settings
            
        default:
            // Try parsing path directly: imagineread://lite/ABC123
            if url.path.hasPrefix("/lite/") {
                let code = String(url.path.dropFirst("/lite/".count))
                if !code.isEmpty {
                    pendingLiteCode = code
                    pendingDestination = .liteCode(code)
                    shouldShowAddSheet = true
                }
            } else {
                pendingDestination = .unknown
            }
        }
    }
    
    /// Clear pending state
    func clearPending() {
        pendingDestination = nil
        pendingLiteCode = nil
        shouldShowAddSheet = false
        isProcessingDeepLink = false
    }
    
    /// Process the pending lite code (called from AddComicSheet)
    func consumeLiteCode() -> String? {
        let code = pendingLiteCode
        pendingLiteCode = nil
        return code
    }
}

// MARK: - View Extension

extension View {
    /// Modifier to handle deep links
    func handleDeepLinks() -> some View {
        self.modifier(DeepLinkModifier())
    }
}

struct DeepLinkModifier: ViewModifier {
    @EnvironmentObject var deepLinkHandler: DeepLinkHandler
    
    func body(content: Content) -> some View {
        content
            .onOpenURL { url in
                deepLinkHandler.handle(url)
            }
    }
}

// MARK: - Preview

#if DEBUG
extension DeepLinkHandler {
    static var preview: DeepLinkHandler {
        let handler = DeepLinkHandler()
        return handler
    }
}
#endif
