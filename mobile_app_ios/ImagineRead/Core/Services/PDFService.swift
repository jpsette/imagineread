//
//  PDFService.swift
//  ImagineRead
//
//  Service for loading and parsing PDF files
//

import UIKit
import PDFKit

/// Service that handles PDF loading operations
final class PDFService {
    
    // MARK: - Singleton
    
    static let shared = PDFService()
    private init() {}
    
    // MARK: - Public Methods
    
    /// Load a comic from the app bundle
    func loadFromBundle(named filename: String) -> Comic? {
        guard let url = Bundle.main.url(forResource: filename, withExtension: "pdf") else {
            return nil
        }
        return loadFromURL(url)
    }
    
    /// Load a comic from a file URL
    func loadFromURL(_ url: URL, title: String? = nil) -> Comic? {
        guard let document = PDFDocument(url: url) else {
            return nil
        }
        
        let comicTitle = title ?? url.deletingPathExtension().lastPathComponent
            .replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
        
        return Comic(title: comicTitle, pdfDocument: document)
    }
}
