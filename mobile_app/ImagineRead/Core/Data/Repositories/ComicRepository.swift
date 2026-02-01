//
//  ComicRepository.swift
//  ImagineRead
//
//  Repository for comic-related data operations
//

import Foundation

/// Comic redemption response
struct RedemptionResponse: Decodable {
    let comicId: String
    let title: String
    let downloadURL: String
}

/// Comic redemption request
struct RedemptionRequest: Encodable {
    let code: String
}

/// Repository for comic operations
final class ComicRepository {
    
    private let apiClient: APIClient
    private let logger: LoggerService
    
    init(apiClient: APIClient, logger: LoggerService) {
        self.apiClient = apiClient
        self.logger = logger
    }
    
    // MARK: - Redemption
    
    /// Validate and redeem a comic code
    func redeemCode(_ code: String) async throws -> RedemptionResponse {
        logger.info("Redeeming code: \(code.prefix(3))***")
        
        let response: APIResponse<RedemptionResponse> = try await apiClient.post(
            "/comics/redeem",
            body: RedemptionRequest(code: code)
        )
        
        guard response.success, let data = response.data else {
            throw APIError.codeNotFound
        }
        
        logger.info("Code redeemed successfully: \(data.title)")
        return data
    }
    
    /// Download a comic file
    func downloadComic(from url: String, to destination: URL) async throws {
        logger.info("Downloading comic from: \(url)")
        
        guard let downloadURL = URL(string: url) else {
            throw APIError.invalidURL
        }
        
        let (tempURL, _) = try await URLSession.shared.download(from: downloadURL)
        
        // Move to destination
        let fileManager = FileManager.default
        if fileManager.fileExists(atPath: destination.path) {
            try fileManager.removeItem(at: destination)
        }
        try fileManager.moveItem(at: tempURL, to: destination)
        
        logger.info("Comic downloaded to: \(destination.path)")
    }
}
