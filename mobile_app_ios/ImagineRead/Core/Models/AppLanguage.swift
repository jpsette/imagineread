//
//  AppLanguage.swift
//  ImagineRead
//
//  App UI language enumeration
//

import Foundation

/// Available app languages
enum AppLanguage: String, CaseIterable, Identifiable {
    case portuguese = "pt"
    case english = "en"
    case spanish = "es"
    case arabic = "ar"
    case french = "fr"
    
    var id: String { rawValue }
    
    /// Display name for the language
    var displayName: String {
        switch self {
        case .portuguese: return "Português"
        case .english: return "English"
        case .spanish: return "Español"
        case .arabic: return "العربية"
        case .french: return "Français"
        }
    }
    
    /// Flag emoji
    var flag: String {
        switch self {
        case .portuguese: return "🇧🇷"
        case .english: return "🇺🇸"
        case .spanish: return "🇪🇸"
        case .arabic: return "🇦🇪"
        case .french: return "🇫🇷"
        }
    }
    
    /// Convert to reading language
    var toReadingLanguage: ReadingLanguage {
        switch self {
        case .portuguese: return .portuguese
        case .english: return .english
        case .spanish: return .spanish
        case .arabic: return .arabic
        case .french: return .french
        }
    }
}
