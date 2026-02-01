//
//  CollectionDetailView.swift
//  ImagineRead
//
//  Shows comics inside a specific collection
//

import SwiftUI

struct CollectionDetailView: View {
    @Environment(\.container) private var container
    let collection: Collection
    
    @State private var comics: [LibraryService.ComicItem] = []
    
    var body: some View {
        ZStack {
            backgroundGradient
            
            if comics.isEmpty {
                emptyState
            } else {
                ScrollView {
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(comics) { comic in
                            NavigationLink {
                                ReaderView(pdfURL: comic.url)
                            } label: {
                                ComicCard(comic: comic) { }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                }
            }
        }
        .navigationTitle(collection.name)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            loadComics()
        }
    }
    
    // MARK: - Empty State
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: collection.icon)
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.3))
            
            Text("Coleção Vazia")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white.opacity(0.8))
            
            Text("Adicione quadrinhos a esta coleção\ndiretamente da biblioteca.")
                .font(.body)
                .foregroundColor(.white.opacity(0.5))
                .multilineTextAlignment(.center)
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
            collection.comicPaths.contains(comic.url.path)
        }
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
