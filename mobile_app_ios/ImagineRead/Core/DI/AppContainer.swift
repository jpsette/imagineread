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
    
    // MARK: - User Profile Services
    @Published private(set) var collections: CollectionsService
    @Published private(set) var readingStats: ReadingStatsService
    @Published private(set) var annotations: AnnotationsService
    @Published private(set) var notifications: NotificationService
    
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
        
        // Initialize user profile services
        self.collections = CollectionsService()
        self.readingStats = ReadingStatsService(preferences: preferencesService)
        self.annotations = AnnotationsService()
        self.notifications = NotificationService()
        
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
        collections: CollectionsService,
        readingStats: ReadingStatsService,
        annotations: AnnotationsService,
        notifications: NotificationService,
        comicRepository: ComicRepository,
        userRepository: UserRepository,
        apiClient: APIClient
    ) {
        self.localization = localization
        self.preferences = preferences
        self.analytics = analytics
        self.logger = logger
        self.collections = collections
        self.readingStats = readingStats
        self.annotations = annotations
        self.notifications = notifications
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
