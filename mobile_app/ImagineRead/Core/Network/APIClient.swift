//
//  APIClient.swift
//  ImagineRead
//
//  Network client for API requests
//

import Foundation

/// API error types
enum APIError: LocalizedError {
    case invalidURL
    case networkError(Error)
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError(Error)
    case codeNotFound
    case unauthorized
    case serverError(message: String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .codeNotFound:
            return "Code not found"
        case .unauthorized:
            return "Unauthorized"
        case .serverError(let message):
            return message
        }
    }
}

/// API response wrapper
struct APIResponse<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: String?
}

/// Network client
final class APIClient {
    
    private let session: URLSession
    private let logger: LoggerService
    private let baseURL: String
    
    init(
        logger: LoggerService,
        baseURL: String = "https://api.imagineread.com/v1",
        session: URLSession = .shared
    ) {
        self.logger = logger
        self.baseURL = baseURL
        self.session = session
    }
    
    // MARK: - Request Methods
    
    func get<T: Decodable>(_ endpoint: String) async throws -> T {
        try await request(endpoint, method: "GET")
    }
    
    func post<T: Decodable, B: Encodable>(_ endpoint: String, body: B) async throws -> T {
        try await request(endpoint, method: "POST", body: body)
    }
    
    // MARK: - Private
    
    private func request<T: Decodable, B: Encodable>(
        _ endpoint: String,
        method: String,
        body: B? = nil as String?
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            logger.error("Invalid URL: \(baseURL + endpoint)")
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        
        logger.debug("API Request: \(method) \(endpoint)")
        
        do {
            let (data, response) = try await session.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            logger.debug("API Response: \(httpResponse.statusCode)")
            
            switch httpResponse.statusCode {
            case 200...299:
                return try JSONDecoder().decode(T.self, from: data)
            case 401:
                throw APIError.unauthorized
            case 404:
                throw APIError.codeNotFound
            default:
                throw APIError.httpError(statusCode: httpResponse.statusCode)
            }
            
        } catch let error as APIError {
            throw error
        } catch let error as DecodingError {
            logger.error(error)
            throw APIError.decodingError(error)
        } catch {
            logger.error(error)
            throw APIError.networkError(error)
        }
    }
}
