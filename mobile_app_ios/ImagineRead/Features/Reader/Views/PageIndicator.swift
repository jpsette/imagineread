//
//  PageIndicator.swift
//  ImagineRead
//
//  View for showing current page position and progress bars
//

import SwiftUI

/// Indicator showing current page number
struct PageIndicator: View {
    let text: String
    
    var body: some View {
        Text(text)
            .font(.caption)
            .fontWeight(.medium)
            .foregroundColor(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(Color.black.opacity(0.6))
            )
    }
}

// MARK: - Progress Bar (Horizontal)

struct ProgressBar: View {
    let progress: Double
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background track
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.white.opacity(0.2))
                
                // Progress fill with gradient
                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        LinearGradient(
                            colors: [.purple, .blue],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * min(max(progress, 0), 1))
                    .animation(.easeOut(duration: 0.2), value: progress)
            }
        }
    }
}

// MARK: - Vertical Progress Bar

struct VerticalProgressBar: View {
    let progress: Double
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottom) {
                // Background track
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.white.opacity(0.2))
                
                // Progress fill with gradient (bottom to top)
                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        LinearGradient(
                            colors: [.blue, .purple],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                    .frame(height: geometry.size.height * min(max(progress, 0), 1))
                    .animation(.easeOut(duration: 0.2), value: progress)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        Color.gray
        VStack {
            PageIndicator(text: "3 / 10")
            ProgressBar(progress: 0.3)
                .frame(height: 4)
                .padding()
        }
    }
}

