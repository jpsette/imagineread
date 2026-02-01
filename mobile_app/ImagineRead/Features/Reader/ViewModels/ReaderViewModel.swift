//
//  ReaderViewModel.swift
//  ImagineRead
//
//  ViewModel for the comic reader
//

import SwiftUI
import PDFKit

/// ViewModel that manages the reader state and navigation
@MainActor
final class ReaderViewModel: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var comic: Comic?
    @Published private(set) var pageCache: PageCache?
    @Published var currentPageIndex: Int = 0 {
        didSet {
            // Trigger prefetch when page changes
            pageCache?.onPageAppear(currentPageIndex)
        }
    }
    @Published private(set) var isLoading: Bool = true
    @Published private(set) var errorMessage: String?
    
    // MARK: - Computed Properties
    
    var totalPages: Int {
        comic?.pageCount ?? 0
    }
    
    var hasNextPage: Bool {
        currentPageIndex < totalPages - 1
    }
    
    var hasPreviousPage: Bool {
        currentPageIndex > 0
    }
    
    var pageDisplayText: String {
        guard totalPages > 0 else { return "" }
        return "\(currentPageIndex + 1) / \(totalPages)"
    }
    
    // MARK: - Public Methods
    
    /// Load a comic from a PDF URL
    func loadComic(from url: URL) {
        isLoading = true
        errorMessage = nil
        
        Task.detached(priority: .userInitiated) { [weak self] in
            guard let document = PDFDocument(url: url) else {
                await MainActor.run {
                    self?.errorMessage = "Não foi possível carregar o quadrinho"
                    self?.isLoading = false
                }
                return
            }
            
            let title = url.deletingPathExtension().lastPathComponent
                .replacingOccurrences(of: "_", with: " ")
                .replacingOccurrences(of: "-", with: " ")
            
            let comic = Comic(title: title, pdfDocument: document)
            let cache = PageCache(pdfDocument: document)
            
            await MainActor.run {
                self?.comic = comic
                self?.pageCache = cache
                self?.currentPageIndex = 0
                self?.isLoading = false
                
                // Preload initial pages
                cache.preloadInitialPages()
            }
        }
    }
    
    /// Navigate to the next page
    func nextPage() {
        guard hasNextPage else { return }
        currentPageIndex += 1
    }
    
    /// Navigate to the previous page
    func previousPage() {
        guard hasPreviousPage else { return }
        currentPageIndex -= 1
    }
}
