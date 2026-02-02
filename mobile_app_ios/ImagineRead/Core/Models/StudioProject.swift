//
//  StudioProject.swift
//  ImagineRead
//
//  Data models for Studio project synchronization
//

import SwiftUI

// MARK: - Studio Page

/// A single page in a Studio project
struct StudioPage: Codable, Identifiable, Equatable {
    var id: String { imageUrl }
    
    /// URL or path to the page image
    let imageUrl: String
    
    /// Local cached URL (set after download)
    var localUrl: URL?
    
    /// Balloons on this page
    var balloons: [Balloon]
    
    /// Panels on this page
    var panels: [Panel]
    
    /// Page number (0-indexed)
    var pageNumber: Int?
    
    /// Original image size
    var originalSize: CGSize?
    
    // MARK: - Computed Properties
    
    /// Balloons sorted by animation delay
    var sortedBalloons: [Balloon] {
        balloons.sorted { ($0.animationDelay ?? 0) < ($1.animationDelay ?? 0) }
    }
    
    /// Panels sorted by reading order
    var sortedPanels: [Panel] {
        panels.sorted { $0.order < $1.order }
    }
}

// MARK: - Studio Project

/// A complete project exported from Studio
struct StudioProject: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    var pages: [StudioPage]
    
    /// Project thumbnail URL
    var thumbnailUrl: String?
    
    /// Creation date
    var createdAt: Date?
    
    /// Last modified date
    var updatedAt: Date?
    
    /// Project author
    var author: String?
    
    /// Project description
    var description: String?
    
    // MARK: - Computed Properties
    
    /// Total page count
    var pageCount: Int { pages.count }
    
    /// Total balloon count across all pages
    var totalBalloons: Int {
        pages.reduce(0) { $0 + $1.balloons.count }
    }
}

// MARK: - Project List Response

/// Response from /projects endpoint
struct ProjectListResponse: Codable {
    let projects: [StudioProject]
    let total: Int?
    let page: Int?
}

// MARK: - Mock Data

extension StudioProject {
    /// Create a mock project for testing
    static func mock() -> StudioProject {
        StudioProject(
            id: "mock-project-1",
            name: "Test Comic",
            pages: [
                StudioPage(
                    imageUrl: "page1.png",
                    balloons: [
                        .mock(text: "Hello!", rect: CGRect(x: 50, y: 50, width: 150, height: 80)),
                        .mock(text: "Hi there!", rect: CGRect(x: 200, y: 150, width: 180, height: 90))
                    ],
                    panels: [
                        .mock(order: 0, rect: CGRect(x: 0, y: 0, width: 300, height: 200)),
                        .mock(order: 1, rect: CGRect(x: 0, y: 200, width: 300, height: 200))
                    ],
                    pageNumber: 0
                ),
                StudioPage(
                    imageUrl: "page2.png",
                    balloons: [
                        .mock(text: "What's up?", rect: CGRect(x: 100, y: 100, width: 200, height: 100))
                    ],
                    panels: [
                        .mock(order: 0, rect: CGRect(x: 0, y: 0, width: 300, height: 400))
                    ],
                    pageNumber: 1
                )
            ],
            author: "ImagineClub"
        )
    }
}

// MARK: - JSON Decoding Helpers

extension StudioProject {
    /// Decode from JSON data
    static func decode(from data: Data) throws -> StudioProject {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(StudioProject.self, from: data)
    }
    
    /// Decode from JSON file URL
    static func decode(from url: URL) throws -> StudioProject {
        let data = try Data(contentsOf: url)
        return try decode(from: data)
    }
}

