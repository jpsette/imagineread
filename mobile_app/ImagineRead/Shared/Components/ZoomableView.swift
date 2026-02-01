//
//  ZoomableView.swift
//  ImagineRead
//
//  Wrapper view that enables pinch-to-zoom with indicator
//

import SwiftUI

/// A view that enables pinch-to-zoom on its content
struct ZoomableView<Content: View>: View {
    let content: Content
    
    @State private var currentScale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero
    @State private var showZoomIndicator: Bool = false
    
    private let minScale: CGFloat = 1.0
    private let maxScale: CGFloat = 5.0
    
    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                content
                    .scaleEffect(currentScale)
                    .offset(offset)
                    .gesture(
                        MagnificationGesture()
                            .onChanged { value in
                                let delta = value / lastScale
                                lastScale = value
                                
                                let newScale = currentScale * delta
                                currentScale = min(max(newScale, minScale), maxScale)
                                
                                showZoomIndicator = true
                            }
                            .onEnded { _ in
                                lastScale = 1.0
                                
                                // Reset if zoomed out
                                if currentScale <= 1.0 {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                        currentScale = 1.0
                                        offset = .zero
                                    }
                                }
                                
                                // Hide indicator after delay
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                                    withAnimation(.easeOut(duration: 0.3)) {
                                        showZoomIndicator = false
                                    }
                                }
                            }
                    )
                    .simultaneousGesture(
                        currentScale > 1.0 ?
                        DragGesture()
                            .onChanged { value in
                                let newOffset = CGSize(
                                    width: lastOffset.width + value.translation.width,
                                    height: lastOffset.height + value.translation.height
                                )
                                
                                // Limit panning based on zoom level
                                let maxX = (geometry.size.width * (currentScale - 1)) / 2
                                let maxY = (geometry.size.height * (currentScale - 1)) / 2
                                
                                offset = CGSize(
                                    width: min(max(newOffset.width, -maxX), maxX),
                                    height: min(max(newOffset.height, -maxY), maxY)
                                )
                            }
                            .onEnded { _ in
                                lastOffset = offset
                            }
                        : nil
                    )
                    .simultaneousGesture(
                        TapGesture(count: 2)
                            .onEnded {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    if currentScale > 1.0 {
                                        currentScale = 1.0
                                        offset = .zero
                                        lastOffset = .zero
                                    } else {
                                        currentScale = 2.5
                                    }
                                }
                                
                                showZoomIndicator = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                                    withAnimation(.easeOut(duration: 0.3)) {
                                        showZoomIndicator = false
                                    }
                                }
                            }
                    )
                
                // Zoom indicator
                if showZoomIndicator {
                    zoomIndicator
                        .transition(.opacity.combined(with: .scale(scale: 0.8)))
                }
            }
        }
    }
    
    private var zoomIndicator: some View {
        VStack {
            Spacer()
            
            HStack {
                Spacer()
                
                HStack(spacing: 6) {
                    Image(systemName: currentScale > 1.0 ? "plus.magnifyingglass" : "magnifyingglass")
                        .font(.system(size: 14, weight: .medium))
                    
                    Text(zoomPercentage)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                }
                .foregroundColor(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(.ultraThinMaterial)
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
                        )
                )
                .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
                
                Spacer()
            }
            .padding(.bottom, 100)
        }
    }
    
    private var zoomPercentage: String {
        let percentage = Int(currentScale * 100)
        return "\(percentage)%"
    }
}

#Preview {
    ZStack {
        Color.black
        ZoomableView {
            Image(systemName: "photo")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .foregroundColor(.white)
        }
    }
}
