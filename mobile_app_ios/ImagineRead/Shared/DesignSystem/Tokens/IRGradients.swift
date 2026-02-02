//
//  IRGradients.swift
//  ImagineRead
//
//  Design System: Reusable Gradients
//

import SwiftUI

/// Reusable gradients for the ImagineRead app
enum IRGradients {
    
    // MARK: - Primary Gradients
    
    /// Primary brand gradient (purple → blue)
    static let primary = LinearGradient(
        colors: [.purple, .blue],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    /// Horizontal primary gradient
    static let primaryHorizontal = LinearGradient(
        colors: [.purple, .blue],
        startPoint: .leading,
        endPoint: .trailing
    )
    
    // MARK: - Status Gradients
    
    /// Success gradient (green → teal)
    static let success = LinearGradient(
        colors: [.green, .teal],
        startPoint: .leading,
        endPoint: .trailing
    )
    
    /// Warning gradient (yellow → orange)
    static let warning = LinearGradient(
        colors: [.yellow, .orange],
        startPoint: .leading,
        endPoint: .trailing
    )
    
    /// Cyan gradient (cyan → blue)
    static let cyan = LinearGradient(
        colors: [.cyan, .blue],
        startPoint: .leading,
        endPoint: .trailing
    )
    
    // MARK: - Background
    
    /// App background gradient
    static let background = LinearGradient(
        colors: [IRColors.backgroundTop, IRColors.backgroundBottom],
        startPoint: .top,
        endPoint: .bottom
    )
    
    // MARK: - Subtle
    
    /// Subtle purple overlay
    static let purpleOverlay = LinearGradient(
        colors: [Color.purple.opacity(0.3), Color.blue.opacity(0.2)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
