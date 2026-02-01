//
//  AnalyticsService.swift
//  ImagineRead
//
//  Analytics tracking service
//

import Foundation

/// Analytics events
enum AnalyticsEvent: String {
    // Reading
    case comicOpened = "comic_opened"
    case comicCompleted = "comic_completed"
    case pageViewed = "page_viewed"
    case bookmarkAdded = "bookmark_added"
    case bookmarkRemoved = "bookmark_removed"
    
    // Settings
    case languageChanged = "language_changed"
    case readingModeChanged = "reading_mode_changed"
    case nightModeChanged = "night_mode_changed"
    
    // Comics
    case comicRedeemed = "comic_redeemed"
    case qrCodeScanned = "qr_code_scanned"
    
    // Errors
    case redeemFailed = "redeem_failed"
    case loadFailed = "load_failed"
}

/// Analytics service for tracking user events
final class AnalyticsService {
    
    private let logger: LoggerService
    private var isEnabled: Bool = true
    
    init(logger: LoggerService) {
        self.logger = logger
    }
    
    /// Track an event
    func track(_ event: AnalyticsEvent, properties: [String: Any]? = nil) {
        guard isEnabled else { return }
        
        var logMessage = "Analytics: \(event.rawValue)"
        if let props = properties {
            logMessage += " | \(props)"
        }
        
        logger.debug(logMessage)
        
        // TODO: Integrate with actual analytics service (Firebase, Amplitude, etc.)
        // Example:
        // Analytics.logEvent(event.rawValue, parameters: properties)
    }
    
    /// Track screen view
    func trackScreen(_ screenName: String) {
        guard isEnabled else { return }
        
        logger.debug("Analytics: screen_view | \(screenName)")
        
        // TODO: Integrate with actual analytics
        // Analytics.setScreenName(screenName, screenClass: nil)
    }
    
    /// Set user property
    func setUserProperty(_ value: String, forName name: String) {
        guard isEnabled else { return }
        
        logger.debug("Analytics: user_property | \(name)=\(value)")
        
        // TODO: Integrate with actual analytics
        // Analytics.setUserProperty(value, forName: name)
    }
    
    /// Enable/disable analytics
    func setEnabled(_ enabled: Bool) {
        isEnabled = enabled
        logger.info("Analytics \(enabled ? "enabled" : "disabled")")
    }
}
