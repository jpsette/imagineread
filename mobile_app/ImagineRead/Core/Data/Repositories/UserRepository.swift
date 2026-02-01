//
//  UserRepository.swift
//  ImagineRead
//
//  Repository for user-related data
//

import Foundation

/// Repository for user-related operations
final class UserRepository {
    
    private let preferences: PreferencesService
    
    init(preferences: PreferencesService) {
        self.preferences = preferences
    }
    
    // MARK: - Reading State
    
    func getLastReadPage(for comicPath: String) -> Int {
        preferences.lastReadPage(for: comicPath)
    }
    
    func saveLastReadPage(_ page: Int, for comicPath: String) {
        preferences.saveLastReadPage(page, for: comicPath)
    }
    
    func getReadingProgress(for comicPath: String) -> Double {
        preferences.readingProgress(for: comicPath)
    }
    
    // MARK: - Bookmarks
    
    func getBookmarks(for comicPath: String) -> [Int] {
        preferences.bookmarkedPages(for: comicPath)
    }
    
    func addBookmark(page: Int, for comicPath: String) {
        preferences.addBookmark(page: page, for: comicPath)
    }
    
    func removeBookmark(page: Int, for comicPath: String) {
        preferences.removeBookmark(page: page, for: comicPath)
    }
    
    func toggleBookmark(page: Int, for comicPath: String) {
        preferences.toggleBookmark(page: page, for: comicPath)
    }
    
    func isBookmarked(page: Int, for comicPath: String) -> Bool {
        preferences.isPageBookmarked(page, for: comicPath)
    }
}
