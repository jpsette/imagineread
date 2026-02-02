//
//  IRButton.swift
//  ImagineRead
//
//  Design System Component: Primary Button
//

import SwiftUI

/// Style variants for IRButton
enum IRButtonStyle {
    case primary      // Purple-blue gradient
    case secondary    // Subtle background
    case ghost        // Text only
    case success      // Green-teal gradient
    case danger       // Red
}

/// Reusable button component with Design System styling
struct IRButton: View {
    let title: String
    let icon: String?
    let style: IRButtonStyle
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void
    
    init(
        _ title: String,
        icon: String? = nil,
        style: IRButtonStyle = .primary,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.style = style
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }
    
    var body: some View {
        Button(action: {
            hapticFeedback()
            action()
        }) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                        .tint(.white)
                } else if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 14, weight: .semibold))
                }
                
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .padding(.horizontal, 20)
            .foregroundColor(foregroundColor)
            .background(backgroundView)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: shadowColor, radius: 8, x: 0, y: 4)
        }
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled ? 0.5 : 1.0)
    }
    
    // MARK: - Styling
    
    @ViewBuilder
    private var backgroundView: some View {
        switch style {
        case .primary:
            IRGradients.primary
        case .secondary:
            IRColors.surface
        case .ghost:
            Color.clear
        case .success:
            IRGradients.success
        case .danger:
            Color.red
        }
    }
    
    private var foregroundColor: Color {
        switch style {
        case .ghost:
            return .purple
        default:
            return .white
        }
    }
    
    private var shadowColor: Color {
        switch style {
        case .primary:
            return .purple.opacity(0.4)
        case .success:
            return .green.opacity(0.3)
        case .danger:
            return .red.opacity(0.3)
        default:
            return .clear
        }
    }
    
    private func hapticFeedback() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }
}

#Preview {
    VStack(spacing: 16) {
        IRButton("Continuar Lendo", icon: "book.fill") {}
        IRButton("Baixar", icon: "icloud.and.arrow.down", style: .secondary) {}
        IRButton("Concluído", icon: "checkmark", style: .success) {}
        IRButton("Cancelar", style: .ghost) {}
    }
    .padding()
    .appBackground()
}
