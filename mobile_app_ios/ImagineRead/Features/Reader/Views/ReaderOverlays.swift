//
//  ReaderOverlays.swift
//  ImagineRead
//
//  Helper components for the reader view
//

import SwiftUI

// MARK: - Vertical Page View (for vertical reading mode)

struct VerticalPageView: View {
    let pageIndex: Int
    @ObservedObject var cache: PageCache
    var comicPath: String? = nil  // For highlight support
    var isHighlightMode: Bool = false
    
    @State private var displayImage: UIImage?
    @State private var aspectRatio: CGFloat = 0.7
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                if let image = displayImage ?? cache.getImage(for: pageIndex) {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: .infinity)
                        .onAppear {
                            aspectRatio = image.size.width / image.size.height
                        }
                } else {
                    Rectangle()
                        .fill(Color.black)
                        .aspectRatio(aspectRatio, contentMode: .fit)
                        .frame(maxWidth: .infinity)
                        .overlay(
                            ProgressView()
                                .tint(.white)
                        )
                }
                
                // Highlight overlay (hidden during edit mode)
                if let path = comicPath, !isHighlightMode {
                    HighlightOverlay(
                        comicPath: path,
                        pageIndex: pageIndex,
                        pageSize: geometry.size
                    )
                }
                
                // Drawing canvas (when in highlight mode)
                if isHighlightMode, let path = comicPath {
                    HighlightCanvas(
                        comicPath: path,
                        pageIndex: pageIndex,
                        containerSize: geometry.size,
                        zoomScale: 1.0
                    )
                }
            }
        }
        .aspectRatio(aspectRatio, contentMode: .fit)
        .onAppear {
            cache.onPageAppear(pageIndex)
            loadImage()
        }
        .onReceive(cache.objectWillChange) { _ in
            updateImage()
        }
    }
    
    private func loadImage() {
        updateImage()
        if displayImage == nil {
            Task {
                for _ in 0..<20 {
                    try? await Task.sleep(nanoseconds: 50_000_000)
                    await MainActor.run { updateImage() }
                    if displayImage != nil { break }
                }
            }
        }
    }
    
    private func updateImage() {
        if let cached = cache.getImage(for: pageIndex) {
            displayImage = cached
            aspectRatio = cached.size.width / cached.size.height
        }
    }
}

// MARK: - Preference Key for tracking visible page

struct VisiblePagePreferenceKey: PreferenceKey {
    static var defaultValue: Int = -1
    
    static func reduce(value: inout Int, nextValue: () -> Int) {
        let next = nextValue()
        if next >= 0 {
            value = next
        }
    }
}
