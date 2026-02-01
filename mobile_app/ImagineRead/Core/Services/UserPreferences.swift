//
//  UserPreferences.swift
//  ImagineRead
//
//  Manages user preferences with UserDefaults
//

import Foundation

/// Singleton that manages all user preferences
final class UserPreferences {
    
    static let shared = UserPreferences()
    
    private let defaults = UserDefaults.standard
    
    // MARK: - Keys
    
    private enum Keys {
        static let readingMode = "readingMode"
        static let nightMode = "nightMode"
        static let lastReadPage = "lastReadPage_"
    }
    
    private init() {}
    
    // MARK: - Reading Mode
    
    /// Get saved reading mode
    var readingMode: ReadingMode {
        get {
            guard let rawValue = defaults.string(forKey: Keys.readingMode),
                  let mode = ReadingMode(rawValue: rawValue) else {
                return .horizontal
            }
            return mode
        }
        set {
            defaults.set(newValue.rawValue, forKey: Keys.readingMode)
        }
    }
    
    // MARK: - Last Read Page (per comic)
    
    /// Get last read page for a specific comic
    func lastReadPage(for comicPath: String) -> Int {
        let key = Keys.lastReadPage + comicPath.hashValue.description
        return defaults.integer(forKey: key)
    }
    
    /// Save last read page for a specific comic
    func saveLastReadPage(_ page: Int, for comicPath: String) {
        let key = Keys.lastReadPage + comicPath.hashValue.description
        defaults.set(page, forKey: key)
    }
    
    // MARK: - Night Mode
    
    /// Get saved night mode
    var nightMode: NightMode {
        get {
            guard let rawValue = defaults.string(forKey: Keys.nightMode),
                  let mode = NightMode(rawValue: rawValue) else {
                return .off
            }
            return mode
        }
        set {
            defaults.set(newValue.rawValue, forKey: Keys.nightMode)
        }
    }
    
    /// Filter intensity (0.0 to 1.0)
    var filterIntensity: Double {
        get {
            let value = defaults.double(forKey: "filterIntensity")
            return value == 0 ? 0.5 : value // Default to 0.5
        }
        set {
            defaults.set(newValue, forKey: "filterIntensity")
        }
    }
    
    // MARK: - Bookmarks (manual)
    
    private static let bookmarkKey = "bookmark_"
    
    /// Get bookmarked page for a specific comic (nil if none)
    func bookmarkedPage(for comicPath: String) -> Int? {
        let key = Self.bookmarkKey + comicPath.hashValue.description
        let value = defaults.integer(forKey: key)
        // 0 means not set (default), -1 means explicitly no bookmark
        return value > 0 ? value - 1 : nil // Store as 1-indexed internally
    }
    
    /// Set bookmark for current page (nil to remove)
    func setBookmark(page: Int?, for comicPath: String) {
        let key = Self.bookmarkKey + comicPath.hashValue.description
        if let page = page {
            defaults.set(page + 1, forKey: key) // Store as 1-indexed
        } else {
            defaults.removeObject(forKey: key)
        }
    }
    
    /// Check if a specific page is bookmarked
    func isPageBookmarked(_ page: Int, for comicPath: String) -> Bool {
        return bookmarkedPage(for: comicPath) == page
    }
}
