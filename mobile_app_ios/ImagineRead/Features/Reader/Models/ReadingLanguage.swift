//
//  ReadingLanguage.swift
//  ImagineRead
//
//  Available languages for balloon text translation
//

import SwiftUI

/// Available languages for comic text translation
enum ReadingLanguage: String, CaseIterable, Identifiable {
    case portuguese  // Português
    case english     // English
    case spanish     // Español
    case arabic      // العربية (UAE)
    case french      // Français
    
    var id: String { rawValue }
    
    /// Display name
    var displayName: String {
        switch self {
        case .portuguese: return "Português"
        case .english:    return "English"
        case .spanish:    return "Español"
        case .arabic:     return "العربية"
        case .french:     return "Français"
        }
    }
    
    /// Flag emoji
    var flag: String {
        switch self {
        case .portuguese: return "🇧🇷"
        case .english:    return "🇺🇸"
        case .spanish:    return "🇪🇸"
        case .arabic:     return "🇦🇪"
        case .french:     return "🇫🇷"
        }
    }
    
    /// Language code for translation API
    var languageCode: String {
        switch self {
        case .portuguese: return "pt-BR"
        case .english:    return "en"
        case .spanish:    return "es"
        case .arabic:     return "ar"
        case .french:     return "fr"
        }
    }
}
