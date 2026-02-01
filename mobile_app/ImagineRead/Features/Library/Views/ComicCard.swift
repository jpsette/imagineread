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
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                // Cover image - full aspect ratio
                Image(uiImage: comic.cover)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .shadow(color: .black.opacity(0.4), radius: 10, x: 0, y: 6)
                
                // Title
                Text(comic.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .lineLimit(2)
                
                // Page count
                Text("\(comic.pageCount) páginas")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .buttonStyle(.plain)
    }
}
