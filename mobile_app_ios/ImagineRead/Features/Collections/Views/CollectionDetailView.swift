//
//  CollectionDetailView.swift
//  ImagineRead
//
//  Shows comics inside a specific collection
//

import SwiftUI

struct CollectionDetailView: View {
    @Environment(\.container) private var container
    @EnvironmentObject private var loc: LocalizationService
    @ObservedObject private var collectionsService = AppContainer.shared.collections
    let collection: Collection
    
    @State private var comics: [LibraryService.ComicItem] = []
    @State private var showAddComicsSheet = false
    @State private var selectedComic: LibraryService.ComicItem?
    
    // Get current version of collection from service (for refreshing)
    private var currentCollection: Collection {
        collectionsService.allCollections().first { $0.id == collection.id } ?? collection
    }
    
    var body: some View {
        ZStack {
            backgroundGradient
            
            if comics.isEmpty {
                emptyState
            } else {
                ScrollView {
                    LazyVGrid(columns: [
                        GridItem(.flexible(), alignment: .top),
                        GridItem(.flexible(), alignment: .top)
                    ], spacing: 16) {
                        ForEach(comics) { comic in
                            ZStack(alignment: .topTrailing) {
                                ComicCard(comic: comic) {
                                    selectedComic = comic
                                }
                                
                                // Delete button overlay
                                Button {
                                    removeComic(comic)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(.white, .red)
                                        .shadow(radius: 2)
                                }
                                .offset(x: 8, y: -8)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                }
            }
        }
        .fullScreenCover(item: $selectedComic) { comic in
            ReaderView(pdfURL: comic.url)
        }
        .navigationTitle(collection.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showAddComicsSheet = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundStyle(
                            LinearGradient(colors: [.purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                }
            }
        }
        .sheet(isPresented: $showAddComicsSheet) {
            AddComicsToCollectionSheet(collection: currentCollection)
        }
        .onAppear {
            loadComics()
        }
        .onChange(of: collectionsService.collections) { _ in
            loadComics()
        }
    }
    
    // MARK: - Empty State
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: collection.icon)
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.3))
            
            Text(loc.emptyCollection)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white.opacity(0.8))
            
            Text("Toque no + para adicionar quadrinhos")
                .font(.body)
                .foregroundColor(.white.opacity(0.5))
                .multilineTextAlignment(.center)
            
            Button {
                showAddComicsSheet = true
            } label: {
                HStack {
                    Image(systemName: "plus")
                    Text("Adicionar Quadrinhos")
                }
                .font(.body.weight(.semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(
                    Capsule()
                        .fill(
                            LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                        )
                )
            }
            .padding(.top, 8)
        }
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
    
    // MARK: - Data Loading
    
    private func loadComics() {
        let library = LibraryService.shared
        let allComics = library.loadComics()
        
        comics = allComics.filter { comic in
            currentCollection.comicPaths.contains(comic.url.path)
        }
    }
    
    private func removeComic(_ comic: LibraryService.ComicItem) {
        container.collections.removeComic(path: comic.url.path, from: currentCollection.id)
        loadComics()
    }
}

#Preview {
    NavigationView {
        CollectionDetailView(collection: Collection(
            id: UUID(),
            name: "Favoritos",
            icon: "heart.fill",
            colorHex: "#EC4899",
            comicPaths: [],
            createdAt: Date(),
            updatedAt: Date()
        ))
    }
}
