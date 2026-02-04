//
//  LibraryService.swift
//  ImagineRead
//
//  Service for loading comics from both bundle and downloaded files
//

import UIKit
import PDFKit

/// Service that scans comics from bundle and Documents folder
final class LibraryService: ObservableObject {
    
    static let shared = LibraryService()
    
    /// Comic item for library display
    struct ComicItem: Identifiable {
        let id: String
        let title: String
        let url: URL
        let cover: UIImage
        let pageCount: Int
        let fileSize: Int64
        let isDownloaded: Bool // true = from Documents, false = bundled
    }
    
    // MARK: - Published
    
    @Published var comics: [ComicItem] = []
    @Published var isLoading = false
    
    // MARK: - Caching
    
    private var coverCache: [String: UIImage] = [:]
    
    private init() {
        // Listen for new comics added
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(reloadComics),
            name: .comicAdded,
            object: nil
        )
    }
    
    // MARK: - Public Methods
    
    /// Get the Documents/Comics directory for downloads
    static var downloadsDirectory: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let comicsDir = docs.appendingPathComponent("Comics")
        
        // Create if doesn't exist
        if !FileManager.default.fileExists(atPath: comicsDir.path) {
            try? FileManager.default.createDirectory(at: comicsDir, withIntermediateDirectories: true)
        }
        
        return comicsDir
    }
    
    /// Synchronous access to comics (for backwards compatibility)
    func loadComics() -> [ComicItem] {
        // If we have cached comics, return them
        if !comics.isEmpty {
            return comics
        }
        
        // Otherwise load synchronously from both sources
        var allComics: [ComicItem] = []
        allComics.append(contentsOf: loadFromDocuments())
        // Optionally: allComics.append(contentsOf: loadFromBundle())
        return allComics.sorted { $0.title < $1.title }
    }
    
    /// Force refresh
    @objc func reloadComics() {
        Task { @MainActor in
            await loadAllComics()
        }
    }
    
    /// Load all comics from bundle and Documents
    @MainActor
    func loadAllComics() async {
        isLoading = true
        
        let loadedComics = await Task.detached(priority: .userInitiated) {
            var allComics: [ComicItem] = []
            
            // 1. Load from Documents/Comics (downloaded files)
            allComics.append(contentsOf: self.loadFromDocuments())
            
            // 2. Load from Bundle (bundled files) - optional
            // allComics.append(contentsOf: self.loadFromBundle())
            
            return allComics.sorted { $0.title < $1.title }
        }.value
        
        comics = loadedComics
        isLoading = false
    }
    
    /// Load comics from Documents/Comics folder
    private func loadFromDocuments() -> [ComicItem] {
        let comicsDir = Self.downloadsDirectory
        
        guard let files = try? FileManager.default.contentsOfDirectory(
            at: comicsDir,
            includingPropertiesForKeys: [.fileSizeKey],
            options: .skipsHiddenFiles
        ) else {
            return []
        }
        
        let supportedExtensions = ["pdf", "epub", "cbz", "cbr"]
        let comicFiles = files.filter { supportedExtensions.contains($0.pathExtension.lowercased()) }
        
        return comicFiles.compactMap { url in
            loadComicItem(from: url, isDownloaded: true)
        }
    }
    
    /// Load comics from app bundle
    private func loadFromBundle() -> [ComicItem] {
        guard let comicsPath = Bundle.main.resourcePath?.appending("/Comics") else {
            return []
        }
        
        let comicsURL = URL(fileURLWithPath: comicsPath)
        
        guard let files = try? FileManager.default.contentsOfDirectory(
            at: comicsURL,
            includingPropertiesForKeys: [.fileSizeKey],
            options: .skipsHiddenFiles
        ) else {
            return []
        }
        
        let pdfFiles = files.filter { $0.pathExtension.lowercased() == "pdf" }
        
        return pdfFiles.compactMap { url in
            loadComicItem(from: url, isDownloaded: false)
        }
    }
    
    /// Load a single comic item with cover
    private func loadComicItem(from url: URL, isDownloaded: Bool) -> ComicItem? {
        // Get file size
        let fileSize: Int64
        if let attrs = try? FileManager.default.attributesOfItem(atPath: url.path),
           let size = attrs[.size] as? Int64 {
            fileSize = size
        } else {
            fileSize = 0
        }
        
        // Check cover cache first
        let cacheKey = url.path
        let cachedCover = coverCache[cacheKey]
        
        // For PDFs, extract cover
        if url.pathExtension.lowercased() == "pdf" {
            guard let document = PDFDocument(url: url),
                  let firstPage = document.page(at: 0) else {
                return nil
            }
            
            let cover = cachedCover ?? renderCover(from: firstPage)
            
            if cachedCover == nil {
                coverCache[cacheKey] = cover
            }
            
            let title = url.deletingPathExtension().lastPathComponent
                .replacingOccurrences(of: "_", with: " ")
                .replacingOccurrences(of: "-", with: " ")
            
            return ComicItem(
                id: url.lastPathComponent,
                title: title,
                url: url,
                cover: cover,
                pageCount: document.pageCount,
                fileSize: fileSize,
                isDownloaded: isDownloaded
            )
        }
        
        // For other formats, use placeholder
        let title = url.deletingPathExtension().lastPathComponent
        let placeholder = UIImage(systemName: "book.fill") ?? UIImage()
        
        return ComicItem(
            id: url.lastPathComponent,
            title: title,
            url: url,
            cover: placeholder,
            pageCount: 0,
            fileSize: fileSize,
            isDownloaded: isDownloaded
        )
    }
    
    /// Render the first page as a cover image
    private func renderCover(from page: PDFPage) -> UIImage {
        let bounds = page.bounds(for: .mediaBox)
        let scale: CGFloat = 1.5
        let size = CGSize(
            width: bounds.width * scale,
            height: bounds.height * scale
        )
        
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { context in
            UIColor.white.setFill()
            context.fill(CGRect(origin: .zero, size: size))
            
            context.cgContext.translateBy(x: 0, y: size.height)
            context.cgContext.scaleBy(x: scale, y: -scale)
            
            page.draw(with: .mediaBox, to: context.cgContext)
        }
    }
    
    /// Delete a comic file
    func deleteComic(_ comic: ComicItem) -> Bool {
        guard comic.isDownloaded else { return false } // Can't delete bundled
        
        do {
            try FileManager.default.removeItem(at: comic.url)
            comics.removeAll { $0.id == comic.id }
            coverCache.removeValue(forKey: comic.url.path)
            return true
        } catch {
            print("Failed to delete: \(error)")
            return false
        }
    }
}
