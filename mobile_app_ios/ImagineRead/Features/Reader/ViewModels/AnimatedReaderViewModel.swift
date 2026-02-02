//
//  AnimatedReaderViewModel.swift
//  ImagineRead
//
//  ViewModel for animated comic reading with balloon sequences
//

import SwiftUI
import Combine

// MARK: - Animation Type

/// Types of balloon entrance animations
enum BalloonAnimationType: String, Codable {
    case fadeIn
    case scaleIn
    case slideInLeft
    case slideInRight
    case slideInTop
    case slideInBottom
    case popIn
    case typewriter
}

// MARK: - Balloon Animation

/// Animation configuration for a balloon
struct BalloonAnimation: Identifiable {
    let id: String
    let balloonId: String
    let delay: TimeInterval
    let duration: TimeInterval
    let type: BalloonAnimationType
    
    init(balloon: Balloon, index: Int) {
        self.id = balloon.id
        self.balloonId = balloon.id
        self.delay = balloon.animationDelay ?? (Double(index) * 0.3)
        self.duration = balloon.animationDuration ?? 0.4
        
        if let typeStr = balloon.animationType,
           let animType = BalloonAnimationType(rawValue: typeStr) {
            self.type = animType
        } else {
            self.type = .scaleIn
        }
    }
}

// MARK: - Animated Reader ViewModel

/// ViewModel for playing balloon animations in sequence
@MainActor
class AnimatedReaderViewModel: ObservableObject {
    // MARK: - Published State
    
    /// Currently loaded project
    @Published var project: StudioProject?
    
    /// Current page index
    @Published var currentPageIndex: Int = 0
    
    /// Set of visible balloon IDs
    @Published var visibleBalloons: Set<String> = []
    
    /// Is currently animating
    @Published var isAnimating: Bool = false
    
    /// Animation playback speed (1.0 = normal)
    @Published var playbackSpeed: Double = 1.0
    
    /// Show all balloons (skip animation)
    @Published var showAllBalloons: Bool = false
    
    /// Error message if any
    @Published var errorMessage: String?
    
    // MARK: - Private
    
    private var animationTasks: [Task<Void, Never>] = []
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Computed Properties
    
    var currentPage: StudioPage? {
        guard let project = project,
              currentPageIndex >= 0,
              currentPageIndex < project.pages.count else {
            return nil
        }
        return project.pages[currentPageIndex]
    }
    
    var pageCount: Int {
        project?.pageCount ?? 0
    }
    
    var pageDisplayText: String {
        "\(currentPageIndex + 1) / \(pageCount)"
    }
    
    // MARK: - Public Methods
    
    /// Load a Studio project
    func loadProject(_ project: StudioProject) {
        self.project = project
        self.currentPageIndex = 0
        self.visibleBalloons.removeAll()
        playPageAnimations()
    }
    
    /// Load project from local JSON file
    func loadProject(from url: URL) async {
        do {
            let project = try StudioProject.decode(from: url)
            await MainActor.run {
                self.loadProject(project)
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load project: \(error.localizedDescription)"
            }
        }
    }
    
    /// Go to specific page
    func goToPage(_ index: Int) {
        guard index >= 0, index < pageCount else { return }
        
        cancelAnimations()
        currentPageIndex = index
        visibleBalloons.removeAll()
        
        if !showAllBalloons {
            playPageAnimations()
        } else {
            showAllBalloonsForCurrentPage()
        }
    }
    
    /// Go to next page
    func nextPage() {
        goToPage(currentPageIndex + 1)
    }
    
    /// Go to previous page
    func previousPage() {
        goToPage(currentPageIndex - 1)
    }
    
    /// Play animations for current page
    func playPageAnimations() {
        guard let page = currentPage, !showAllBalloons else {
            showAllBalloonsForCurrentPage()
            return
        }
        
        cancelAnimations()
        isAnimating = true
        visibleBalloons.removeAll()
        
        let animations = page.sortedBalloons.enumerated().map { index, balloon in
            BalloonAnimation(balloon: balloon, index: index)
        }
        
        for animation in animations {
            let task = Task {
                let delay = animation.delay / playbackSpeed
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                
                guard !Task.isCancelled else { return }
                
                withAnimation(.spring(response: animation.duration, dampingFraction: 0.7)) {
                    visibleBalloons.insert(animation.balloonId)
                }
            }
            animationTasks.append(task)
        }
        
        // Mark animation complete after last balloon
        if let lastAnimation = animations.last {
            let totalDuration = (lastAnimation.delay + lastAnimation.duration) / playbackSpeed
            
            Task {
                try? await Task.sleep(nanoseconds: UInt64(totalDuration * 1_000_000_000))
                guard !Task.isCancelled else { return }
                isAnimating = false
            }
        } else {
            isAnimating = false
        }
    }
    
    /// Replay animations for current page
    func replayAnimations() {
        playPageAnimations()
    }
    
    /// Skip to show all balloons
    func skipAnimations() {
        cancelAnimations()
        showAllBalloonsForCurrentPage()
    }
    
    /// Toggle show all balloons mode
    func toggleShowAll() {
        showAllBalloons.toggle()
        if showAllBalloons {
            skipAnimations()
        } else {
            playPageAnimations()
        }
    }
    
    // MARK: - Private Methods
    
    private func cancelAnimations() {
        for task in animationTasks {
            task.cancel()
        }
        animationTasks.removeAll()
        isAnimating = false
    }
    
    private func showAllBalloonsForCurrentPage() {
        guard let page = currentPage else { return }
        visibleBalloons = Set(page.balloons.map { $0.id })
        isAnimating = false
    }
    
    /// Check if a balloon is visible
    func isBalloonVisible(_ balloonId: String) -> Bool {
        showAllBalloons || visibleBalloons.contains(balloonId)
    }
}

// MARK: - Preview Helper

extension AnimatedReaderViewModel {
    static func preview() -> AnimatedReaderViewModel {
        let vm = AnimatedReaderViewModel()
        vm.loadProject(.mock())
        return vm
    }
}
