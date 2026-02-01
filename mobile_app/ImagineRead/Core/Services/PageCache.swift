//
//  PageCache.swift
//  ImagineRead
//
//  Caches rendered pages for smooth navigation
//

import UIKit
import PDFKit

/// Manages page caching with prefetching for smooth navigation
final class PageCache: ObservableObject {
    
    // MARK: - Properties
    
    private var cache: [Int: UIImage] = [:]
    private var prefetchTasks: [Int: Task<Void, Never>] = [:]
    private let pdfDocument: PDFDocument
    private let pageCount: Int
    private let lock = NSLock()
    
    /// How many pages to prefetch ahead and behind
    private let prefetchRadius = 3
    
    // MARK: - Init
    
    init(pdfDocument: PDFDocument) {
        self.pdfDocument = pdfDocument
        self.pageCount = pdfDocument.pageCount
    }
    
    // MARK: - Public Methods
    
    /// Get a cached image (thread-safe)
    func getImage(for index: Int) -> UIImage? {
        lock.lock()
        defer { lock.unlock() }
        return cache[index]
    }
    
    /// Called when viewing a page - triggers prefetching
    func onPageAppear(_ index: Int) {
        prefetchPages(around: index)
    }
    
    /// Preload initial pages
    func preloadInitialPages() {
        prefetchPages(around: 0)
    }
    
    // MARK: - Private Methods
    
    private func prefetchPages(around currentIndex: Int) {
        let start = max(0, currentIndex - prefetchRadius)
        let end = min(pageCount - 1, currentIndex + prefetchRadius)
        
        // Cancel tasks for pages far away
        cleanupDistantTasks(currentIndex: currentIndex)
        
        // Prefetch pages in range
        for index in start...end {
            ensurePageLoaded(index, priority: abs(index - currentIndex))
        }
    }
    
    private func ensurePageLoaded(_ index: Int, priority: Int) {
        lock.lock()
        let alreadyCached = cache[index] != nil
        let alreadyLoading = prefetchTasks[index] != nil
        lock.unlock()
        
        if alreadyCached || alreadyLoading { return }
        
        let taskPriority: TaskPriority = priority == 0 ? .high : .medium
        
        let task = Task(priority: taskPriority) { [weak self] in
            guard let self = self else { return }
            
            let image = self.renderPage(at: index)
            
            self.lock.lock()
            self.cache[index] = image
            self.prefetchTasks[index] = nil
            self.lock.unlock()
            
            await MainActor.run {
                self.objectWillChange.send()
            }
        }
        
        lock.lock()
        prefetchTasks[index] = task
        lock.unlock()
    }
    
    private func renderPage(at index: Int) -> UIImage {
        guard let page = pdfDocument.page(at: index) else {
            return UIImage()
        }
        
        let bounds = page.bounds(for: .mediaBox)
        let screenWidth = UIScreen.main.bounds.width
        let screenScale = UIScreen.main.scale
        let maxWidth = screenWidth * screenScale
        let scale = min(maxWidth / bounds.width, 2.5)
        
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
    
    private func cleanupDistantTasks(currentIndex: Int) {
        let keepRange = (currentIndex - prefetchRadius - 1)...(currentIndex + prefetchRadius + 1)
        
        lock.lock()
        
        // Cancel tasks outside range
        for (index, task) in prefetchTasks {
            if !keepRange.contains(index) {
                task.cancel()
                prefetchTasks[index] = nil
            }
        }
        
        // Remove cached pages far away
        let cacheRange = (currentIndex - prefetchRadius - 2)...(currentIndex + prefetchRadius + 2)
        for index in cache.keys {
            if !cacheRange.contains(index) {
                cache[index] = nil
            }
        }
        
        lock.unlock()
    }
}
