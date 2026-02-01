//
//  OfflineLibrarySheet.swift
//  ImagineRead
//
//  Shows comics that are available offline
//

import SwiftUI

/// Sheet displaying offline-available comics
struct OfflineLibrarySheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    
    @State private var offlineComics: [OfflineComic] = []
    @State private var selectedComic: OfflineComic?
    
    var body: some View {
        NavigationView {
            Group {
                if offlineComics.isEmpty {
                    emptyState
                } else {
                    comicList
                }
            }
            .navigationTitle(loc.offlineLibrary)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.ok) {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .task {
            offlineComics = OfflineService.shared.loadOfflineComics()
        }
        .fullScreenCover(item: $selectedComic) { comic in
            ReaderView(pdfURL: comic.url)
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.down.circle")
                .font(.system(size: 50))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.green, .teal],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            
            Text(loc.noOfflineComics)
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text(loc.offlineNote)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
    
    private var comicList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(offlineComics) { comic in
                    OfflineComicRow(
                        comic: comic,
                        onTap: {
                            selectedComic = comic
                        },
                        onDelete: {
                            removeComic(comic)
                        }
                    )
                }
            }
            .padding()
        }
    }
    
    private func removeComic(_ comic: OfflineComic) {
        OfflineService.shared.removeOfflineComic(at: comic.url.path)
        prefs.removeOfflineComic(path: comic.url.path)
        offlineComics.removeAll { $0.id == comic.id }
    }
}

// MARK: - Offline Comic Row

struct OfflineComicRow: View {
    let comic: OfflineComic
    let onTap: () -> Void
    let onDelete: () -> Void
    @EnvironmentObject private var loc: LocalizationService
    
    var body: some View {
        HStack(spacing: 16) {
            // Cover thumbnail
            Image(uiImage: comic.cover)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 70, height: 100)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
            
            // Info
            VStack(alignment: .leading, spacing: 6) {
                Text(comic.title)
                    .font(.headline)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                
                Text("\(comic.pageCount) \(loc.pages)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                // Offline badge
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 10))
                    Text(loc.availableOffline)
                        .font(.system(size: 10, weight: .medium))
                }
                .foregroundColor(.green)
            }
            
            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onTap()
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                withAnimation {
                    onDelete()
                }
            } label: {
                Label("Excluir", systemImage: "trash")
            }
        }
    }
}
