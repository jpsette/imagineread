//
//  ReadingStatsService.swift
//  ImagineRead
//
//  Tracks reading statistics and sessions
//

import Foundation
import Combine

// MARK: - Models

/// Represents a single reading session
struct ReadingSession: Codable, Identifiable {
    let id: UUID
    let comicPath: String
    let startTime: Date
    var endTime: Date?
    var pagesRead: Int
    
    var durationSeconds: Int {
        guard let end = endTime else { return 0 }
        return Int(end.timeIntervalSince(startTime))
    }
    
    var durationMinutes: Int {
        durationSeconds / 60
    }
}

/// Aggregated user statistics
struct UserStats {
    let totalPagesRead: Int
    let totalReadingTimeMinutes: Int
    let comicsCompleted: Int
    let currentStreak: Int
    let longestStreak: Int
    let readingDays: [Date]
    
    static let empty = UserStats(
        totalPagesRead: 0,
        totalReadingTimeMinutes: 0,
        comicsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        readingDays: []
    )
}

// MARK: - Service

/// Service for tracking reading statistics
final class ReadingStatsService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var sessions: [ReadingSession] = []
    @Published private(set) var activeSession: ReadingSession?
    @Published private(set) var stats: UserStats = .empty
    
    // MARK: - Private Properties
    
    private let defaults: UserDefaults
    private let preferences: PreferencesService
    private static let sessionsKey = "readingSessions"
    private static let completedComicsKey = "completedComicPaths"
    
    // MARK: - Init
    
    init(preferences: PreferencesService, defaults: UserDefaults = .standard) {
        self.preferences = preferences
        self.defaults = defaults
        loadSessions()
        calculateStats()
    }
    
    // MARK: - Session Management
    
    /// Start a new reading session
    func startSession(for comicPath: String) {
        // End any existing session first
        if activeSession != nil {
            endCurrentSession(pagesRead: 0)
        }
        
        activeSession = ReadingSession(
            id: UUID(),
            comicPath: comicPath,
            startTime: Date(),
            endTime: nil,
            pagesRead: 0
        )
    }
    
    /// End the current session
    func endCurrentSession(pagesRead: Int) {
        guard var session = activeSession else { return }
        
        session.endTime = Date()
        session.pagesRead = pagesRead
        
        // Only save sessions with meaningful activity
        if session.durationMinutes >= 1 || pagesRead > 0 {
            sessions.append(session)
            save()
            calculateStats()
        }
        
        activeSession = nil
    }
    
    /// Mark a comic as completed
    func markComicCompleted(_ comicPath: String) {
        var completed = completedComicPaths()
        guard !completed.contains(comicPath) else { return }
        completed.append(comicPath)
        defaults.set(completed, forKey: Self.completedComicsKey)
        calculateStats()
    }
    
    /// Check if a comic is completed
    func isComicCompleted(_ comicPath: String) -> Bool {
        completedComicPaths().contains(comicPath)
    }
    
    // MARK: - Statistics
    
    /// Get pages read for a specific month
    func pagesRead(in month: Date) -> Int {
        let calendar = Calendar.current
        return sessions
            .filter { calendar.isDate($0.startTime, equalTo: month, toGranularity: .month) }
            .reduce(0) { $0 + $1.pagesRead }
    }
    
    /// Get monthly stats for the last N months
    func monthlyStats(months: Int = 6) -> [(month: Date, pages: Int)] {
        let calendar = Calendar.current
        let now = Date()
        
        return (0..<months).compactMap { offset in
            guard let month = calendar.date(byAdding: .month, value: -offset, to: now) else { return nil }
            return (month, pagesRead(in: month))
        }.reversed()
    }
    
    /// Get reading time for today
    func todayReadingTimeMinutes() -> Int {
        let calendar = Calendar.current
        return sessions
            .filter { calendar.isDateInToday($0.startTime) }
            .reduce(0) { $0 + $1.durationMinutes }
    }
    
    /// Get recently read comic paths (unique, sorted by most recent first)
    func recentlyReadPaths(limit: Int = 10) -> [String] {
        // Sort sessions by start time (most recent first)
        let sortedSessions = sessions.sorted { $0.startTime > $1.startTime }
        
        // Get unique paths preserving order
        var seen = Set<String>()
        var result: [String] = []
        
        for session in sortedSessions {
            if !seen.contains(session.comicPath) {
                seen.insert(session.comicPath)
                result.append(session.comicPath)
                if result.count >= limit { break }
            }
        }
        
        return result
    }
    
    // MARK: - Private Methods
    
    private func completedComicPaths() -> [String] {
        defaults.array(forKey: Self.completedComicsKey) as? [String] ?? []
    }
    
    private func calculateStats() {
        let totalPages = sessions.reduce(0) { $0 + $1.pagesRead }
        // Sum seconds first, then convert to minutes to avoid rounding each session down
        let totalSeconds = sessions.reduce(0) { $0 + $1.durationSeconds }
        let totalTime = totalSeconds / 60
        let completed = completedComicPaths().count
        
        // Calculate streaks
        let readingDays = uniqueReadingDays()
        let (current, longest) = calculateStreaks(from: readingDays)
        
        stats = UserStats(
            totalPagesRead: totalPages,
            totalReadingTimeMinutes: totalTime,
            comicsCompleted: completed,
            currentStreak: current,
            longestStreak: longest,
            readingDays: readingDays
        )
    }
    
    private func uniqueReadingDays() -> [Date] {
        let calendar = Calendar.current
        var days = Set<Date>()
        
        for session in sessions {
            let day = calendar.startOfDay(for: session.startTime)
            days.insert(day)
        }
        
        return days.sorted()
    }
    
    private func calculateStreaks(from days: [Date]) -> (current: Int, longest: Int) {
        guard !days.isEmpty else { return (0, 0) }
        
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let sortedDays = days.sorted(by: >)
        
        var currentStreak = 0
        var longestStreak = 0
        var tempStreak = 1
        
        // Check if streak includes today or yesterday
        if let lastDay = sortedDays.first {
            let daysDiff = calendar.dateComponents([.day], from: lastDay, to: today).day ?? 0
            if daysDiff <= 1 {
                currentStreak = 1
            }
        }
        
        // Calculate streaks
        for i in 0..<(sortedDays.count - 1) {
            let current = sortedDays[i]
            let previous = sortedDays[i + 1]
            let diff = calendar.dateComponents([.day], from: previous, to: current).day ?? 0
            
            if diff == 1 {
                tempStreak += 1
                if i == 0 || (i > 0 && tempStreak > currentStreak) {
                    let daysDiff = calendar.dateComponents([.day], from: current, to: today).day ?? 0
                    if daysDiff <= 1 {
                        currentStreak = tempStreak
                    }
                }
            } else {
                longestStreak = max(longestStreak, tempStreak)
                tempStreak = 1
            }
        }
        
        longestStreak = max(longestStreak, tempStreak, currentStreak)
        
        return (currentStreak, longestStreak)
    }
    
    private func loadSessions() {
        guard let data = defaults.data(forKey: Self.sessionsKey) else { return }
        do {
            sessions = try JSONDecoder().decode([ReadingSession].self, from: data)
        } catch {
            print("ReadingStatsService: Failed to decode sessions: \(error)")
        }
    }
    
    private func save() {
        do {
            let data = try JSONEncoder().encode(sessions)
            defaults.set(data, forKey: Self.sessionsKey)
            objectWillChange.send()
        } catch {
            print("ReadingStatsService: Failed to encode sessions: \(error)")
        }
    }
}
