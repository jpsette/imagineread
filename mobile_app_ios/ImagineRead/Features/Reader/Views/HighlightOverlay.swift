//
//  HighlightOverlay.swift
//  ImagineRead
//
//  Displays saved highlights on a page with note indicator
//

import SwiftUI

/// Overlay that displays saved highlights on a comic page
struct HighlightOverlay: View {
    let comicPath: String
    let pageIndex: Int
    let pageSize: CGSize
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    
    var body: some View {
        GeometryReader { geometry in
            ForEach(highlightsService.highlightsForPage(pageIndex, in: comicPath)) { highlight in
                HighlightRect(
                    highlight: highlight,
                    containerSize: geometry.size,
                    onDelete: {
                        withAnimation {
                            highlightsService.deleteHighlight(highlight.id)
                        }
                        let generator = UIImpactFeedbackGenerator(style: .medium)
                        generator.impactOccurred()
                    }
                )
            }
        }
    }
}

/// Individual highlight rectangle view
struct HighlightRect: View {
    let highlight: Highlight
    let containerSize: CGSize
    let onDelete: () -> Void
    
    private var color: Color {
        Color(hex: highlight.color) ?? .yellow
    }
    
    private var frame: CGRect {
        CGRect(
            x: highlight.rect.origin.x * containerSize.width,
            y: highlight.rect.origin.y * containerSize.height,
            width: highlight.rect.width * containerSize.width,
            height: highlight.rect.height * containerSize.height
        )
    }
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Highlight rectangle
            RoundedRectangle(cornerRadius: 4)
                .fill(color.opacity(0.35))
                .frame(width: frame.width, height: frame.height)
            
            // Note indicator (always visible if has note)
            if highlight.hasNote {
                Image(systemName: "text.bubble.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.white)
                    .padding(3)
                    .background(Circle().fill(color.opacity(0.9)))
                    .offset(x: 4, y: -4)
            }
        }
        .position(
            x: frame.midX,
            y: frame.midY
        )
        .onLongPressGesture(minimumDuration: 0.5) {
            onDelete()
        }
    }
}
