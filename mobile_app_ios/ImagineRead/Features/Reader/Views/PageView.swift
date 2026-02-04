//
//  PageView.swift
//  ImagineRead
//
//  View component for displaying a single comic page
//

import SwiftUI

/// Displays a single comic page with cached rendering and zoom
struct PageView: View {
    let pageIndex: Int
    @ObservedObject var cache: PageCache
    var useFixedHeight: Bool = true
    var comicPath: String? = nil  // For highlight support
    var zoomResetID: AnyHashable? = nil  // External trigger to reset zoom
    var isHighlightMode: Bool = false  // Enable drawing mode
    
    @State private var displayImage: UIImage?
    
    private var combinedResetID: String {
        "\(pageIndex)-\(zoomResetID.map { "\($0)" } ?? "")"
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZoomableView(resetID: combinedResetID, disableGestures: isHighlightMode) { zoomScale in
                ZStack {
                    if let image = displayImage ?? cache.getImage(for: pageIndex) {
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxWidth: geometry.size.width, maxHeight: geometry.size.height)
                    } else {
                        ProgressView()
                            .scaleEffect(1.2)
                            .tint(.white)
                    }
                    
                    // Highlight overlay (shows existing highlights - hidden during edit mode)
                    if let path = comicPath, !isHighlightMode {
                        HighlightOverlay(
                            comicPath: path,
                            pageIndex: pageIndex,
                            pageSize: geometry.size
                        )
                    }
                    
                    // Drawing canvas (when in highlight mode - shows editable highlights)
                    if isHighlightMode, let path = comicPath {
                        HighlightCanvas(
                            comicPath: path,
                            pageIndex: pageIndex,
                            containerSize: geometry.size,
                            zoomScale: zoomScale
                        )
                    }
                }
                .frame(width: geometry.size.width, height: geometry.size.height)
            }
        }
        .onAppear {
            cache.onPageAppear(pageIndex)
            startPollingForImage()
        }
        .onReceive(cache.objectWillChange) { _ in
            updateImage()
        }
    }
    
    private func startPollingForImage() {
        updateImage()
        
        if displayImage == nil {
            Task {
                for _ in 0..<20 {
                    try? await Task.sleep(nanoseconds: 50_000_000)
                    await MainActor.run {
                        updateImage()
                    }
                    if displayImage != nil { break }
                }
            }
        }
    }
    
    private func updateImage() {
        if let cached = cache.getImage(for: pageIndex) {
            displayImage = cached
        }
    }
}

// MARK: - View Extension for conditional modifiers

extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}
