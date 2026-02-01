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
    
    @State private var readingMode: ReadingMode = .horizontal
    @State private var nightMode: NightMode = .off
    @State private var filterIntensity: Double = 0.5
    @State private var readingLanguage: ReadingLanguage = .portuguese
    @State private var balloonFontSize: Double = 1.0
    @State private var showControls: Bool = true
    @State private var showProgressBar: Bool = true
    @State private var showSettings: Bool = false
    @State private var showBookmarks: Bool = false
    @State private var isCurrentPageBookmarked: Bool = false
    @State private var showCompletionModal: Bool = false
    @State private var suggestions: [LibraryService.ComicItem] = []
    
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    
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
        .onAppear(perform: onViewAppear)
        .onChange(of: viewModel.comic) { _, comic in
            if let comic = comic {
                prefs.saveTotalPages(comic.pageCount, for: pdfURL.path)
            }
        }
        .onChange(of: readingMode) { _, newMode in
            prefs.saveReadingMode(newMode)
        }
        .onChange(of: viewModel.currentPageIndex) { _, newPage in
            prefs.saveLastReadPage(newPage, for: pdfURL.path)
            updateBookmarkState()
            checkCompletion(newPage)
        }
        .onChange(of: nightMode) { _, newMode in
            prefs.saveNightMode(newMode)
        }
        .sheet(isPresented: $showSettings) {
            ReaderSettingsSheet(
                readingMode: $readingMode,
                nightMode: $nightMode,
                filterIntensity: $filterIntensity,
                showProgressBar: $showProgressBar,
                readingLanguage: $readingLanguage,
                balloonFontSize: $balloonFontSize
            )
        }
        .sheet(isPresented: $showBookmarks) {
            if let cache = viewModel.pageCache {
                BookmarkListSheet(
                    comicPath: pdfURL.path,
                    totalPages: viewModel.comic?.pageCount ?? 1,
                    cache: cache,
                    onSelectPage: { page in
                        withAnimation { viewModel.currentPageIndex = page }
                    }
                )
            }
        }
        .sheet(isPresented: $showCompletionModal) {
            if let comic = viewModel.comic, let cache = viewModel.pageCache {
                ComicCompletionSheet(
                    comic: comic,
                    pdfURL: pdfURL,
                    coverImage: cache.getImage(for: 0) ?? UIImage(),
                    suggestions: suggestions,
                    onDismiss: {
                        showCompletionModal = false
                    },
                    onSelectSuggestion: { suggestion in
                        showCompletionModal = false
                    }
                )
            }
        }
    }
    
    // MARK: - Lifecycle
    
    private func onViewAppear() {
        viewModel.loadComic(from: pdfURL)
        
        // Load preferences
        readingMode = prefs.readingMode
        nightMode = prefs.nightMode
        filterIntensity = prefs.filterIntensity
        readingLanguage = prefs.readingLanguage
        balloonFontSize = prefs.balloonFontSize
        
        let lastPage = prefs.lastReadPage(for: pdfURL.path)
        if lastPage > 0 {
            viewModel.currentPageIndex = lastPage
        }
        updateBookmarkState()
    }
    
    private func updateBookmarkState() {
        isCurrentPageBookmarked = prefs.isPageBookmarked(
            viewModel.currentPageIndex,
            for: pdfURL.path
        )
    }
    
    private func toggleBookmark() {
        prefs.toggleBookmark(
            page: viewModel.currentPageIndex,
            for: pdfURL.path
        )
        isCurrentPageBookmarked.toggle()
        
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(isCurrentPageBookmarked ? .success : .warning)
    }
    
    private func checkCompletion(_ page: Int) {
        guard let comic = viewModel.comic else { return }
        
        // Check if reached last page and hasn't rated yet
        let lastPageIndex = comic.pageCount - 1
        if page == lastPageIndex && prefs.comicRating(for: pdfURL.path) == 0 {
            // Load suggestions (unread comics)
            loadSuggestions()
            
            // Show modal with small delay for better UX
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                showCompletionModal = true
            }
        }
    }
    
    private func loadSuggestions() {
        let library = LibraryService.shared
        let allComics = library.loadComics()
        
        // Filter to unread comics (no progress saved)
        suggestions = allComics.filter { comic in
            comic.url.path != pdfURL.path && // Not current comic
            prefs.lastReadPage(for: comic.url.path) == 0 // Not started
        }
    }
    
    // MARK: - Reader Content
    
    @ViewBuilder
    private func readerContent(comic: Comic, cache: PageCache) -> some View {
        ZStack {
            pageContent(comic: comic, cache: cache)
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showControls.toggle()
                    }
                }
            
            if showProgressBar && readingMode == .vertical {
                verticalProgressOverlay(totalPages: comic.pageCount)
            }
            
            if showControls {
                controlsOverlay(totalPages: comic.pageCount)
                    .transition(.opacity)
            }
            
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
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: viewModel.currentPageIndex)
        .ignoresSafeArea()
    }
    
    private func verticalReader(comic: Comic, cache: PageCache) -> some View {
        GeometryReader { outerGeometry in
            ScrollView(.vertical, showsIndicators: false) {
                LazyVStack(spacing: 0) {
                    Color.clear
                        .frame(height: max(0, (outerGeometry.size.height - outerGeometry.size.width * 1.4) / 2))
                    
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
                    
                    Color.clear
                        .frame(height: max(0, (outerGeometry.size.height - outerGeometry.size.width * 1.4) / 2))
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
        return distance < containerHeight / 2 ? pageIndex : -1
    }
    
    // MARK: - Overlays
    
    private func verticalProgressOverlay(totalPages: Int) -> some View {
        HStack {
            Spacer()
            VerticalProgressBar(
                progress: Double(viewModel.currentPageIndex + 1) / Double(totalPages)
            )
            .frame(width: 4)
            .padding(.trailing, 8)
            .padding(.vertical, 100)
        }
    }
    
    private func controlsOverlay(totalPages: Int) -> some View {
        VStack(spacing: 0) {
            topBar
            Spacer()
            bottomBar(totalPages: totalPages)
        }
    }
    
    private var topBar: some View {
        HStack {
            GlassButton(icon: "xmark") { dismiss() }
            bookmarkCountButton
            Spacer()
            GlassButton(icon: isCurrentPageBookmarked ? "bookmark.fill" : "bookmark", action: toggleBookmark)
            GlassButton(icon: "gearshape") { showSettings = true }
        }
        .padding(.horizontal)
        .padding(.top, 8)
    }
    
    @ViewBuilder
    private var bookmarkCountButton: some View {
        let bookmarkCount = prefs.bookmarkedPages(for: pdfURL.path).count
        if bookmarkCount > 0 {
            Button { showBookmarks = true } label: {
                HStack(spacing: 6) {
                    Image(systemName: "bookmark.fill")
                        .font(.system(size: 16, weight: .semibold))
                    Text("\(bookmarkCount)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                .foregroundColor(.orange)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Capsule().fill(.ultraThinMaterial))
            }
        }
    }
    
    private func bottomBar(totalPages: Int) -> some View {
        VStack(spacing: 12) {
            if showProgressBar && readingMode != .vertical {
                ProgressBar(progress: Double(viewModel.currentPageIndex + 1) / Double(totalPages))
                    .frame(height: 3)
                    .padding(.horizontal)
            }
            PageIndicator(text: viewModel.pageDisplayText)
        }
        .padding(.bottom, 40)
    }
    
    // MARK: - States
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.white)
            Text(loc.loadingLibrary)
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
            Button(loc.close) { dismiss() }
                .foregroundColor(.purple)
        }
    }
}
