//
//  IRFloatingButton.swift
//  ImagineRead
//
//  Design System Component: Floating Action Button
//

import SwiftUI

/// Floating Action Button with gradient and shadow
struct IRFloatingButton: View {
    let icon: String
    let size: CGFloat
    let action: () -> Void
    
    init(icon: String = "plus", size: CGFloat = 64, action: @escaping () -> Void) {
        self.icon = icon
        self.size = size
        self.action = action
    }
    
    var body: some View {
        Button(action: {
            hapticFeedback()
            action()
        }) {
            ZStack {
                Circle()
                    .fill(IRGradients.primary)
                    .frame(width: size, height: size)
                    .shadow(color: .purple.opacity(0.5), radius: 10, x: 0, y: 5)
                
                Image(systemName: icon)
                    .font(.system(size: size * 0.44, weight: .semibold))
                    .foregroundColor(.white)
            }
        }
        .buttonStyle(.plain)
    }
    
    private func hapticFeedback() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }
}

/// Positions a FAB in the typical bottom-right position
struct FloatingButtonPosition: ViewModifier {
    func body(content: Content) -> some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                content
            }
        }
        .padding(24)
    }
}

extension View {
    /// Positions view as a floating button (bottom-right)
    func floatingPosition() -> some View {
        modifier(FloatingButtonPosition())
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        
        IRFloatingButton(icon: "plus") {
            print("Tapped!")
        }
        .floatingPosition()
    }
}
