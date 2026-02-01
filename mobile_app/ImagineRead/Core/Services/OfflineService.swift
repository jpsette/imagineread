//
//  OfflineService.swift
//  ImagineRead
//
//  Service for managing offline comic downloads
//

import Foundation
import PDFKit
import UIKit

/// Service for managing offline comic storage
final class OfflineService: ObservableObject {
    
    static let shared = OfflineService()
    
    private let fileManager = FileManager.default
    
    private var offlineDirectory: URL {
        let docs = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let offlineDir = docs.appendingPathComponent("OfflineComics", isDirectory: true)
        
        if !fileManager.fileExists(atPath: offlineDir.path) {
            try? fileManager.createDirectory(at: offlineDir, withIntermediateDirectories: true)
        }
        
        return offlineDir
    }
    
    // MARK: - Public Methods
    
    /// Download a comic for offline use (copies to app's documents)
    func downloadComic(from sourceURL: URL, completion: @escaping (Result<URL, Error>) -> Void) {
        let fileName = sourceURL.lastPathComponent
        let destinationURL = offlineDirectory.appendingPathComponent(fileName)
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            
            do {
                // If already exists, just return it
                if self.fileManager.fileExists(atPath: destinationURL.path) {
                    DispatchQueue.main.async {
                        completion(.success(destinationURL))
                    }
                    return
                }
                
                // Copy file to offline storage
                try self.fileManager.copyItem(at: sourceURL, to: destinationURL)
                
                DispatchQueue.main.async {
                    completion(.success(destinationURL))
                }
            } catch {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
            }
        }
    }
    
    /// Remove a comic from offline storage
    func removeOfflineComic(at path: String) {
        let url = URL(fileURLWithPath: path)
        let fileName = url.lastPathComponent
        let offlineURL = offlineDirectory.appendingPathComponent(fileName)
        
        try? fileManager.removeItem(at: offlineURL)
    }
    
    /// Get URL for offline comic
    func offlineURL(for originalPath: String) -> URL? {
        let url = URL(fileURLWithPath: originalPath)
        let fileName = url.lastPathComponent
        let offlineURL = offlineDirectory.appendingPathComponent(fileName)
        
        return fileManager.fileExists(atPath: offlineURL.path) ? offlineURL : nil
    }
    
    /// Load all offline comics with cover images
    func loadOfflineComics() -> [OfflineComic] {
        guard let files = try? fileManager.contentsOfDirectory(at: offlineDirectory, includingPropertiesForKeys: nil) else {
            return []
        }
        
        return files.compactMap { url -> OfflineComic? in
            guard url.pathExtension.lowercased() == "pdf" else { return nil }
            guard let document = PDFDocument(url: url) else { return nil }
            
            let cover = renderCover(from: document)
            let title = url.deletingPathExtension().lastPathComponent
            
            return OfflineComic(
                url: url,
                title: title,
                cover: cover,
                pageCount: document.pageCount
            )
        }
    }
    
    // MARK: - Private Helpers
    
    private func renderCover(from document: PDFDocument) -> UIImage {
        guard let page = document.page(at: 0) else {
            return UIImage(systemName: "book.fill")!
        }
        
        let bounds = page.bounds(for: .mediaBox)
        let scale: CGFloat = 200 / bounds.width
        let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
        
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { ctx in
            UIColor.white.setFill()
            ctx.fill(CGRect(origin: .zero, size: size))
            
            ctx.cgContext.translateBy(x: 0, y: size.height)
            ctx.cgContext.scaleBy(x: scale, y: -scale)
            
            page.draw(with: .mediaBox, to: ctx.cgContext)
        }
    }
}

// MARK: - Offline Comic Model

struct OfflineComic: Identifiable {
    let id = UUID()
    let url: URL
    let title: String
    let cover: UIImage
    let pageCount: Int
}
