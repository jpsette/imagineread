//
//  ComicCard.swift
//  ImagineRead
//
//  Card component for displaying a comic cover
//

import SwiftUI

/// Card that displays a comic cover with title
struct ComicCard: View {
    let comic: LibraryService.ComicItem
    let onTap: () -> Void
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    @Environment(\.container) private var container
    @ObservedObject private var collections = AppContainer.shared.collections
    
    @State private var isDownloading: Bool = false
    @State private var showCollectionSheet: Bool = false
    
    private var readingProgress: String? {
        prefs.readingProgressText(for: comic.url.path)
    }
    
    /// Check if file actually exists in offline storage (not just preference)
    private var isOffline: Bool {
        prefs.isComicOffline(comic.url.path) && 
        OfflineService.shared.offlineURL(for: comic.url.path) != nil
    }
    
    /// Get user's rating for this comic
    private var comicRating: Int {
        prefs.comicRating(for: comic.url.path)
    }
    
    /// Check if comic is favorited
    private var isFavorite: Bool {
        collections.isFavorite(comic.url.path)
    }
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                // Cover image with overlays
                ZStack(alignment: .topTrailing) {
                    ZStack(alignment: .bottomTrailing) {
                        Image(uiImage: comic.cover)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .shadow(color: .black.opacity(0.4), radius: 10, x: 0, y: 6)
                        
                        // Progress badge
                        if let progress = readingProgress {
                            Text(progress)
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(
                                    Capsule()
                                        .fill(
                                            LinearGradient(
                                                colors: [.purple, .blue],
                                                startPoint: .leading,
                                                endPoint: .trailing
                                            )
                                        )
                                )
                                .padding(8)
                        }
                        
                        // Star rating on cover (if rated)
                        if comicRating > 0 {
                            HStack(spacing: 2) {
                                ForEach(1...comicRating, id: \.self) { _ in
                                    Image(systemName: "star.fill")
                                        .font(.system(size: 8))
                                }
                            }
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.yellow, .orange],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .padding(.horizontal, 6)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(.black.opacity(0.6))
                            )
                            .padding([.top, .leading], 8)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                        }
                    }
                    
                    // Favorite button overlay
                    Button {
                        toggleFavorite()
                    } label: {
                        Image(systemName: isFavorite ? "heart.fill" : "heart")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(isFavorite ? .pink : .white.opacity(0.8))
                            .padding(8)
                            .background(
                                Circle()
                                    .fill(.black.opacity(0.5))
                            )
                    }
                    .buttonStyle(.plain)
                    .padding(8)
                }
                
                // Title
                Text(comic.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .lineLimit(2)
                
                // Page count, download button or offline badge
                HStack(spacing: 6) {
                    Text("\(comic.pageCount) \(loc.pages)")
                        .font(.caption)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                        .layoutPriority(1)
                    
                    Spacer()
                    
                    if isOffline {
                        // Offline badge
                        HStack(spacing: 3) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 8))
                            Text(loc.availableOffline)
                                .font(.system(size: 8, weight: .semibold))
                        }
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(
                            Capsule()
                                .fill(Color.green)
                        )
                    } else {
                        // Elegant download button
                        Button {
                            downloadComic()
                        } label: {
                            HStack(spacing: 4) {
                                if isDownloading {
                                    ProgressView()
                                        .scaleEffect(0.6)
                                        .tint(.cyan)
                                } else {
                                    Image(systemName: "icloud.and.arrow.down")
                                        .font(.system(size: 10, weight: .medium))
                                }
                            }
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.cyan, .blue],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                Capsule()
                                    .fill(Color.cyan.opacity(0.15))
                                    .overlay(
                                        Capsule()
                                            .strokeBorder(
                                                LinearGradient(
                                                    colors: [.cyan.opacity(0.5), .blue.opacity(0.3)],
                                                    startPoint: .leading,
                                                    endPoint: .trailing
                                                ),
                                                lineWidth: 1
                                            )
                                    )
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }
    
    private func downloadComic() {
        isDownloading = true
        
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        
        OfflineService.shared.downloadComic(from: comic.url) { result in
            isDownloading = false
            
            switch result {
            case .success:
                prefs.addOfflineComic(path: comic.url.path)
                
                // Success haptic
                let successGenerator = UINotificationFeedbackGenerator()
                successGenerator.notificationOccurred(.success)
                
            case .failure(let error):
                print("Download failed: \(error)")
                let errorGenerator = UINotificationFeedbackGenerator()
                errorGenerator.notificationOccurred(.error)
            }
        }
    }
    
    private func shareComic() {
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        
        // Create share content
        let shareText = "📚 \(comic.title)\n\n\(loc.pages): \(comic.pageCount)\n\nBaixe ImagineRead para ler quadrinhos!"
        let shareURL = URL(string: "https://imagine.club/imagineread")!
        
        // Items to share: cover image, text, and link
        var shareItems: [Any] = [comic.cover, shareText, shareURL]
        
        // Get the window scene to present the share sheet
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            return
        }
        
        let activityVC = UIActivityViewController(activityItems: shareItems, applicationActivities: nil)
        
        // Exclude some irrelevant activities
        activityVC.excludedActivityTypes = [
            .assignToContact,
            .addToReadingList,
            .openInIBooks
        ]
        
        // For iPad: configure popover
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = rootViewController.view
            popover.sourceRect = CGRect(x: UIScreen.main.bounds.midX, y: UIScreen.main.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        
        rootViewController.present(activityVC, animated: true)
    }
    
    private func toggleFavorite() {
        // Haptic feedback
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        
        container.collections.toggleFavorite(comic.url.path)
    }
}
