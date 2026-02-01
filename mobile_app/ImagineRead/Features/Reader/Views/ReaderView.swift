//
//  ReaderView.swift
//  ImagineRead
//
//  Main view for reading comics
//

import SwiftUI

/// Main reader view with swipe navigation
struct ReaderView: View {
    @StateObject private var viewModel = ReaderViewModel()
    @Environment(\.dismiss) private var dismiss
    
    let pdfURL: URL
    let useSample: Bool
    
    @State private var readingMode: ReadingMode = UserPreferences.shared.readingMode
    @State private var nightMode: NightMode = UserPreferences.shared.nightMode
    @State private var filterIntensity: Double = UserPreferences.shared.filterIntensity
    @State private var showControls: Bool = true
    @State private var isCurrentPageBookmarked: Bool = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            if viewModel.isLoading {
                loadingView
            } else if let errorMessage = viewModel.errorMessage {
                errorView(message: errorMessage)
            } else if let comic = viewModel.comic, let cache = viewModel.pageCache {
                readerContent(comic: comic, cache: cache)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: viewModel.isLoading)
        .onAppear {
            viewModel.loadComic(from: pdfURL)
            // Navigate to bookmarked page first, otherwise last read page
            if let bookmarkedPage = UserPreferences.shared.bookmarkedPage(for: pdfURL.path) {
                viewModel.currentPageIndex = bookmarkedPage
            } else {
                let lastPage = UserPreferences.shared.lastReadPage(for: pdfURL.path)
                if lastPage > 0 {
                    viewModel.currentPageIndex = lastPage
                }
            }
        }
        .onChange(of: readingMode) { _, newMode in
            UserPreferences.shared.readingMode = newMode
        }
        .onChange(of: viewModel.currentPageIndex) { _, newPage in
            UserPreferences.shared.saveLastReadPage(newPage, for: pdfURL.path)
        }
        .onChange(of: nightMode) { _, newMode in
            UserPreferences.shared.nightMode = newMode
        }
        .onChange(of: viewModel.currentPageIndex) { _, _ in
            updateBookmarkState()
        }
        .onAppear {
            updateBookmarkState()
        }
    }
    
    private func updateBookmarkState() {
        isCurrentPageBookmarked = UserPreferences.shared.isPageBookmarked(
            viewModel.currentPageIndex,
            for: pdfURL.path
        )
    }
    
    private func toggleBookmark() {
        if isCurrentPageBookmarked {
            UserPreferences.shared.setBookmark(page: nil, for: pdfURL.path)
        } else {
            UserPreferences.shared.setBookmark(page: viewModel.currentPageIndex, for: pdfURL.path)
        }
        isCurrentPageBookmarked.toggle()
        
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(isCurrentPageBookmarked ? .success : .warning)
    }
    
    // MARK: - Reader Content
    
    @ViewBuilder
    private func readerContent(comic: Comic, cache: PageCache) -> some View {
        ZStack(alignment: .bottom) {
            // Page content
            pageContent(comic: comic, cache: cache)
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showControls.toggle()
                    }
                }
            
            // Controls overlay
            if showControls {
                controlsOverlay(totalPages: comic.pageCount)
                    .transition(.opacity)
            }
            
            // Night mode filter
            NightModeOverlay(mode: nightMode, intensity: filterIntensity)
                .ignoresSafeArea()
                .allowsHitTesting(false)
        }
        .transition(.opacity)
    }
    
    @ViewBuilder
    private func pageContent(comic: Comic, cache: PageCache) -> some View {
        switch readingMode {
        case .horizontal:
            horizontalReader(comic: comic, cache: cache, reversed: false)
        case .oriental:
            horizontalReader(comic: comic, cache: cache, reversed: true)
        case .vertical:
            verticalReader(comic: comic, cache: cache)
        }
    }
    
    // MARK: - Reading Modes
    
    private func horizontalReader(comic: Comic, cache: PageCache, reversed: Bool) -> some View {
        TabView(selection: $viewModel.currentPageIndex) {
            if reversed {
                ForEach((0..<comic.pageCount).reversed(), id: \.self) { index in
                    PageView(pageIndex: index, cache: cache, useFixedHeight: true)
                        .tag(index)
                }
            } else {
                ForEach(0..<comic.pageCount, id: \.self) { index in
                    PageView(pageIndex: index, cache: cache, useFixedHeight: true)
                        .tag(index)
                }
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .never))
        .ignoresSafeArea()
    }
    
    private func verticalReader(comic: Comic, cache: PageCache) -> some View {
        GeometryReader { outerGeometry in
            ScrollView(.vertical, showsIndicators: false) {
                LazyVStack(spacing: 0) {
                    ForEach(0..<comic.pageCount, id: \.self) { index in
                        VerticalPageView(pageIndex: index, cache: cache)
                            .background(
                                GeometryReader { geo in
                                    Color.clear
                                        .preference(
                                            key: VisiblePagePreferenceKey.self,
                                            value: calculateVisibility(
                                                pageIndex: index,
                                                geometry: geo,
                                                containerHeight: outerGeometry.size.height
                                            )
                                        )
                                }
                            )
                    }
                }
            }
            .onPreferenceChange(VisiblePagePreferenceKey.self) { visiblePage in
                if visiblePage >= 0 && visiblePage != viewModel.currentPageIndex {
                    viewModel.currentPageIndex = visiblePage
                }
            }
        }
        .ignoresSafeArea()
    }
    
    private func calculateVisibility(pageIndex: Int, geometry: GeometryProxy, containerHeight: CGFloat) -> Int {
        let frame = geometry.frame(in: .global)
        let midY = containerHeight / 2
        let pageMidY = frame.midY
        let distance = abs(pageMidY - midY)
        
        if distance < containerHeight / 2 {
            return pageIndex
        }
        return -1
    }
    
    // MARK: - Controls
    
    private func controlsOverlay(totalPages: Int) -> some View {
        VStack(spacing: 0) {
            // Top bar
            HStack {
                GlassButton(icon: "xmark") {
                    dismiss()
                }
                
                // Bookmark indicator (tap to go to bookmark)
                if let bookmarkedPage = UserPreferences.shared.bookmarkedPage(for: pdfURL.path),
                   bookmarkedPage != viewModel.currentPageIndex {
                    Button {
                        withAnimation {
                            viewModel.currentPageIndex = bookmarkedPage
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "bookmark.fill")
                                .font(.system(size: 12))
                            Text("p.\(bookmarkedPage + 1)")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                        }
                        .foregroundColor(.orange)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(.ultraThinMaterial)
                        )
                    }
                }
                
                Spacer()
                
                GlassButton(
                    icon: "arrow.right",
                    action: {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            readingMode = readingMode.next
                        }
                    },
                    rotation: readingMode.arrowRotation
                )
                
                NightModeButton(mode: $nightMode)
                
                // Bookmark button
                GlassButton(
                    icon: isCurrentPageBookmarked ? "bookmark.fill" : "bookmark",
                    action: toggleBookmark
                )
            }
            .padding(.horizontal)
            .padding(.top, 8)
            
            Spacer()
            
            // Bottom bar with progress
            VStack(spacing: 12) {
                // Intensity slider (when filter is active)
                if nightMode.hasIntensity {
                    IntensitySlider(intensity: $filterIntensity, mode: nightMode)
                        .onChange(of: filterIntensity) { _, newValue in
                            UserPreferences.shared.filterIntensity = newValue
                        }
                }
                
                // Progress bar
                ProgressBar(
                    progress: Double(viewModel.currentPageIndex + 1) / Double(totalPages)
                )
                .frame(height: 3)
                .padding(.horizontal)
                
                PageIndicator(text: viewModel.pageDisplayText)
            }
            .padding(.bottom, 40)
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.white)
            Text("Carregando quadrinho...")
                .font(.headline)
                .foregroundColor(.white.opacity(0.8))
        }
        .transition(.opacity)
    }
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.orange)
            Text(message)
                .foregroundColor(.white)
            Button("Fechar") { dismiss() }
                .foregroundColor(.purple)
        }
    }
}

// MARK: - Progress Bar

private struct ProgressBar: View {
    let progress: Double
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                // Background
                Capsule()
                    .fill(Color.white.opacity(0.2))
                
                // Progress
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.purple, .blue],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: geometry.size.width * progress)
                    .animation(.easeInOut(duration: 0.2), value: progress)
            }
        }
    }
}

// MARK: - Preference Key for tracking visible page

private struct VisiblePagePreferenceKey: PreferenceKey {
    static var defaultValue: Int = -1
    
    static func reduce(value: inout Int, nextValue: () -> Int) {
        let next = nextValue()
        if next >= 0 {
            value = next
        }
    }
}

// MARK: - Vertical Page View (seamless)

private struct VerticalPageView: View {
    let pageIndex: Int
    @ObservedObject var cache: PageCache
    
    @State private var displayImage: UIImage?
    @State private var aspectRatio: CGFloat = 0.7
    
    var body: some View {
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
        }
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
