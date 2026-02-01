//
//  StarRatingView.swift
//  ImagineRead
//
//  Reusable star rating component
//

import SwiftUI

/// Reusable 5-star rating component
struct StarRatingView: View {
    @Binding var rating: Int
    var maxRating: Int = 5
    var size: CGFloat = 24
    var interactive: Bool = true
    
    var body: some View {
        HStack(spacing: size * 0.2) {
            ForEach(1...maxRating, id: \.self) { index in
                starImage(for: index)
                    .font(.system(size: size))
                    .foregroundStyle(starGradient(for: index))
                    .scaleEffect(rating == index ? 1.1 : 1.0)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: rating)
                    .onTapGesture {
                        if interactive {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                                rating = index
                            }
                            
                            // Haptic feedback
                            let generator = UIImpactFeedbackGenerator(style: .light)
                            generator.impactOccurred()
                        }
                    }
            }
        }
    }
    
    private func starImage(for index: Int) -> Image {
        if index <= rating {
            return Image(systemName: "star.fill")
        } else {
            return Image(systemName: "star")
        }
    }
    
    private func starGradient(for index: Int) -> some ShapeStyle {
        if index <= rating {
            return AnyShapeStyle(
                LinearGradient(
                    colors: [.yellow, .orange],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
        } else {
            return AnyShapeStyle(Color.gray.opacity(0.4))
        }
    }
}
