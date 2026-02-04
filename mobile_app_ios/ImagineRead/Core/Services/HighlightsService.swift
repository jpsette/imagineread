//
//  HighlightsService.swift
//  ImagineRead
//
//  Manages user highlights/markings on comic pages using Core Data
//

import Foundation
import Combine
import CoreGraphics
import CoreData

// MARK: - Models

/// Represents a highlight/marking on a comic page
struct Highlight: Identifiable, Equatable {
    let id: UUID
    let comicPath: String
    let pageIndex: Int
    let rect: CGRect        // Normalized 0-1 relative to page
    let color: String       // Hex color
    let createdAt: Date
    var note: String?       // Optional annotation/note
    
    /// Check if highlight has a note
    var hasNote: Bool {
        note != nil && !note!.isEmpty
    }
    
    /// Available highlight colors
    static let colors: [(name: String, hex: String)] = [
        ("Amarelo", "#FFE066"),
        ("Laranja", "#FFB366"),
        ("Vermelho", "#FF6B6B"),
        ("Rosa", "#FF99CC"),
        ("Roxo", "#B366FF"),
        ("Azul", "#66B3FF"),
        ("Ciano", "#66E0E0"),
        ("Verde", "#66E0A3")
    ]
    
    /// Create from Core Data entity
    init(entity: HighlightEntity) {
        self.id = entity.id ?? UUID()
        self.comicPath = entity.comicPath ?? ""
        self.pageIndex = Int(entity.pageIndex)
        self.rect = CGRect(
            x: entity.rectX,
            y: entity.rectY,
            width: entity.rectWidth,
            height: entity.rectHeight
        )
        self.color = entity.color ?? "#FFE066"
        self.createdAt = entity.createdAt ?? Date()
        self.note = entity.note
    }
    
    /// Create new highlight
    init(id: UUID = UUID(), comicPath: String, pageIndex: Int, rect: CGRect, color: String, createdAt: Date = Date(), note: String? = nil) {
        self.id = id
        self.comicPath = comicPath
        self.pageIndex = pageIndex
        self.rect = rect
        self.color = color
        self.createdAt = createdAt
        self.note = note
    }
}

// MARK: - Service

/// Service for managing comic highlights with Core Data persistence
final class HighlightsService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var allHighlights: [Highlight] = []
    @Published var selectedColor: String = Highlight.colors[0].hex
    
    // MARK: - Private Properties
    
    private let coreDataStack = CoreDataStack.shared
    private var context: NSManagedObjectContext { coreDataStack.mainContext }
    
    // Migration keys
    private static let legacyStorageKey = "userHighlights"
    private static let migrationCompletedKey = "highlightsMigratedToCoreData"
    
    // MARK: - Singleton
    
    static let shared = HighlightsService()
    
    // MARK: - Init
    
    init() {
        migrateFromUserDefaultsIfNeeded()
        loadHighlights()
    }
    
    // MARK: - Query Methods
    
    /// Get all highlights for a specific comic
    func highlights(for comicPath: String) -> [Highlight] {
        allHighlights
            .filter { $0.comicPath == comicPath }
            .sorted { $0.pageIndex < $1.pageIndex }
    }
    
    /// Get highlights for a specific page
    func highlightsForPage(_ pageIndex: Int, in comicPath: String) -> [Highlight] {
        allHighlights.filter {
            $0.comicPath == comicPath && $0.pageIndex == pageIndex
        }
    }
    
    /// Get highlight count for a comic
    func highlightCount(for comicPath: String) -> Int {
        allHighlights.filter { $0.comicPath == comicPath }.count
    }
    
    /// Check if a page has highlights
    func hasHighlights(page: Int, in comicPath: String) -> Bool {
        allHighlights.contains { $0.comicPath == comicPath && $0.pageIndex == page }
    }
    
    // MARK: - Mutation Methods
    
    /// Add a new highlight
    @discardableResult
    func addHighlight(
        to comicPath: String,
        page: Int,
        rect: CGRect,
        color: String? = nil
    ) -> Highlight {
        let entity = HighlightEntity(context: context)
        entity.id = UUID()
        entity.comicPath = comicPath
        entity.pageIndex = Int32(page)
        entity.rectX = rect.origin.x
        entity.rectY = rect.origin.y
        entity.rectWidth = rect.width
        entity.rectHeight = rect.height
        entity.color = color ?? selectedColor
        entity.createdAt = Date()
        entity.note = nil
        
        coreDataStack.save()
        
        let highlight = Highlight(entity: entity)
        allHighlights.append(highlight)
        objectWillChange.send()
        
        return highlight
    }
    
    /// Delete a highlight
    func deleteHighlight(_ id: UUID) {
        let request: NSFetchRequest<HighlightEntity> = HighlightEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", id as CVarArg)
        
        if let entities = try? context.fetch(request), let entity = entities.first {
            context.delete(entity)
            coreDataStack.save()
        }
        
        allHighlights.removeAll { $0.id == id }
        objectWillChange.send()
    }
    
    /// Delete all highlights for a page
    func deleteAllHighlights(for page: Int, in comicPath: String) {
        let request: NSFetchRequest<HighlightEntity> = HighlightEntity.fetchRequest()
        request.predicate = NSPredicate(format: "comicPath == %@ AND pageIndex == %d", comicPath, page)
        
        if let entities = try? context.fetch(request) {
            entities.forEach { context.delete($0) }
            coreDataStack.save()
        }
        
        allHighlights.removeAll { $0.comicPath == comicPath && $0.pageIndex == page }
        objectWillChange.send()
    }
    
    /// Delete all highlights for a comic
    func deleteAllHighlights(for comicPath: String) {
        let request: NSFetchRequest<HighlightEntity> = HighlightEntity.fetchRequest()
        request.predicate = NSPredicate(format: "comicPath == %@", comicPath)
        
        if let entities = try? context.fetch(request) {
            entities.forEach { context.delete($0) }
            coreDataStack.save()
        }
        
        allHighlights.removeAll { $0.comicPath == comicPath }
        objectWillChange.send()
    }
    
    /// Update note for a highlight
    func updateNote(for highlightId: UUID, note: String?) {
        let request: NSFetchRequest<HighlightEntity> = HighlightEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", highlightId as CVarArg)
        
        if let entities = try? context.fetch(request), let entity = entities.first {
            entity.note = note
            coreDataStack.save()
        }
        
        if let index = allHighlights.firstIndex(where: { $0.id == highlightId }) {
            allHighlights[index].note = note
            objectWillChange.send()
        }
    }
    
    /// Update rect for a highlight (for resize/reposition)
    func updateRect(for highlightId: UUID, rect: CGRect) {
        let request: NSFetchRequest<HighlightEntity> = HighlightEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", highlightId as CVarArg)
        
        if let entities = try? context.fetch(request), let entity = entities.first {
            entity.rectX = rect.origin.x
            entity.rectY = rect.origin.y
            entity.rectWidth = rect.width
            entity.rectHeight = rect.height
            coreDataStack.save()
        }
        
        if let index = allHighlights.firstIndex(where: { $0.id == highlightId }) {
            let old = allHighlights[index]
            allHighlights[index] = Highlight(
                id: old.id,
                comicPath: old.comicPath,
                pageIndex: old.pageIndex,
                rect: rect,
                color: old.color,
                createdAt: old.createdAt,
                note: old.note
            )
            objectWillChange.send()
        }
    }
    
    /// Update color for a highlight
    func updateColor(for highlightId: UUID, color: String) {
        let request: NSFetchRequest<HighlightEntity> = HighlightEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", highlightId as CVarArg)
        
        if let entities = try? context.fetch(request), let entity = entities.first {
            entity.color = color
            coreDataStack.save()
        }
        
        if let index = allHighlights.firstIndex(where: { $0.id == highlightId }) {
            let old = allHighlights[index]
            allHighlights[index] = Highlight(
                id: old.id,
                comicPath: old.comicPath,
                pageIndex: old.pageIndex,
                rect: old.rect,
                color: color,
                createdAt: old.createdAt,
                note: old.note
            )
            objectWillChange.send()
        }
    }
    
    /// Get highlight by ID
    func highlight(by id: UUID) -> Highlight? {
        allHighlights.first { $0.id == id }
    }
    
    // MARK: - Private Methods
    
    private func loadHighlights() {
        let request: NSFetchRequest<HighlightEntity> = HighlightEntity.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \HighlightEntity.createdAt, ascending: true)]
        
        do {
            let entities = try context.fetch(request)
            allHighlights = entities.map { Highlight(entity: $0) }
        } catch {
            print("HighlightsService: Failed to load highlights: \(error)")
        }
    }
    
    // MARK: - Migration from UserDefaults
    
    private func migrateFromUserDefaultsIfNeeded() {
        let defaults = UserDefaults.standard
        
        // Check if migration already completed
        guard !defaults.bool(forKey: Self.migrationCompletedKey) else { return }
        
        // Check if there's data to migrate
        guard let data = defaults.data(forKey: Self.legacyStorageKey) else {
            defaults.set(true, forKey: Self.migrationCompletedKey)
            return
        }
        
        // Decode legacy data
        do {
            let legacyHighlights = try JSONDecoder().decode([LegacyHighlight].self, from: data)
            
            // Migrate to Core Data
            for legacy in legacyHighlights {
                let entity = HighlightEntity(context: context)
                entity.id = legacy.id
                entity.comicPath = legacy.comicPath
                entity.pageIndex = Int32(legacy.pageIndex)
                entity.rectX = legacy.rect.origin.x
                entity.rectY = legacy.rect.origin.y
                entity.rectWidth = legacy.rect.width
                entity.rectHeight = legacy.rect.height
                entity.color = legacy.color
                entity.createdAt = legacy.createdAt
                entity.note = legacy.note
            }
            
            coreDataStack.save()
            
            // Mark migration as completed and clear legacy data
            defaults.set(true, forKey: Self.migrationCompletedKey)
            defaults.removeObject(forKey: Self.legacyStorageKey)
            
            print("HighlightsService: Migrated \(legacyHighlights.count) highlights to Core Data")
            
        } catch {
            print("HighlightsService: Migration failed: \(error)")
            // Don't mark as completed so we can retry
        }
    }
}

// MARK: - Legacy Model for Migration

private struct LegacyHighlight: Codable {
    let id: UUID
    let comicPath: String
    let pageIndex: Int
    let rect: CGRect
    let color: String
    let createdAt: Date
    var note: String?
}

// MARK: - CGRect Codable Extension (for migration)

extension CGRect: @retroactive Codable {
    enum CodingKeys: String, CodingKey {
        case x, y, width, height
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let x = try container.decode(CGFloat.self, forKey: .x)
        let y = try container.decode(CGFloat.self, forKey: .y)
        let width = try container.decode(CGFloat.self, forKey: .width)
        let height = try container.decode(CGFloat.self, forKey: .height)
        self.init(x: x, y: y, width: width, height: height)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(origin.x, forKey: .x)
        try container.encode(origin.y, forKey: .y)
        try container.encode(size.width, forKey: .width)
        try container.encode(size.height, forKey: .height)
    }
}
