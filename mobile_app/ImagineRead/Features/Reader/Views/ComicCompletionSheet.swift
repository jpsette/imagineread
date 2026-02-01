//
//  ComicCompletionSheet.swift
//  ImagineRead
//
//  Modal shown when user finishes reading a comic
//

import SwiftUI

/// Modal displayed when user completes reading a comic
struct ComicCompletionSheet: View {
    let comic: Comic
    let pdfURL: URL
    let coverImage: UIImage
    let suggestions: [LibraryService.ComicItem]
    let onDismiss: () -> Void
    let onSelectSuggestion: (LibraryService.ComicItem) -> Void
    
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    
    @State private var rating: Int = 0
    @State private var comment: String = ""
    @FocusState private var isCommentFocused: Bool
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    congratsHeader
                    ratingSection
                    commentSection
                    shareSection
                    
                    if !suggestions.isEmpty {
                        suggestionsSection
                    }
                    
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
            }
            .background(Color.black.ignoresSafeArea())
            .navigationTitle(loc.readingComplete)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.ok) {
                        saveAndDismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .onAppear {
            rating = prefs.comicRating(for: pdfURL.path)
            comment = prefs.comicComment(for: pdfURL.path) ?? ""
        }
    }
    
    // MARK: - Congrats Header
    
    private var congratsHeader: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.purple.opacity(0.3), .blue.opacity(0.2)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 100, height: 100)
                
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 50))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.green, .teal],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
            
            Text("🎉 \(loc.congratulations)!")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(loc.finishedReading(comic.title))
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 16)
    }
    
    // MARK: - Rating Section
    
    private var ratingSection: some View {
        VStack(spacing: 12) {
            Text(loc.rateComic)
                .font(.headline)
                .foregroundColor(.white)
            
            StarRatingView(rating: $rating, size: 36, interactive: true)
        }
        .padding(.vertical, 8)
    }
    
    // MARK: - Comment Section
    
    private var commentSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(loc.leaveComment)
                .font(.headline)
                .foregroundColor(.white)
            
            TextField(loc.commentPlaceholder, text: $comment, axis: .vertical)
                .textFieldStyle(.plain)
                .lineLimit(3...6)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.white.opacity(0.08))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .strokeBorder(Color.white.opacity(0.15), lineWidth: 1)
                        )
                )
                .foregroundColor(.white)
                .focused($isCommentFocused)
        }
    }
    
    // MARK: - Share Section
    
    private var shareSection: some View {
        Button {
            shareComic()
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 16, weight: .medium))
                
                Text(loc.shareWithFriends)
                    .fontWeight(.medium)
            }
            .foregroundStyle(
                LinearGradient(
                    colors: [.purple, .pink],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .padding(.horizontal, 24)
            .padding(.vertical, 14)
            .background(
                Capsule()
                    .fill(Color.purple.opacity(0.15))
                    .overlay(
                        Capsule()
                            .strokeBorder(
                                LinearGradient(
                                    colors: [.purple.opacity(0.5), .pink.opacity(0.3)],
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
    
    // MARK: - Suggestions Section
    
    private var suggestionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(loc.readNext)
                .font(.headline)
                .foregroundColor(.white)
            
            VStack(spacing: 10) {
                ForEach(suggestions.prefix(2)) { suggestion in
                    ComicSuggestionCard(comic: suggestion) {
                        saveAndDismiss()
                        onSelectSuggestion(suggestion)
                    }
                }
            }
        }
    }
    
    // MARK: - Actions
    
    private func saveAndDismiss() {
        if rating > 0 {
            prefs.saveComicRating(rating, for: pdfURL.path)
        }
        if !comment.isEmpty {
            prefs.saveComicComment(comment, for: pdfURL.path)
        }
        onDismiss()
    }
    
    private func shareComic() {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        
        let shareText = "📚 \(loc.justFinished) \"\(comic.title)\"!\n\n\(rating > 0 ? String(repeating: "⭐️", count: rating) + "\n\n" : "")\(loc.pages): \(comic.pageCount)\n\nBaixe ImagineRead para ler quadrinhos!"
        let shareURL = URL(string: "https://imagine.club/imagineread")!
        
        let shareItems: [Any] = [coverImage, shareText, shareURL]
        
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            return
        }
        
        let activityVC = UIActivityViewController(activityItems: shareItems, applicationActivities: nil)
        activityVC.excludedActivityTypes = [.assignToContact, .addToReadingList, .openInIBooks]
        
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = rootViewController.view
            popover.sourceRect = CGRect(x: UIScreen.main.bounds.midX, y: UIScreen.main.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        
        rootViewController.present(activityVC, animated: true)
    }
}
