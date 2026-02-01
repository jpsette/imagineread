//
//  ReadingModeButton.swift
//  ImagineRead
//
//  Animated button for switching reading modes
//

import SwiftUI

/// Animated button that rotates to show reading direction
struct ReadingModeButton: View {
    @Binding var mode: ReadingMode
    
    @State private var isPressed = false
    
    var body: some View {
        Button {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                mode = mode.next
            }
            
            // Haptic feedback
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
        } label: {
            ZStack {
                // Background circle
                Circle()
                    .fill(.ultraThinMaterial)
                    .frame(width: 44, height: 44)
                    .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
                
                // Arrow icon that rotates
                Image(systemName: "arrow.right")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .rotationEffect(.degrees(mode.arrowRotation))
            }
            .scaleEffect(isPressed ? 0.9 : 1.0)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    withAnimation(.easeInOut(duration: 0.1)) {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    withAnimation(.easeInOut(duration: 0.1)) {
                        isPressed = false
                    }
                }
        )
        .accessibilityLabel("Modo de leitura: \(mode.displayName)")
        .accessibilityHint("Toque para alternar o modo de leitura")
    }
}

#Preview {
    ZStack {
        Color.black
        ReadingModeButton(mode: .constant(.horizontal))
    }
}
