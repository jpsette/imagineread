//
//  SearchView.swift
//  ImagineRead
//
//  Search and discovery screen
//

import SwiftUI

struct SearchView: View {
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    
    @State private var searchText: String = ""
    @State private var selectedFilter: ReadingFilter = .all
    @State private var comics: [LibraryService.ComicItem] = []
    @State private var recommendations: [LibraryService.ComicItem] = []
    
    enum ReadingFilter: String, CaseIterable {
        case all = "Todos"
        case reading = "Lendo"
        case completed = "Completos"
        case notStarted = "Não Iniciados"
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                VStack(spacing: 0) {
                    // Search Bar
                    searchBar
                    
                    // Filter Chips
                    filterChips
                    
                    // Results
                    ScrollView {
                        VStack(spacing: 24) {
                            if searchText.isEmpty && selectedFilter == .all {
                                recommendationsSection
                            }
                            
                            resultsSection
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 16)
                        .padding(.bottom, 40)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                
                ToolbarItem(placement: .principal) {
                    Text("Buscar")
                        .font(.headline)
                        .foregroundColor(.white)
                }
            }
            .onAppear {
                loadComics()
                loadRecommendations()
            }
        }
    }
    
    // MARK: - Search Bar
    
    private var searchBar: some View {
        HStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.white.opacity(0.5))
            
            TextField("", text: $searchText, prompt: Text("Buscar quadrinhos...").foregroundColor(.white.opacity(0.4)))
                .foregroundColor(.white)
                .autocorrectionDisabled()
            
            if !searchText.isEmpty {
                Button {
                    searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.white.opacity(0.5))
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.white.opacity(0.08))
        )
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }
    
    // MARK: - Filter Chips
    
    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(ReadingFilter.allCases, id: \.self) { filter in
                    FilterChip(
                        title: filter.rawValue,
                        isSelected: selectedFilter == filter
                    ) {
                        selectedFilter = filter
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
    }
    
    // MARK: - Recommendations Section
    
    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                
                Text("Recomendados para Você")
                    .font(.headline)
                    .foregroundColor(.white.opacity(0.9))
            }
            
            if recommendations.isEmpty {
                Text("Leia mais quadrinhos para receber recomendações personalizadas!")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.5))
                    .padding(.vertical, 20)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(recommendations) { comic in
                            NavigationLink {
                                ReaderView(pdfURL: comic.url)
                            } label: {
                                CompactComicCard(comic: comic)
                            }
                        }
                    }
                }
            }
        }
    }
    
    // MARK: - Results Section
    
    private var resultsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if !searchText.isEmpty || selectedFilter != .all {
                Text("\(filteredComics.count) resultados")
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.6))
            }
            
            if filteredComics.isEmpty {
                emptyResultsView
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    ForEach(filteredComics) { comic in
                        NavigationLink {
                            ReaderView(pdfURL: comic.url)
                        } label: {
                            ComicCard(comic: comic) { }
                        }
                    }
                }
            }
        }
    }
    
    private var emptyResultsView: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.white.opacity(0.3))
            
            Text("Nenhum resultado")
                .font(.title3)
                .fontWeight(.medium)
                .foregroundColor(.white.opacity(0.7))
            
            Text("Tente outro termo de busca ou filtro.")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
    
    private var backgroundGradient: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 0.1, green: 0.1, blue: 0.2),
                Color(red: 0.05, green: 0.05, blue: 0.15)
            ]),
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }
    
    // MARK: - Filtered Results
    
    private var filteredComics: [LibraryService.ComicItem] {
        comics.filter { comic in
            let matchesSearch = searchText.isEmpty || comic.title.localizedCaseInsensitiveContains(searchText)
            let matchesFilter = filterMatches(comic)
            return matchesSearch && matchesFilter
        }
    }
    
    private func filterMatches(_ comic: LibraryService.ComicItem) -> Bool {
        let progress = container.preferences.readingProgress(for: comic.url.path)
        let isCompleted = container.readingStats.isComicCompleted(comic.url.path)
        
        switch selectedFilter {
        case .all:
            return true
        case .reading:
            return progress > 0 && !isCompleted
        case .completed:
            return isCompleted
        case .notStarted:
            return progress == 0
        }
    }
    
    // MARK: - Data Loading
    
    private func loadComics() {
        let library = LibraryService.shared
        comics = library.loadComics()
    }
    
    private func loadRecommendations() {
        // Get highly rated comics that user hasn't read
        let library = LibraryService.shared
        let allComics = library.loadComics()
        
        recommendations = Array(allComics.filter { comic in
            let rating = container.preferences.comicRating(for: comic.url.path)
            let progress = container.preferences.readingProgress(for: comic.url.path)
            // Recommend unread comics or comics with high ratings user hasn't started
            return progress == 0 || rating >= 4
        }.prefix(5))
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? .white : .white.opacity(0.7))
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(isSelected ?
                            AnyShapeStyle(LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)) :
                            AnyShapeStyle(Color.white.opacity(0.1))
                        )
                )
        }
    }
}

// MARK: - Compact Comic Card

struct CompactComicCard: View {
    let comic: LibraryService.ComicItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(uiImage: comic.cover)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 100, height: 140)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            
            Text(comic.title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .lineLimit(2)
                .frame(width: 100, alignment: .leading)
        }
    }
}

#Preview {
    SearchView()
}
