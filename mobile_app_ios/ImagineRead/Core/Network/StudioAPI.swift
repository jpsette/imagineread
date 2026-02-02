//
//  StudioAPI.swift
//  ImagineRead
//
//  API client for Studio project synchronization
//

import Foundation

// MARK: - Studio API Service

/// Service for syncing projects from Studio
actor StudioAPIService {
    static let shared = StudioAPIService()
    
    private let baseURL: URL?
    private let session: URLSession
    private var projectCache: [String: StudioProject] = [:]
    
    private init() {
        // Configure base URL from environment or defaults
        self.baseURL = URL(string: "https://api.imagine.club/v1")
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)
    }
    
    // MARK: - Public API
    
    /// Fetch list of available projects
    func getProjects() async throws -> [StudioProject] {
        guard let url = baseURL?.appendingPathComponent("projects") else {
            throw StudioAPIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let listResponse = try decoder.decode(ProjectListResponse.self, from: data)
        return listResponse.projects
    }
    
    /// Fetch a single project with all pages and balloons
    func getProject(id: String) async throws -> StudioProject {
        // Check cache first
        if let cached = projectCache[id] {
            return cached
        }
        
        guard let url = baseURL?.appendingPathComponent("projects/\(id)") else {
            throw StudioAPIError.invalidURL
        }
        
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        
        let project = try StudioProject.decode(from: data)
        projectCache[id] = project
        return project
    }
    
    /// Download and cache a page image
    func downloadPageImage(url urlString: String) async throws -> URL {
        guard let url = URL(string: urlString) else {
            throw StudioAPIError.invalidURL
        }
        
        // Check if already cached
        let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first!
        let studioDir = cacheDir.appendingPathComponent("StudioImages", isDirectory: true)
        
        try? FileManager.default.createDirectory(at: studioDir, withIntermediateDirectories: true)
        
        let filename = url.lastPathComponent
        let localURL = studioDir.appendingPathComponent(filename)
        
        if FileManager.default.fileExists(atPath: localURL.path) {
            return localURL
        }
        
        // Download
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        
        try data.write(to: localURL)
        return localURL
    }
    
    /// Clear project cache
    func clearCache() {
        projectCache.removeAll()
    }
    
    // MARK: - Local Import
    
    /// Import a project from local JSON file
    func importLocalProject(from url: URL) throws -> StudioProject {
        let project = try StudioProject.decode(from: url)
        projectCache[project.id] = project
        return project
    }
    
    /// Import a project from JSON data (e.g., from QR code or AirDrop)
    func importProject(from data: Data) throws -> StudioProject {
        let project = try StudioProject.decode(from: data)
        projectCache[project.id] = project
        return project
    }
    
    // MARK: - Helpers
    
    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw StudioAPIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw StudioAPIError.unauthorized
        case 404:
            throw StudioAPIError.notFound
        case 500...599:
            throw StudioAPIError.serverError
        default:
            throw StudioAPIError.httpError(httpResponse.statusCode)
        }
    }
}

// MARK: - Errors

enum StudioAPIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case notFound
    case serverError
    case httpError(Int)
    case decodingError(Error)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid server response"
        case .unauthorized:
            return "Unauthorized. Please log in."
        case .notFound:
            return "Project not found"
        case .serverError:
            return "Server error. Please try again later."
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        }
    }
}
