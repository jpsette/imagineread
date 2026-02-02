//
//  SectionHeader.swift
//  ImagineRead
//
//  ViewModifier: Section header styling
//

import SwiftUI

/// Modifier that applies the standard section header style
struct SectionHeaderModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(.headline)
            .foregroundColor(IRColors.textSecondary)
    }
}

/// Modifier for small/label style headers
struct SectionLabelModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(.caption)
            .fontWeight(.bold)
            .textCase(.uppercase)
            .tracking(1)
            .foregroundColor(IRColors.textMuted)
    }
}

extension View {
    /// Applies the standard section header style
    func sectionHeader() -> some View {
        modifier(SectionHeaderModifier())
    }
    
    /// Applies small label/caption style for section headers
    func sectionLabel() -> some View {
        modifier(SectionLabelModifier())
    }
}
