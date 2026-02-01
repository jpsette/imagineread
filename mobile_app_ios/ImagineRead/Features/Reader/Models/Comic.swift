//
//  Comic.swift
//  ImagineRead
//
//  Data models for comics and pages
//

import UIKit
import PDFKit

// MARK: - Comic Model

/// Represents a comic with its pages
struct Comic: Identifiable, Equatable {
    let id: UUID
    let title: String
    let pageCount: Int
    
    /// Reference to PDF document for lazy loading
    let pdfDocument: PDFDocument
    
    init(title: String, pdfDocument: PDFDocument) {
        self.id = UUID()
        self.title = title
        self.pdfDocument = pdfDocument
        self.pageCount = pdfDocument.pageCount
    }
    
    /// Get a page at index (lazy loaded)
    func page(at index: Int) -> ComicPage? {
        guard index >= 0, index < pageCount else { return nil }
        return ComicPage(index: index, pdfDocument: pdfDocument)
    }
    
    // Equatable - compare by ID only
    static func == (lhs: Comic, rhs: Comic) -> Bool {
        lhs.id == rhs.id
    }
}

// MARK: - Comic Page Model

/// Represents a single page in a comic (lazy loaded)
struct ComicPage: Identifiable {
    let id: UUID
    let index: Int
    
    private let pdfDocument: PDFDocument
    
    init(index: Int, pdfDocument: PDFDocument) {
        self.id = UUID()
        self.index = index
        self.pdfDocument = pdfDocument
    }
    
    /// Render the page image on demand
    var image: UIImage {
        renderPage()
    }
    
    private func renderPage() -> UIImage {
        guard let page = pdfDocument.page(at: index) else {
            return UIImage()
        }
        
        let bounds = page.bounds(for: .mediaBox)
        
        // Calculate scale based on screen size for optimal quality
        let screenScale = UIScreen.main.scale
        let maxWidth = UIScreen.main.bounds.width * screenScale
        let scale = min(maxWidth / bounds.width, 3.0) // Cap at 3x
        
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
