//
//  LibraryViewModel.swift
//  ImagineRead
//
//  ViewModel for the comic library
//

import SwiftUI
import Combine

/// ViewModel that manages the library state
@MainActor
final class LibraryViewModel: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var comics: [LibraryService.ComicItem] = []
    @Published private(set) var isLoading: Bool = false
    @Published var selectedComic: LibraryService.ComicItem?
    
    private var cancellables = Set<AnyCancellable>()
    private let libraryService = LibraryService.shared
    
    // MARK: - Computed Properties
    
    var isEmpty: Bool {
        comics.isEmpty && !isLoading
    }
    
    // MARK: - Init
    
    init() {
        // Subscribe to library changes
        libraryService.$comics
            .receive(on: DispatchQueue.main)
            .sink { [weak self] comics in
                self?.comics = comics
            }
            .store(in: &cancellables)
        
        libraryService.$isLoading
            .receive(on: DispatchQueue.main)
            .sink { [weak self] loading in
                self?.isLoading = loading
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Public Methods
    
    /// Load comics from the library
    func loadLibrary() {
        Task {
            await libraryService.loadAllComics()
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
    
    /// Delete a comic
    func deleteComic(_ comic: LibraryService.ComicItem) {
        _ = libraryService.deleteComic(comic)
    }
}
