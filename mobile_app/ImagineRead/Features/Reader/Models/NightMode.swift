//
//  NightMode.swift
//  ImagineRead
//
//  Night reading mode filters
//

import SwiftUI

/// Available night reading filters
enum NightMode: String, CaseIterable {
    case off       // Normal viewing
    case sepia     // Warm sepia tone
    case dark      // Reduced brightness
    
    /// Display icon for the mode
    var icon: String {
        switch self {
        case .off:   return "sun.max"
        case .sepia: return "moon"
        case .dark:  return "moon.fill"
        }
    }
    
    /// Display name
    var displayName: String {
        switch self {
        case .off:   return "Normal"
        case .sepia: return "Sépia"
        case .dark:  return "Noturno"
        }
    }
    
    /// Next mode in cycle
    var next: NightMode {
        switch self {
        case .off:   return .sepia
        case .sepia: return .dark
        case .dark:  return .off
        }
    }
    
    /// Whether this mode supports intensity control
    var hasIntensity: Bool {
        self != .off
    }
}

// MARK: - Night Mode Overlay

/// Applies night mode filter over content with variable intensity
struct NightModeOverlay: View {
    let mode: NightMode
    let intensity: Double // 0.0 to 1.0
    
    var body: some View {
        switch mode {
        case .off:
            Color.clear
        case .sepia:
            // Stronger sepia: base 15% + up to 35% more (total 15-50%)
            Color.orange.opacity(0.15 + (intensity * 0.35))
                .blendMode(.multiply)
        case .dark:
            // Stronger dark: base 20% + up to 50% more (total 20-70%)
            Color.black.opacity(0.20 + (intensity * 0.50))
                .blendMode(.normal)
        }
    }
}

// MARK: - Night Mode Button

struct NightModeButton: View {
    @Binding var mode: NightMode
    
    var body: some View {
        GlassButton(
            icon: mode.icon,
            action: {
                withAnimation(.easeInOut(duration: 0.3)) {
                    mode = mode.next
                }
                
                let generator = UIImpactFeedbackGenerator(style: .light)
                generator.impactOccurred()
            }
        )
    }
}

// MARK: - Intensity Slider

struct IntensitySlider: View {
    @Binding var intensity: Double
    let mode: NightMode
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: mode == .sepia ? "sun.min" : "moon")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.6))
            
            Slider(value: $intensity, in: 0...1)
                .tint(mode == .sepia ? .orange : .purple)
            
            Image(systemName: mode == .sepia ? "sun.max" : "moon.fill")
                .font(.system(size: 14))
                .foregroundColor(.white.opacity(0.6))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
        )
        .padding(.horizontal)
    }
}
