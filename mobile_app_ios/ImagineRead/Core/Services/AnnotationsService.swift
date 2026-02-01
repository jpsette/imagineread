//
//  AnnotationsService.swift
//  ImagineRead
//
//  Manages user annotations and highlights on comics
//

import Foundation
import Combine
import CoreGraphics

// MARK: - Models

/// Represents a user annotation on a comic page
struct Annotation: Codable, Identifiable, Equatable {
    let id: UUID
    let comicPath: String
    let pageIndex: Int
    var text: String
    var highlightColor: String?    // Hex color for highlight
    var relativePosition: CGPoint? // Position relative to page (0-1 range)
    let createdAt: Date
    var updatedAt: Date
    
    /// Create a new annotation
    static func create(
        comicPath: String,
        pageIndex: Int,
        text: String,
        highlightColor: String? = nil,
        position: CGPoint? = nil
    ) -> Annotation {
        Annotation(
            id: UUID(),
            comicPath: comicPath,
            pageIndex: pageIndex,
            text: text,
            highlightColor: highlightColor,
            relativePosition: position,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

// MARK: - Service

/// Service for managing comic annotations
final class AnnotationsService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var allAnnotations: [Annotation] = []
    
    // MARK: - Private Properties
    
    private let defaults: UserDefaults
    private static let storageKey = "userAnnotations"
    
    // MARK: - Init
    
    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        loadAnnotations()
    }
    
    // MARK: - Query Methods
    
    /// Get all annotations for a specific comic
    func annotations(for comicPath: String) -> [Annotation] {
        allAnnotations
            .filter { $0.comicPath == comicPath }
            .sorted { $0.pageIndex < $1.pageIndex }
    }
    
    /// Get annotations for a specific page
    func annotationsForPage(_ pageIndex: Int, in comicPath: String) -> [Annotation] {
        allAnnotations.filter {
            $0.comicPath == comicPath && $0.pageIndex == pageIndex
        }
    }
    
    /// Get annotation count for a comic
    func annotationCount(for comicPath: String) -> Int {
        allAnnotations.filter { $0.comicPath == comicPath }.count
    }
    
    /// Check if a page has annotations
    func hasAnnotations(page: Int, in comicPath: String) -> Bool {
        allAnnotations.contains { $0.comicPath == comicPath && $0.pageIndex == page }
    }
    
    /// Get specific annotation by ID
    func annotation(byId id: UUID) -> Annotation? {
        allAnnotations.first { $0.id == id }
    }
    
    // MARK: - Mutation Methods
    
    /// Add a new annotation
    @discardableResult
    func addAnnotation(
        to comicPath: String,
        page: Int,
        text: String,
        highlightColor: String? = nil,
        position: CGPoint? = nil
    ) -> Annotation {
        let annotation = Annotation.create(
            comicPath: comicPath,
            pageIndex: page,
            text: text,
            highlightColor: highlightColor,
            position: position
        )
        allAnnotations.append(annotation)
        save()
        return annotation
    }
    
    /// Update an existing annotation
    func updateAnnotation(_ id: UUID, text: String? = nil, highlightColor: String? = nil) {
        guard let index = allAnnotations.firstIndex(where: { $0.id == id }) else { return }
        
        if let text = text {
            allAnnotations[index].text = text
        }
        if let color = highlightColor {
            allAnnotations[index].highlightColor = color
        }
        allAnnotations[index].updatedAt = Date()
        save()
    }
    
    /// Delete an annotation
    func deleteAnnotation(_ id: UUID) {
        allAnnotations.removeAll { $0.id == id }
        save()
    }
    
    /// Delete all annotations for a comic
    func deleteAllAnnotations(for comicPath: String) {
        allAnnotations.removeAll { $0.comicPath == comicPath }
        save()
    }
    
    // MARK: - Private Methods
    
    private func loadAnnotations() {
        guard let data = defaults.data(forKey: Self.storageKey) else { return }
        do {
            allAnnotations = try JSONDecoder().decode([Annotation].self, from: data)
        } catch {
            print("AnnotationsService: Failed to decode annotations: \(error)")
        }
    }
    
    private func save() {
        do {
            let data = try JSONEncoder().encode(allAnnotations)
            defaults.set(data, forKey: Self.storageKey)
            objectWillChange.send()
        } catch {
            print("AnnotationsService: Failed to encode annotations: \(error)")
        }
    }
}
