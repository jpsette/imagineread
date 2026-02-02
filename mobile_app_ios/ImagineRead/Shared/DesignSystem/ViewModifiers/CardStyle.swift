//
//  CardStyle.swift
//  ImagineRead
//
//  ViewModifier: Card shadow and styling
//

import SwiftUI

/// Modifier that applies the standard card shadow
struct CardShadowModifier: ViewModifier {
    var radius: CGFloat = 10
    var y: CGFloat = 6
    
    func body(content: Content) -> some View {
        content
            .shadow(color: .black.opacity(0.4), radius: radius, x: 0, y: y)
    }
}

/// Modifier for interactive card style (shadow + corner radius + bg)
struct CardStyleModifier: ViewModifier {
    var cornerRadius: CGFloat = 12
    
    func body(content: Content) -> some View {
        content
            .background(IRColors.surface)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .modifier(CardShadowModifier())
    }
}

extension View {
    /// Applies the standard card shadow
    func cardShadow(radius: CGFloat = 10, y: CGFloat = 6) -> some View {
        modifier(CardShadowModifier(radius: radius, y: y))
    }
    
    /// Applies complete card styling (background + corner + shadow)
    func cardStyle(cornerRadius: CGFloat = 12) -> some View {
        modifier(CardStyleModifier(cornerRadius: cornerRadius))
    }
}
