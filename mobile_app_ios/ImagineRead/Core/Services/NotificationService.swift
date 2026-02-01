//
//  NotificationService.swift
//  ImagineRead
//
//  Manages local notifications and reading reminders
//

import Foundation
import UserNotifications
import Combine

// MARK: - Models

/// User notification preferences
struct NotificationSettings: Codable {
    var dailyReminderEnabled: Bool
    var dailyReminderHour: Int         // 0-23
    var dailyReminderMinute: Int       // 0-59
    var abandonedReadingReminder: Bool // Remind after 3 days without reading
    
    static let `default` = NotificationSettings(
        dailyReminderEnabled: false,
        dailyReminderHour: 20,
        dailyReminderMinute: 0,
        abandonedReadingReminder: false
    )
}

// MARK: - Service

/// Service for managing local notifications
final class NotificationService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published private(set) var settings: NotificationSettings
    @Published private(set) var isAuthorized: Bool = false
    
    // MARK: - Private Properties
    
    private let center = UNUserNotificationCenter.current()
    private let defaults: UserDefaults
    private static let settingsKey = "notificationSettings"
    
    // Notification identifiers
    private enum NotificationID {
        static let dailyReminder = "daily_reading_reminder"
        static let abandonedReading = "abandoned_reading_reminder"
    }
    
    // MARK: - Init
    
    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.settings = Self.loadSettings(from: defaults)
        
        Task { @MainActor in
            await checkAuthorization()
        }
    }
    
    // MARK: - Authorization
    
    /// Request notification permission
    @MainActor
    func requestPermission() async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            isAuthorized = granted
            return granted
        } catch {
            print("NotificationService: Authorization error: \(error)")
            return false
        }
    }
    
    /// Check current authorization status
    @MainActor
    func checkAuthorization() async {
        let settings = await center.notificationSettings()
        isAuthorized = settings.authorizationStatus == .authorized
    }
    
    // MARK: - Daily Reminder
    
    /// Enable or disable daily reminder
    func setDailyReminder(enabled: Bool, hour: Int = 20, minute: Int = 0) {
        settings.dailyReminderEnabled = enabled
        settings.dailyReminderHour = hour
        settings.dailyReminderMinute = minute
        saveSettings()
        
        if enabled {
            scheduleDailyReminder()
        } else {
            cancelDailyReminder()
        }
    }
    
    /// Schedule the daily reading reminder
    func scheduleDailyReminder() {
        guard settings.dailyReminderEnabled else { return }
        
        // Cancel existing reminder first
        cancelDailyReminder()
        
        let content = UNMutableNotificationContent()
        content.title = "Hora de Ler! 📚"
        content.body = "Que tal continuar sua leitura de hoje?"
        content.sound = .default
        
        var dateComponents = DateComponents()
        dateComponents.hour = settings.dailyReminderHour
        dateComponents.minute = settings.dailyReminderMinute
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(
            identifier: NotificationID.dailyReminder,
            content: content,
            trigger: trigger
        )
        
        center.add(request) { error in
            if let error = error {
                print("NotificationService: Failed to schedule daily reminder: \(error)")
            }
        }
    }
    
    /// Cancel daily reminder
    func cancelDailyReminder() {
        center.removePendingNotificationRequests(withIdentifiers: [NotificationID.dailyReminder])
    }
    
    // MARK: - Abandoned Reading Reminder
    
    /// Enable abandoned reading reminders
    func setAbandonedReadingReminder(enabled: Bool) {
        settings.abandonedReadingReminder = enabled
        saveSettings()
    }
    
    /// Schedule a reminder for an unfinished comic
    func scheduleAbandonedReadingReminder(comicTitle: String, afterDays: Int = 3) {
        guard settings.abandonedReadingReminder else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "Continue Lendo 📖"
        content.body = "Você ainda não terminou \"\(comicTitle)\". Que tal continuar?"
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(afterDays * 24 * 60 * 60),
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: "\(NotificationID.abandonedReading)_\(comicTitle.hashValue)",
            content: content,
            trigger: trigger
        )
        
        center.add(request) { error in
            if let error = error {
                print("NotificationService: Failed to schedule abandoned reminder: \(error)")
            }
        }
    }
    
    /// Cancel abandoned reading reminder for a specific comic
    func cancelAbandonedReadingReminder(for comicTitle: String) {
        let id = "\(NotificationID.abandonedReading)_\(comicTitle.hashValue)"
        center.removePendingNotificationRequests(withIdentifiers: [id])
    }
    
    // MARK: - Utility
    
    /// Cancel all pending notifications
    func cancelAllNotifications() {
        center.removeAllPendingNotificationRequests()
    }
    
    /// Get all pending notifications
    func pendingNotifications() async -> [UNNotificationRequest] {
        await center.pendingNotificationRequests()
    }
    
    // MARK: - Private Methods
    
    private static func loadSettings(from defaults: UserDefaults) -> NotificationSettings {
        guard let data = defaults.data(forKey: settingsKey) else {
            return .default
        }
        do {
            return try JSONDecoder().decode(NotificationSettings.self, from: data)
        } catch {
            return .default
        }
    }
    
    private func saveSettings() {
        do {
            let data = try JSONEncoder().encode(settings)
            defaults.set(data, forKey: Self.settingsKey)
            objectWillChange.send()
        } catch {
            print("NotificationService: Failed to save settings: \(error)")
        }
    }
}
