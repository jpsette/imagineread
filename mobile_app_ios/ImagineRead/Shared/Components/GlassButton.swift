//
//  GlassButton.swift
//  ImagineRead
//
//  Premium Apple Glass Design button
//

import SwiftUI

/// Apple-style glass button with blur and subtle border
struct GlassButton: View {
    let icon: String
    let action: () -> Void
    var rotation: Double = 0
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: {
            // Haptic feedback
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            action()
        }) {
            ZStack {
                // Glass background
                Circle()
                    .fill(.ultraThinMaterial)
                    .background(
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.15),
                                        Color.white.opacity(0.05)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .clipShape(Circle())
                
                // Subtle border
                Circle()
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.4),
                                Color.white.opacity(0.1)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 0.5
                    )
                
                // Icon
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.white, .white.opacity(0.9)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .rotationEffect(.degrees(rotation))
            }
            .frame(width: 44, height: 44)
            .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
            .scaleEffect(isPressed ? 0.92 : 1.0)
        }
        .buttonStyle(.plain)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    withAnimation(.easeOut(duration: 0.1)) {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        isPressed = false
                    }
                }
        )
    }
}

#Preview {
    ZStack {
        Color.black
        HStack(spacing: 20) {
            GlassButton(icon: "xmark") {}
            GlassButton(icon: "arrow.right", action: {}, rotation: 90)
        }
    }
}
