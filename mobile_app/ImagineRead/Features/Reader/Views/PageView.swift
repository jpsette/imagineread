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
    
    @State private var displayImage: UIImage?
    
    var body: some View {
        GeometryReader { geometry in
            ZoomableView(resetID: pageIndex) {
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
