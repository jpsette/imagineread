//
//  AddComicsToCollectionSheet.swift
//  ImagineRead
//
//  Sheet to select comics from library to add to a collection
//

import SwiftUI

struct AddComicsToCollectionSheet: View {
    let collection: Collection
    
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    
    @State private var allComics: [LibraryService.ComicItem] = []
    @State private var selectedPaths: Set<String> = []
    @State private var searchText: String = ""
    
    private var filteredComics: [LibraryService.ComicItem] {
        if searchText.isEmpty {
            return allComics
        }
        return allComics.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                if allComics.isEmpty {
                    emptyLibraryView
                } else {
                    VStack(spacing: 0) {
                        // Search bar
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.white.opacity(0.5))
                            TextField("Buscar quadrinho...", text: $searchText)
                                .foregroundColor(.white)
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.white.opacity(0.08))
                        )
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        
                        ScrollView {
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 16) {
                                ForEach(filteredComics) { comic in
                                    ComicSelectCard(
                                        comic: comic,
                                        isSelected: selectedPaths.contains(comic.url.path),
                                        isAlreadyInCollection: collection.contains(comic.url.path)
                                    ) {
                                        toggleSelection(comic)
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.top, 16)
                            .padding(.bottom, 100)
                        }
                    }
                }
                
                // Bottom save button
                if !selectedPaths.isEmpty {
                    VStack {
                        Spacer()
                        
                        Button {
                            saveSelection()
                        } label: {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                Text("Adicionar \(selectedPaths.count) quadrinho(s)")
                            }
                            .font(.body.weight(.semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(
                                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                                    )
                            )
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationTitle(loc.addComics)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(loc.cancel) {
                        dismiss()
                    }
                    .foregroundColor(.white.opacity(0.7))
                }
            }
        }
        .onAppear {
            loadComics()
        }
    }
    
    // MARK: - Views
    
    private var emptyLibraryView: some View {
        VStack(spacing: 16) {
            Image(systemName: "books.vertical")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.3))
            
            Text(loc.emptyLibrary)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white.opacity(0.8))
            
            Text("Importe quadrinhos primeiro")
                .font(.body)
                .foregroundColor(.white.opacity(0.5))
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
    
    // MARK: - Actions
    
    private func loadComics() {
        allComics = LibraryService.shared.loadComics()
    }
    
    private func toggleSelection(_ comic: LibraryService.ComicItem) {
        let path = comic.url.path
        
        // Don't allow toggling comics already in collection
        guard !collection.contains(path) else { return }
        
        if selectedPaths.contains(path) {
            selectedPaths.remove(path)
        } else {
            selectedPaths.insert(path)
        }
    }
    
    private func saveSelection() {
        for path in selectedPaths {
            container.collections.addComic(path: path, to: collection.id)
        }
        dismiss()
    }
}

// MARK: - Comic Select Card

struct ComicSelectCard: View {
    let comic: LibraryService.ComicItem
    let isSelected: Bool
    let isAlreadyInCollection: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            ZStack(alignment: .topTrailing) {
                VStack(spacing: 8) {
                    Image(uiImage: comic.cover)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 140)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .strokeBorder(
                                    isSelected ? Color.green : (isAlreadyInCollection ? Color.blue : Color.clear),
                                    lineWidth: 3
                                )
                        )
                        .opacity(isAlreadyInCollection ? 0.5 : 1)
                    
                    Text(comic.title)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.center)
                }
                
                // Checkmark badge
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title2)
                        .foregroundColor(.green)
                        .background(Circle().fill(.black))
                        .offset(x: 6, y: -6)
                } else if isAlreadyInCollection {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.title3)
                        .foregroundColor(.blue)
                        .background(Circle().fill(.black))
                        .offset(x: 6, y: -6)
                }
            }
        }
        .buttonStyle(.plain)
        .disabled(isAlreadyInCollection)
    }
}
