//
//  ComicSuggestionCard.swift
//  ImagineRead
//
//  Compact card for comic recommendations
//

import SwiftUI

/// Compact horizontal card for comic suggestions
struct ComicSuggestionCard: View {
    let comic: LibraryService.ComicItem
    let onTap: () -> Void
    @EnvironmentObject private var loc: LocalizationService
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Cover thumbnail
                Image(uiImage: comic.cover)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 50, height: 70)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .shadow(color: .black.opacity(0.3), radius: 3, x: 0, y: 2)
                
                // Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(comic.title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                        .lineLimit(2)
                    
                    Text("\(comic.pageCount) \(loc.pages)")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                // Arrow
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}
