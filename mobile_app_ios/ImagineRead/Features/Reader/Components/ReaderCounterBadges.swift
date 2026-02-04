//
//  ReaderCounterBadges.swift
//  ImagineRead
//
//  Counter badges for bookmarks, annotations, and highlights
//

import SwiftUI

/// Badge showing bookmark count
struct BookmarkCountBadge: View {
    let comicPath: String
    let onTap: () -> Void
    
    @EnvironmentObject private var prefs: PreferencesService
    
    var body: some View {
        let bookmarkCount = prefs.bookmarkedPages(for: comicPath).count
        if bookmarkCount > 0 {
            Button(action: onTap) {
                HStack(spacing: 6) {
                    Image(systemName: "bookmark.fill")
                        .font(.system(size: 16, weight: .semibold))
                    Text("\(bookmarkCount)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                .foregroundColor(.orange)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Capsule().fill(.ultraThinMaterial))
            }
        }
    }
}

/// Badge showing annotation count
struct AnnotationCountBadge: View {
    let comicPath: String
    let pageIndex: Int
    let onTap: () -> Void
    
    @ObservedObject private var annotationsService = AppContainer.shared.annotations
    
    var body: some View {
        let annotationCount = annotationsService.annotationsForPage(pageIndex, in: comicPath).count
        if annotationCount > 0 {
            Button(action: onTap) {
                HStack(spacing: 6) {
                    Image(systemName: "note.text")
                        .font(.system(size: 16, weight: .semibold))
                    Text("\(annotationCount)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                .foregroundColor(.yellow)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Capsule().fill(.ultraThinMaterial))
            }
        }
    }
}

/// Badge showing highlight count
struct HighlightCountBadge: View {
    let comicPath: String
    let pageIndex: Int
    let onTap: () -> Void
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    
    var body: some View {
        let highlightCount = highlightsService.highlightsForPage(pageIndex, in: comicPath).count
        if highlightCount > 0 {
            Button(action: onTap) {
                HStack(spacing: 6) {
                    Image(systemName: "highlighter")
                        .font(.system(size: 16, weight: .semibold))
                    Text("\(highlightCount)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                }
                .foregroundStyle(LinearGradient(colors: [.pink, .orange], startPoint: .leading, endPoint: .trailing))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Capsule().fill(.ultraThinMaterial))
            }
        }
    }
}
