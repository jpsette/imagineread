//
//  LibraryView.swift
//  ImagineRead
//
//  Grid view of comic library
//

import SwiftUI

/// Main library view showing all available comics
struct LibraryView: View {
    @StateObject private var viewModel = LibraryViewModel()
    @EnvironmentObject private var loc: LocalizationService
    @Environment(\.container) private var container
    
    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    var body: some View {
        ScrollView {
            if viewModel.isLoading {
                loadingView
            } else if viewModel.isEmpty {
                emptyView
            } else {
                VStack(alignment: .leading, spacing: 24) {
                    // Recently Read Section
                    if !recentlyReadComics.isEmpty {
                        recentlyReadSection
                    }
                    
                    // All Comics Grid
                    allComicsSection
                }
            }
        }
        .onAppear {
            viewModel.loadLibrary()
        }
        .fullScreenCover(item: $viewModel.selectedComic) { comic in
            ReaderView(pdfURL: comic.url)
        }
    }
    
    // MARK: - Recently Read
    
    private var recentlyReadComics: [LibraryService.ComicItem] {
        let recentPaths = container.readingStats.recentlyReadPaths(limit: 5)
        return recentPaths.compactMap { path in
            viewModel.comics.first { $0.url.path == path }
        }
    }
    
    private var recentlyReadSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "clock.arrow.circlepath")
                    .foregroundStyle(IRGradients.primary)
                Text(loc.lastRead)
                    .font(.headline)
                    .foregroundColor(IRColors.textPrimary)
            }
            .padding(.horizontal, 20)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(recentlyReadComics) { comic in
                        RecentComicCard(comic: comic) {
                            viewModel.selectComic(comic)
                        }
                    }
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.top, 16)
    }
    
    // MARK: - All Comics
    
    private var allComicsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "books.vertical")
                    .foregroundStyle(IRGradients.warning)
                Text(loc.library_)
                    .font(.headline)
                    .foregroundColor(IRColors.textPrimary)
            }
            .padding(.horizontal, 20)
            
            LazyVGrid(columns: columns, spacing: 24) {
                ForEach(viewModel.comics) { comic in
                    ComicCard(comic: comic) {
                        viewModel.selectComic(comic)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 40)
        }
    }
    
    // MARK: - Loading & Empty States
    
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(.white)
            Text(loc.loadingLibrary)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }
    
    private var emptyView: some View {
        VStack(spacing: 20) {
            Image(systemName: "book.closed")
                .font(.system(size: 60))
                .foregroundColor(.gray.opacity(0.5))
            
            Text(loc.noComics)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(IRColors.textPrimary)
            
            Text(loc.addPDFs)
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }
}

// MARK: - Recent Comic Card

struct RecentComicCard: View {
    let comic: LibraryService.ComicItem
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                // Cover
                Image(uiImage: comic.cover)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 100, height: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .cardShadow(radius: 4, y: 2)
                
                // Title
                Text(comic.title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(IRColors.textPrimary)
                    .lineLimit(2)
                    .frame(width: 100, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }
}

