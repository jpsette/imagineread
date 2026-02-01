//
//  PageIndicator.swift
//  ImagineRead
//
//  View for showing current page position
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

// MARK: - Preview

#Preview {
    ZStack {
        Color.gray
        PageIndicator(text: "3 / 10")
    }
}
