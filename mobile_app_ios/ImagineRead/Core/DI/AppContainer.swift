//
//  AppContainer.swift
//  ImagineRead
//
//  Dependency Injection container for the app
//

import SwiftUI

/// Central DI container that holds all app dependencies
@MainActor
final class AppContainer: ObservableObject {
    
    // MARK: - Singleton (for app-wide access)
    static let shared = AppContainer()
    
    // MARK: - Services
    @Published private(set) var localization: LocalizationService
    @Published private(set) var preferences: PreferencesService
    @Published private(set) var analytics: AnalyticsService
    @Published private(set) var logger: LoggerService
    
    // MARK: - Repositories
    private(set) var comicRepository: ComicRepository
    private(set) var userRepository: UserRepository
    
    // MARK: - Network
    private(set) var apiClient: APIClient
    
    // MARK: - Init
    
    private init() {
        // Initialize logger first (other services may use it)
        let loggerService = LoggerService()
        self.logger = loggerService
        
        // Initialize core services
        let preferencesService = PreferencesService()
        self.preferences = preferencesService
        self.analytics = AnalyticsService(logger: loggerService)
        self.localization = LocalizationService(preferences: preferencesService)
        
        // Initialize network
        let apiClientInstance = APIClient(logger: loggerService)
        self.apiClient = apiClientInstance
        
        // Initialize repositories
        self.comicRepository = ComicRepository(apiClient: apiClientInstance, logger: loggerService)
        self.userRepository = UserRepository(preferences: preferencesService)
        
        loggerService.info("AppContainer initialized")
    }
    
    // MARK: - For Testing
    
    #if DEBUG
    init(
        localization: LocalizationService,
        preferences: PreferencesService,
        analytics: AnalyticsService,
        logger: LoggerService,
        comicRepository: ComicRepository,
        userRepository: UserRepository,
        apiClient: APIClient
    ) {
        self.localization = localization
        self.preferences = preferences
        self.analytics = analytics
        self.logger = logger
        self.comicRepository = comicRepository
        self.userRepository = userRepository
        self.apiClient = apiClient
    }
    #endif
}

// MARK: - Environment Key

private struct AppContainerKey: EnvironmentKey {
    static let defaultValue = AppContainer.shared
}

extension EnvironmentValues {
    var container: AppContainer {
        get { self[AppContainerKey.self] }
        set { self[AppContainerKey.self] = newValue }
    }
}
