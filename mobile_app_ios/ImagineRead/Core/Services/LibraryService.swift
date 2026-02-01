//
//  LibraryService.swift
//  ImagineRead
//
//  Service for loading comics from the Comics folder
//

import UIKit
import PDFKit

/// Service that scans the Comics folder and loads available comics
final class LibraryService {
    
    static let shared = LibraryService()
    private init() {}
    
    /// Comic item for library display
    struct ComicItem: Identifiable {
        let id: String
        let title: String
        let url: URL
        let cover: UIImage
        let pageCount: Int
    }
    
    /// Load all comics from the Comics folder in the bundle
    func loadComics() -> [ComicItem] {
        guard let comicsPath = Bundle.main.resourcePath?.appending("/Comics") else {
            return []
        }
        
        let comicsURL = URL(fileURLWithPath: comicsPath)
        
        guard let files = try? FileManager.default.contentsOfDirectory(
            at: comicsURL,
            includingPropertiesForKeys: nil,
            options: .skipsHiddenFiles
        ) else {
            return []
        }
        
        let pdfFiles = files.filter { $0.pathExtension.lowercased() == "pdf" }
        
        return pdfFiles.compactMap { url in
            loadComicItem(from: url)
        }.sorted { $0.title < $1.title }
    }
    
    /// Load a single comic item with cover
    private func loadComicItem(from url: URL) -> ComicItem? {
        guard let document = PDFDocument(url: url),
              let firstPage = document.page(at: 0) else {
            return nil
        }
        
        let cover = renderCover(from: firstPage)
        let title = url.deletingPathExtension().lastPathComponent
            .replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
        
        return ComicItem(
            id: url.lastPathComponent,
            title: title,
            url: url,
            cover: cover,
            pageCount: document.pageCount
        )
    }
    
    /// Render the first page as a cover image
    private func renderCover(from page: PDFPage) -> UIImage {
        let bounds = page.bounds(for: .mediaBox)
        let scale: CGFloat = 2.0
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
}
