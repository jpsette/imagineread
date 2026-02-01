//
//  LibraryViewModel.swift
//  ImagineRead
//
//  ViewModel for the comic library
//

import SwiftUI

/// ViewModel that manages the library state
@MainActor
final class LibraryViewModel: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var comics: [LibraryService.ComicItem] = []
    @Published private(set) var isLoading: Bool = false
    @Published var selectedComic: LibraryService.ComicItem?
    
    // MARK: - Computed Properties
    
    var isEmpty: Bool {
        comics.isEmpty && !isLoading
    }
    
    // MARK: - Public Methods
    
    /// Load comics from the library
    func loadLibrary() {
        isLoading = true
        
        // Small delay to show loading state
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.comics = LibraryService.shared.loadComics()
            self?.isLoading = false
        }
    }
    
    /// Select a comic to read
    func selectComic(_ comic: LibraryService.ComicItem) {
        selectedComic = comic
    }
    
    /// Clear selection
    func clearSelection() {
        selectedComic = nil
    }
}
