//
//  CollectionsService.swift
//  ImagineRead
//
//  Manages user collections and favorites
//

import Foundation
import Combine

// MARK: - Models

/// Represents a user-created collection of comics
struct Collection: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String
    var icon: String           // SF Symbol name
    var colorHex: String       // Hex color string
    var comicPaths: [String]
    let createdAt: Date
    var updatedAt: Date
    
    /// Check if a comic is in this collection
    func contains(_ comicPath: String) -> Bool {
        comicPaths.contains(comicPath)
    }
    
    /// Number of comics in collection
    var count: Int {
        comicPaths.count
    }
}

// MARK: - Service

/// Service for managing user comic collections
final class CollectionsService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var collections: [Collection] = []
    
    // MARK: - Private Properties
    
    private let defaults: UserDefaults
    private static let storageKey = "userCollections"
    
    /// UUID of the built-in Favorites collection
    static let favoritesID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
    
    // MARK: - Init
    
    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        loadCollections()
        cleanupDuplicates()
        cleanupStalePaths()
        ensureFavoritesExists()
    }
    
    // MARK: - Public API
    
    /// Get all collections, with Favorites always first
    func allCollections() -> [Collection] {
        var sorted = collections.sorted { $0.createdAt < $1.createdAt }
        // Move Favorites to front
        if let favIndex = sorted.firstIndex(where: { $0.id == Self.favoritesID }) {
            let favorites = sorted.remove(at: favIndex)
            sorted.insert(favorites, at: 0)
        }
        return sorted
    }
    
    /// Get a specific collection by ID
    func collection(byId id: UUID) -> Collection? {
        collections.first { $0.id == id }
    }
    
    /// Create a new collection
    @discardableResult
    func createCollection(name: String, icon: String = "folder.fill", colorHex: String = "#7C3AED") -> Collection {
        let collection = Collection(
            id: UUID(),
            name: name,
            icon: icon,
            colorHex: colorHex,
            comicPaths: [],
            createdAt: Date(),
            updatedAt: Date()
        )
        collections.append(collection)
        save()
        return collection
    }
    
    /// Update collection properties
    func updateCollection(_ id: UUID, name: String? = nil, icon: String? = nil, colorHex: String? = nil) {
        guard let index = collections.firstIndex(where: { $0.id == id }) else { return }
        
        if let name = name {
            collections[index].name = name
        }
        if let icon = icon {
            collections[index].icon = icon
        }
        if let colorHex = colorHex {
            collections[index].colorHex = colorHex
        }
        collections[index].updatedAt = Date()
        save()
    }
    
    /// Delete a collection (cannot delete Favorites)
    func deleteCollection(_ id: UUID) {
        guard id != Self.favoritesID else { return }
        collections.removeAll { $0.id == id }
        save()
    }
    
    // MARK: - Comic Management
    
    /// Add a comic to a collection
    func addComic(path: String, to collectionId: UUID) {
        let normalizedPath = normalizePath(path)
        guard let index = collections.firstIndex(where: { $0.id == collectionId }) else { return }
        
        // Check if already exists (comparing normalized versions)
        let alreadyExists = collections[index].comicPaths.contains { normalizePath($0) == normalizedPath }
        guard !alreadyExists else { return }
        
        collections[index].comicPaths.append(normalizedPath)
        collections[index].updatedAt = Date()
        save()
    }
    
    /// Remove a comic from a collection
    func removeComic(path: String, from collectionId: UUID) {
        let normalizedPath = normalizePath(path)
        guard let index = collections.firstIndex(where: { $0.id == collectionId }) else { return }
        
        collections[index].comicPaths.removeAll { normalizePath($0) == normalizedPath }
        collections[index].updatedAt = Date()
        save()
    }
    
    /// Get all collections containing a specific comic
    func collections(containing comicPath: String) -> [Collection] {
        collections.filter { $0.contains(comicPath) }
    }
    
    // MARK: - Favorites Shortcuts
    
    /// Check if a comic is favorited
    func isFavorite(_ comicPath: String) -> Bool {
        let normalizedPath = normalizePath(comicPath)
        guard let favorites = collection(byId: Self.favoritesID) else { return false }
        return favorites.comicPaths.contains { normalizePath($0) == normalizedPath }
    }
    
    /// Toggle favorite status for a comic
    func toggleFavorite(_ comicPath: String) {
        if isFavorite(comicPath) {
            removeComic(path: comicPath, from: Self.favoritesID)
        } else {
            addComic(path: comicPath, to: Self.favoritesID)
        }
    }
    
    /// Get all favorited comic paths
    func favoritePaths() -> [String] {
        collection(byId: Self.favoritesID)?.comicPaths ?? []
    }
    
    // MARK: - Private Methods
    
    private func ensureFavoritesExists() {
        if collection(byId: Self.favoritesID) == nil {
            let favorites = Collection(
                id: Self.favoritesID,
                name: "Favoritos",
                icon: "heart.fill",
                colorHex: "#EC4899",
                comicPaths: [],
                createdAt: Date(timeIntervalSince1970: 0), // Oldest date = always first
                updatedAt: Date()
            )
            collections.insert(favorites, at: 0)
            save()
        }
    }
    
    private func loadCollections() {
        guard let data = defaults.data(forKey: Self.storageKey) else { return }
        do {
            collections = try JSONDecoder().decode([Collection].self, from: data)
        } catch {
            print("CollectionsService: Failed to decode collections: \(error)")
        }
    }
    
    private func save() {
        do {
            let data = try JSONEncoder().encode(collections)
            defaults.set(data, forKey: Self.storageKey)
            objectWillChange.send()
        } catch {
            print("CollectionsService: Failed to encode collections: \(error)")
        }
    }
    
    /// Normalize path to prevent duplicates from trailing slashes etc
    private func normalizePath(_ path: String) -> String {
        var normalized = path.trimmingCharacters(in: .whitespacesAndNewlines)
        while normalized.hasSuffix("/") {
            normalized = String(normalized.dropLast())
        }
        return normalized
    }
    
    /// Remove duplicate paths from all collections
    private func cleanupDuplicates() {
        var needsSave = false
        
        for i in 0..<collections.count {
            let originalPaths = collections[i].comicPaths
            var uniquePaths: [String] = []
            var seen: Set<String> = []
            
            for path in originalPaths {
                let normalized = normalizePath(path)
                if !seen.contains(normalized) {
                    seen.insert(normalized)
                    uniquePaths.append(normalized)
                }
            }
            
            if uniquePaths.count != originalPaths.count {
                collections[i].comicPaths = uniquePaths
                needsSave = true
                print("CollectionsService: Cleaned \(originalPaths.count - uniquePaths.count) duplicate paths from \(collections[i].name)")
            }
        }
        
        if needsSave {
            save()
        }
    }
    
    /// Remove paths that point to files that no longer exist
    private func cleanupStalePaths() {
        // Get all valid comic paths from the library
        let library = LibraryService.shared
        let allComics = library.loadComics()
        let validPaths = Set(allComics.map { $0.url.path })
        
        var needsSave = false
        
        for i in 0..<collections.count {
            let originalPaths = collections[i].comicPaths
            let existingPaths = originalPaths.filter { path in
                // Check if path (or its normalized version) exists in valid paths
                let normalized = normalizePath(path)
                return validPaths.contains(normalized) || validPaths.contains(path)
            }
            
            if existingPaths.count != originalPaths.count {
                let removed = originalPaths.count - existingPaths.count
                collections[i].comicPaths = existingPaths
                needsSave = true
                print("CollectionsService: Removed \(removed) stale paths from \(collections[i].name)")
            }
        }
        
        if needsSave {
            save()
        }
    }
}
