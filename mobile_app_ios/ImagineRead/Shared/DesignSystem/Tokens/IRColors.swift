//
//  IRColors.swift
//  ImagineRead
//
//  Design System: Semantic Colors
//

import SwiftUI

/// Semantic colors for the ImagineRead app
enum IRColors {
    
    // MARK: - Background
    
    /// Dark background top color (RGB: 0.1, 0.1, 0.2)
    static let backgroundTop = Color(red: 0.1, green: 0.1, blue: 0.2)
    
    /// Dark background bottom color (RGB: 0.05, 0.05, 0.15)
    static let backgroundBottom = Color(red: 0.05, green: 0.05, blue: 0.15)
    
    // MARK: - Text
    
    /// Primary text color
    static let textPrimary = Color.white
    
    /// Secondary text color
    static let textSecondary = Color.white.opacity(0.7)
    
    /// Muted text color
    static let textMuted = Color.white.opacity(0.5)
    
    // MARK: - Semantic
    
    /// Success color
    static let success = Color.green
    
    /// Warning color
    static let warning = Color.orange
    
    /// Error color
    static let error = Color.red
    
    // MARK: - Accent
    
    /// Primary accent (purple)
    static let accentPrimary = Color.purple
    
    /// Secondary accent (blue)
    static let accentSecondary = Color.blue
    
    /// Pink accent (favorites)
    static let accentPink = Color.pink
    
    /// Cyan accent (downloads)
    static let accentCyan = Color.cyan
    
    // MARK: - Surface
    
    /// Card/surface background
    static let surface = Color.white.opacity(0.08)
    
    /// Elevated surface
    static let surfaceElevated = Color.white.opacity(0.12)
    
    /// Border color
    static let border = Color.white.opacity(0.1)
}
