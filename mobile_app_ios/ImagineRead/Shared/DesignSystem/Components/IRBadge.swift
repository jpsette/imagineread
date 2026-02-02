//
//  IRBadge.swift
//  ImagineRead
//
//  Design System Component: Status Badge
//

import SwiftUI

/// Style variants for IRBadge
enum IRBadgeStyle {
    case primary      // Purple-blue gradient
    case success      // Green-teal gradient
    case warning      // Yellow-orange gradient
    case info         // Cyan-blue gradient
    case neutral      // Gray/subtle
}

/// Reusable badge component for status indicators
struct IRBadge: View {
    let text: String
    let icon: String?
    let style: IRBadgeStyle
    
    init(_ text: String, icon: String? = nil, style: IRBadgeStyle = .primary) {
        self.text = text
        self.icon = icon
        self.style = style
    }
    
    var body: some View {
        HStack(spacing: 4) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 8, weight: .bold))
            }
            
            Text(text)
                .font(.caption2)
                .fontWeight(.bold)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(backgroundGradient)
        )
    }
    
    private var backgroundGradient: AnyShapeStyle {
        switch style {
        case .primary:
            return AnyShapeStyle(IRGradients.primaryHorizontal)
        case .success:
            return AnyShapeStyle(IRGradients.success)
        case .warning:
            return AnyShapeStyle(IRGradients.warning)
        case .info:
            return AnyShapeStyle(IRGradients.cyan)
        case .neutral:
            return AnyShapeStyle(Color.gray.opacity(0.6))
        }
    }
}

#Preview {
    VStack(spacing: 12) {
        IRBadge("Página 12/45", style: .primary)
        IRBadge("Lido", icon: "checkmark.circle.fill", style: .success)
        IRBadge("Novo", style: .warning)
        IRBadge("Offline", icon: "checkmark.circle.fill", style: .info)
    }
    .padding()
    .appBackground()
}
