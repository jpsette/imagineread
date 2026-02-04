//
//  LiteDownloadService.swift
//  ImagineRead
//
//  Service for downloading files from ImagineRead Lite
//

import Foundation
import SwiftUI

// MARK: - Models

struct LiteFileInfo: Codable {
    let success: Bool
    let code: String
    let originalName: String
    let fileType: String
    let fileSizeBytes: Int
    let downloadUrl: String
    let expiresAt: String?
    let downloadCount: Int
}

struct LiteCodeCheck: Codable {
    let valid: Bool
    let reason: String?
    let fileName: String?
    let fileType: String?
    let fileSizeBytes: Int?
}

enum LiteDownloadError: LocalizedError {
    case invalidCode
    case codeExpired
    case codeNotFound
    case downloadFailed
    case saveFailed
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidCode:
            return "Invalid code format"
        case .codeExpired:
            return "This code has expired"
        case .codeNotFound:
            return "Code not found"
        case .downloadFailed:
            return "Download failed"
        case .saveFailed:
            return "Failed to save file"
        case .networkError(let message):
            return message
        }
    }
}

// MARK: - Service

class LiteDownloadService: ObservableObject {
    static let shared = LiteDownloadService()
    
    private let baseURL = "https://imagineread.com/api"
    private let session: URLSession
    
    @Published var isDownloading = false
    @Published var downloadProgress: Double = 0
    @Published var currentFileName: String?
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }
    
    // MARK: - Public Methods
    
    /// Extract code from deep link or raw input
    func extractCode(from input: String) -> String {
        var code = input.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Handle deep link: imagineread://lite/ABC123
        if code.lowercased().hasPrefix("imagineread://lite/") {
            code = String(code.dropFirst("imagineread://lite/".count))
        }
        
        // Normalize: uppercase, remove dashes
        return code.uppercased().replacingOccurrences(of: "-", with: "")
    }
    
    /// Quick check if a code is valid
    func checkCode(_ code: String) async throws -> LiteCodeCheck {
        let cleanCode = extractCode(from: code)
        let url = URL(string: "\(baseURL)/check/\(cleanCode)")!
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw LiteDownloadError.networkError("Invalid response")
        }
        
        guard httpResponse.statusCode == 200 else {
            throw LiteDownloadError.networkError("Server error: \(httpResponse.statusCode)")
        }
        
        return try JSONDecoder().decode(LiteCodeCheck.self, from: data)
    }
    
    /// Fetch file info and get download URL
    func fetchFileInfo(code: String) async throws -> LiteFileInfo {
        let cleanCode = extractCode(from: code)
        let url = URL(string: "\(baseURL)/file/\(cleanCode)")!
        
        let (data, response) = try await session.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw LiteDownloadError.networkError("Invalid response")
        }
        
        switch httpResponse.statusCode {
        case 200:
            return try JSONDecoder().decode(LiteFileInfo.self, from: data)
        case 404:
            throw LiteDownloadError.codeNotFound
        case 410:
            throw LiteDownloadError.codeExpired
        default:
            throw LiteDownloadError.networkError("Server error: \(httpResponse.statusCode)")
        }
    }
    
    /// Download file from URL to local storage
    func downloadFile(from urlString: String, fileName: String) async throws -> URL {
        guard let url = URL(string: urlString) else {
            throw LiteDownloadError.downloadFailed
        }
        
        await MainActor.run {
            isDownloading = true
            downloadProgress = 0
            currentFileName = fileName
        }
        
        defer {
            Task { @MainActor in
                isDownloading = false
                currentFileName = nil
            }
        }
        
        // Download to temp location
        let (tempURL, response) = try await session.download(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw LiteDownloadError.downloadFailed
        }
        
        // Move to Documents folder
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let comicsFolder = documentsURL.appendingPathComponent("Comics", isDirectory: true)
        
        // Create Comics folder if needed
        try? FileManager.default.createDirectory(at: comicsFolder, withIntermediateDirectories: true)
        
        // Generate unique filename if exists
        var destinationURL = comicsFolder.appendingPathComponent(fileName)
        var counter = 1
        let fileExtension = (fileName as NSString).pathExtension
        let baseName = (fileName as NSString).deletingPathExtension
        
        while FileManager.default.fileExists(atPath: destinationURL.path) {
            let newName = "\(baseName)_\(counter).\(fileExtension)"
            destinationURL = comicsFolder.appendingPathComponent(newName)
            counter += 1
        }
        
        // Move file
        try FileManager.default.moveItem(at: tempURL, to: destinationURL)
        
        await MainActor.run {
            downloadProgress = 1.0
        }
        
        return destinationURL
    }
    
    /// Full flow: check, fetch info, download, and return local URL
    func downloadFromCode(_ code: String, onProgress: ((Double) -> Void)? = nil) async throws -> (URL, LiteFileInfo) {
        // 1. Fetch file info
        let fileInfo = try await fetchFileInfo(code: code)
        
        // 2. Download file
        let localURL = try await downloadFile(from: fileInfo.downloadUrl, fileName: fileInfo.originalName)
        
        return (localURL, fileInfo)
    }
}

// MARK: - Preview Helper

#if DEBUG
extension LiteDownloadService {
    static var preview: LiteDownloadService {
        let service = LiteDownloadService.shared
        return service
    }
}
#endif
