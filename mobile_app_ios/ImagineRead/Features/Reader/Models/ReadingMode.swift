//
//  ReadingMode.swift
//  ImagineRead
//
//  Reading direction modes
//

import Foundation

/// Available reading modes
enum ReadingMode: String, CaseIterable {
    case horizontal  // Western style: left to right
    case vertical    // Webtoon style: top to bottom
    case oriental    // Manga style: right to left
    
    /// Rotation angle for the arrow icon
    var arrowRotation: Double {
        switch self {
        case .horizontal: return 0      // →
        case .vertical:   return 90     // ↓
        case .oriental:   return 180    // ←
        }
    }
    
    /// Display name
    var displayName: String {
        switch self {
        case .horizontal: return "Ocidental"
        case .vertical:   return "Vertical"
        case .oriental:   return "Oriental"
        }
    }
    
    /// Icon for settings
    var icon: String {
        switch self {
        case .horizontal: return "arrow.left.and.right"
        case .vertical:   return "arrow.up.and.down"
        case .oriental:   return "arrow.left.to.line"
        }
    }
    
    /// Next mode in cycle
    var next: ReadingMode {
        switch self {
        case .horizontal: return .vertical
        case .vertical:   return .oriental
        case .oriental:   return .horizontal
        }
    }
}
