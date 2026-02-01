//
//  PreferencesService.swift
//  ImagineRead
//
//  User preferences abstraction over UserDefaults
//

import Foundation
import Combine

/// Service for managing user preferences
final class PreferencesService: ObservableObject {
    
    private let defaults: UserDefaults
    
    // MARK: - Published Properties (for reactive updates)
    
    @Published var appLanguage: AppLanguage
    @Published var readingMode: ReadingMode
    @Published var readingLanguage: ReadingLanguage
    @Published var nightMode: NightMode
    @Published var balloonFontSize: Double
    @Published var filterIntensity: Double
    
    // MARK: - Keys
    
    private enum Keys {
        static let appLanguage = "appLanguage"
        static let readingMode = "readingMode"
        static let readingLanguage = "readingLanguage"
        static let nightMode = "nightMode"
        static let balloonFontSize = "balloonFontSize"
        static let filterIntensity = "filterIntensity"
        static let lastReadPage = "lastReadPage_"
        static let bookmarks = "bookmarks_"
        static let totalPages = "totalPages_"
    }
    
    // MARK: - Init
    
    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        
        // Load saved values
        self.appLanguage = Self.loadEnum(from: defaults, key: Keys.appLanguage) ?? .portuguese
        self.readingMode = Self.loadEnum(from: defaults, key: Keys.readingMode) ?? .horizontal
        self.readingLanguage = Self.loadEnum(from: defaults, key: Keys.readingLanguage) ?? .portuguese
        self.nightMode = Self.loadEnum(from: defaults, key: Keys.nightMode) ?? .off
        
        let fontSize = defaults.double(forKey: Keys.balloonFontSize)
        self.balloonFontSize = fontSize == 0 ? 1.0 : fontSize
        
        let intensity = defaults.double(forKey: Keys.filterIntensity)
        self.filterIntensity = intensity == 0 ? 0.5 : intensity
    }
    
    // MARK: - Save Methods
    
    func saveAppLanguage(_ language: AppLanguage) {
        appLanguage = language
        defaults.set(language.rawValue, forKey: Keys.appLanguage)
        // Sync reading language
        saveReadingLanguage(language.toReadingLanguage)
    }
    
    func saveReadingMode(_ mode: ReadingMode) {
        readingMode = mode
        defaults.set(mode.rawValue, forKey: Keys.readingMode)
    }
    
    func saveReadingLanguage(_ language: ReadingLanguage) {
        readingLanguage = language
        defaults.set(language.rawValue, forKey: Keys.readingLanguage)
    }
    
    func saveNightMode(_ mode: NightMode) {
        nightMode = mode
        defaults.set(mode.rawValue, forKey: Keys.nightMode)
    }
    
    func saveBalloonFontSize(_ size: Double) {
        balloonFontSize = size
        defaults.set(size, forKey: Keys.balloonFontSize)
    }
    
    func saveFilterIntensity(_ intensity: Double) {
        filterIntensity = intensity
        defaults.set(intensity, forKey: Keys.filterIntensity)
    }
    
    // MARK: - Per-Comic Data
    
    func lastReadPage(for comicPath: String) -> Int {
        defaults.integer(forKey: Keys.lastReadPage + comicPath.hashValue.description)
    }
    
    func saveLastReadPage(_ page: Int, for comicPath: String) {
        defaults.set(page, forKey: Keys.lastReadPage + comicPath.hashValue.description)
    }
    
    func totalPages(for comicPath: String) -> Int {
        defaults.integer(forKey: Keys.totalPages + comicPath.hashValue.description)
    }
    
    func saveTotalPages(_ count: Int, for comicPath: String) {
        defaults.set(count, forKey: Keys.totalPages + comicPath.hashValue.description)
    }
    
    func readingProgress(for comicPath: String) -> Double {
        let lastPage = lastReadPage(for: comicPath)
        let total = totalPages(for: comicPath)
        guard total > 0 else { return 0 }
        return Double(lastPage + 1) / Double(total)
    }
    
    func readingProgressText(for comicPath: String) -> String? {
        let progress = readingProgress(for: comicPath)
        guard progress > 0 else { return nil }
        return "\(Int(progress * 100))%"
    }
    
    // MARK: - Bookmarks
    
    func bookmarkedPages(for comicPath: String) -> [Int] {
        defaults.array(forKey: Keys.bookmarks + comicPath.hashValue.description) as? [Int] ?? []
    }
    
    func addBookmark(page: Int, for comicPath: String) {
        var bookmarks = bookmarkedPages(for: comicPath)
        if !bookmarks.contains(page) {
            bookmarks.append(page)
            bookmarks.sort()
            defaults.set(bookmarks, forKey: Keys.bookmarks + comicPath.hashValue.description)
            objectWillChange.send()
        }
    }
    
    func removeBookmark(page: Int, for comicPath: String) {
        var bookmarks = bookmarkedPages(for: comicPath)
        bookmarks.removeAll { $0 == page }
        defaults.set(bookmarks, forKey: Keys.bookmarks + comicPath.hashValue.description)
        objectWillChange.send()
    }
    
    func toggleBookmark(page: Int, for comicPath: String) {
        if isPageBookmarked(page, for: comicPath) {
            removeBookmark(page: page, for: comicPath)
        } else {
            addBookmark(page: page, for: comicPath)
        }
    }
    
    func isPageBookmarked(_ page: Int, for comicPath: String) -> Bool {
        bookmarkedPages(for: comicPath).contains(page)
    }
    
    // MARK: - Offline Comics
    
    private static let offlineComicsKey = "offlineComicPaths"
    
    func offlineComicPaths() -> [String] {
        defaults.array(forKey: Self.offlineComicsKey) as? [String] ?? []
    }
    
    func isComicOffline(_ path: String) -> Bool {
        offlineComicPaths().contains(path)
    }
    
    func addOfflineComic(path: String) {
        var paths = offlineComicPaths()
        guard !paths.contains(path) else { return }
        paths.append(path)
        defaults.set(paths, forKey: Self.offlineComicsKey)
        objectWillChange.send()
    }
    
    func removeOfflineComic(path: String) {
        var paths = offlineComicPaths()
        paths.removeAll { $0 == path }
        defaults.set(paths, forKey: Self.offlineComicsKey)
        objectWillChange.send()
    }
    
    // MARK: - Comic Ratings
    
    private static let ratingsKey = "comicRatings"
    private static let commentsKey = "comicComments"
    
    func comicRating(for path: String) -> Int {
        let ratings = defaults.dictionary(forKey: Self.ratingsKey) as? [String: Int] ?? [:]
        return ratings[path] ?? 0
    }
    
    func saveComicRating(_ rating: Int, for path: String) {
        var ratings = defaults.dictionary(forKey: Self.ratingsKey) as? [String: Int] ?? [:]
        ratings[path] = rating
        defaults.set(ratings, forKey: Self.ratingsKey)
        objectWillChange.send()
    }
    
    func comicComment(for path: String) -> String? {
        let comments = defaults.dictionary(forKey: Self.commentsKey) as? [String: String] ?? [:]
        return comments[path]
    }
    
    func saveComicComment(_ comment: String, for path: String) {
        var comments = defaults.dictionary(forKey: Self.commentsKey) as? [String: String] ?? [:]
        comments[path] = comment
        defaults.set(comments, forKey: Self.commentsKey)
        objectWillChange.send()
    }
    
    // MARK: - Private Helpers
    
    private static func loadEnum<T: RawRepresentable>(from defaults: UserDefaults, key: String) -> T? where T.RawValue == String {
        guard let rawValue = defaults.string(forKey: key) else { return nil }
        return T(rawValue: rawValue)
    }
}
