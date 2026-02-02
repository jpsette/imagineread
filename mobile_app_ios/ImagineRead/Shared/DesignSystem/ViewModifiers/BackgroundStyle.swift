//
//  BackgroundStyle.swift
//  ImagineRead
//
//  ViewModifier: App background gradient
//

import SwiftUI

/// Modifier that applies the standard app background gradient
struct AppBackgroundModifier: ViewModifier {
    func body(content: Content) -> some View {
        ZStack {
            IRGradients.background
                .ignoresSafeArea()
            content
        }
    }
}

extension View {
    /// Applies the standard ImagineRead background gradient
    func appBackground() -> some View {
        modifier(AppBackgroundModifier())
    }
}
