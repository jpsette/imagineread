//
//  ZoomableView.swift
//  ImagineRead
//
//  Wrapper view that enables pinch-to-zoom with indicator
//

import SwiftUI

/// A view that enables pinch-to-zoom on its content
struct ZoomableView<Content: View>: View {
    let contentBuilder: (CGFloat) -> Content
    let resetID: AnyHashable?
    let disableGestures: Bool
    
    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero
    @State private var showZoomIndicator: Bool = false
    @State private var anchor: UnitPoint = .center
    
    private let minScale: CGFloat = 1.0
    private let maxScale: CGFloat = 4.0
    
    /// Init with scale-aware content builder
    init(resetID: AnyHashable? = nil, disableGestures: Bool = false, @ViewBuilder content: @escaping (CGFloat) -> Content) {
        self.resetID = resetID
        self.disableGestures = disableGestures
        self.contentBuilder = content
    }
    
    /// Convenience init for content that doesn't need scale
    init(resetID: AnyHashable? = nil, disableGestures: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.resetID = resetID
        self.disableGestures = disableGestures
        self.contentBuilder = { _ in content() }
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                contentBuilder(scale)
                    .scaleEffect(scale, anchor: anchor)
                    .offset(offset)
                    .gesture(
                        disableGestures ? nil : SimultaneousGesture(
                            zoomGesture(geometry: geometry),
                            panGesture(geometry: geometry)
                        )
                    )
                    .gesture(disableGestures ? nil : doubleTapGesture(geometry: geometry))
                
                // Zoom indicator
                if showZoomIndicator {
                    zoomIndicator
                        .transition(.opacity.combined(with: .scale(scale: 0.8)))
                        .animation(.easeOut(duration: 0.2), value: showZoomIndicator)
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .contentShape(Rectangle())
        }
        .onChange(of: resetID) { _, _ in
            // Reset zoom when page changes
            withAnimation(.easeOut(duration: 0.2)) {
                scale = 1.0
                lastScale = 1.0
                offset = .zero
                lastOffset = .zero
                anchor = .center
            }
        }
    }
    
    // MARK: - Gestures
    
    private func zoomGesture(geometry: GeometryProxy) -> some Gesture {
        MagnificationGesture(minimumScaleDelta: 0.005)
            .onChanged { value in
                let newScale = lastScale * value
                scale = min(max(newScale, minScale * 0.5), maxScale)
                showZoomIndicator = true
            }
            .onEnded { value in
                withAnimation(.spring(response: 0.3, dampingFraction: 0.65)) {
                    // Snap back if under minimum
                    if scale < minScale {
                        scale = minScale
                        offset = .zero
                        lastOffset = .zero
                        lastScale = minScale
                        anchor = .center
                    } else {
                        lastScale = scale
                        // Soft clamp - animate to valid range
                        let clampedOffset = clampOffset(offset, scale: scale, geometry: geometry)
                        offset = clampedOffset
                        lastOffset = clampedOffset
                    }
                }
                hideIndicator()
            }
    }
    
    private func panGesture(geometry: GeometryProxy) -> some Gesture {
        // Only allow drag when zoomed - use high minimumDistance when not zoomed to let TabView handle swipes
        DragGesture(minimumDistance: scale > 1.05 ? 1 : 10000)
            .onChanged { value in
                guard scale > 1.0 else { return }
                
                let proposedOffset = CGSize(
                    width: lastOffset.width + value.translation.width,
                    height: lastOffset.height + value.translation.height
                )
                
                // Fluid movement with rubber-band effect at edges
                let maxX = (geometry.size.width * (scale - 1)) / 2
                let maxY = (geometry.size.height * (scale - 1)) / 2
                
                offset = CGSize(
                    width: rubberBand(proposedOffset.width, limit: maxX),
                    height: rubberBand(proposedOffset.height, limit: maxY)
                )
            }
            .onEnded { _ in
                // Snap back to bounds with animation
                withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                    let clampedOffset = clampOffset(offset, scale: scale, geometry: geometry)
                    offset = clampedOffset
                    lastOffset = clampedOffset
                }
            }
    }
    
    private func doubleTapGesture(geometry: GeometryProxy) -> some Gesture {
        SpatialTapGesture(count: 2)
            .onEnded { value in
                let tapLocation = value.location
                
                // Haptic feedback
                let generator = UIImpactFeedbackGenerator(style: .light)
                generator.impactOccurred()
                
                withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                    if scale > 1.0 {
                        // Reset zoom
                        scale = 1.0
                        offset = .zero
                        lastOffset = .zero
                        lastScale = 1.0
                        anchor = .center
                    } else {
                        // Zoom into tap point
                        let targetScale: CGFloat = 2.5
                        
                        // Calculate the anchor point based on tap location
                        let anchorX = tapLocation.x / geometry.size.width
                        let anchorY = tapLocation.y / geometry.size.height
                        anchor = UnitPoint(x: anchorX, y: anchorY)
                        
                        // Calculate offset to keep tap point centered
                        let centerX = geometry.size.width / 2
                        let centerY = geometry.size.height / 2
                        let offsetX = (centerX - tapLocation.x) * (targetScale - 1)
                        let offsetY = (centerY - tapLocation.y) * (targetScale - 1)
                        
                        scale = targetScale
                        lastScale = targetScale
                        offset = CGSize(width: offsetX, height: offsetY)
                        lastOffset = offset
                    }
                }
                
                showZoomIndicator = true
                hideIndicator()
            }
    }
    
    // MARK: - Helpers
    
    /// Rubber band effect for over-scrolling
    private func rubberBand(_ value: CGFloat, limit: CGFloat) -> CGFloat {
        let absValue = abs(value)
        if absValue <= limit {
            return value
        }
        
        // Apply rubber band resistance beyond the limit
        let overshoot = absValue - limit
        let resistance: CGFloat = 0.55
        let dampedOvershoot = (1 - (1 / (overshoot * 0.02 + 1))) * limit * resistance
        let result = limit + dampedOvershoot
        
        return value > 0 ? result : -result
    }
    
    private func clampOffset(_ proposedOffset: CGSize, scale: CGFloat, geometry: GeometryProxy) -> CGSize {
        guard scale > 1.0 else { return .zero }
        
        let maxX = (geometry.size.width * (scale - 1)) / 2
        let maxY = (geometry.size.height * (scale - 1)) / 2
        
        return CGSize(
            width: min(max(proposedOffset.width, -maxX), maxX),
            height: min(max(proposedOffset.height, -maxY), maxY)
        )
    }
    
    private func hideIndicator() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation(.easeOut(duration: 0.3)) {
                showZoomIndicator = false
            }
        }
    }
    
    private var zoomIndicator: some View {
        VStack {
            Spacer()
            
            HStack {
                Spacer()
                
                HStack(spacing: 6) {
                    Image(systemName: scale > 1.0 ? "plus.magnifyingglass" : "magnifyingglass")
                        .font(.system(size: 14, weight: .medium))
                    
                    Text("\(Int(scale * 100))%")
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
    
    // MARK: - Public Reset
    
    /// Reset zoom state (can be called externally via preference key if needed)
    func resetZoom() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            scale = 1.0
            offset = .zero
            lastOffset = .zero
            lastScale = 1.0
            anchor = .center
        }
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
