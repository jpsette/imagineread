//
//  BookmarkListSheet.swift
//  ImagineRead
//
//  Sheet for viewing and navigating to bookmarked pages
//

import SwiftUI

/// Sheet that displays all bookmarks for a comic with thumbnails
struct BookmarkListSheet: View {
    let comicPath: String
    let totalPages: Int
    let cache: PageCache
    let onSelectPage: (Int) -> Void
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    
    private var bookmarks: [Int] {
        prefs.bookmarkedPages(for: comicPath)
    }
    
    var body: some View {
        NavigationView {
            Group {
                if bookmarks.isEmpty {
                    emptyState
                } else {
                    bookmarkList
                }
            }
            .navigationTitle(loc.bookmarks)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.close) {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "bookmark")
                .font(.system(size: 48))
                .foregroundColor(.gray)
            
            Text(loc.noBookmarks)
                .font(.headline)
                .foregroundColor(.gray)
            
            Text(loc.tapToBookmark)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
    
    private var bookmarkList: some View {
        List {
            ForEach(bookmarks, id: \.self) { page in
                BookmarkRow(
                    page: page,
                    totalPages: totalPages,
                    cache: cache
                )
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
                .onTapGesture {
                    onSelectPage(page)
                    dismiss()
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                    Button(role: .destructive) {
                        withAnimation {
                            prefs.removeBookmark(page: page, for: comicPath)
                        }
                    } label: {
                        Label("Excluir", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
    }
}

struct BookmarkRow: View {
    let page: Int
    let totalPages: Int
    let cache: PageCache
    @EnvironmentObject private var loc: LocalizationService
    
    @State private var thumbnail: UIImage?
    
    var body: some View {
        HStack(spacing: 12) {
            // Thumbnail
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.2))
                
                if let thumbnail = thumbnail {
                    Image(uiImage: thumbnail)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                } else {
                    ProgressView()
                        .scaleEffect(0.7)
                }
            }
            .frame(width: 60, height: 85)
            .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: "bookmark.fill")
                        .foregroundColor(.orange)
                        .font(.system(size: 14))
                    
                    Text("\(loc.page) \(page + 1)")
                        .font(.headline)
                        .foregroundColor(.primary)
                }
                
                Text("\(Int(Double(page + 1) / Double(totalPages) * 100))% \(loc.ofComic)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Hint for swipe
            Image(systemName: "chevron.left")
                .font(.caption2)
                .foregroundColor(.secondary.opacity(0.5))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        )
        .contentShape(Rectangle())
        .task {
            await loadThumbnail()
        }
    }
    
    private func loadThumbnail() async {
        // Try cached image first, otherwise render thumbnail from PDF
        if let image = cache.getImage(for: page) {
            let size = CGSize(width: 120, height: 170)
            let renderer = UIGraphicsImageRenderer(size: size)
            let thumb = renderer.image { context in
                image.draw(in: CGRect(origin: .zero, size: size))
            }
            await MainActor.run {
                self.thumbnail = thumb
            }
        } else if let thumb = cache.renderThumbnail(for: page) {
            await MainActor.run {
                self.thumbnail = thumb
            }
        }
    }
}
