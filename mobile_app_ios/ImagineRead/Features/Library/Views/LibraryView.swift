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
                comicsGrid
            }
        }
        .onAppear {
            viewModel.loadLibrary()
        }
        .fullScreenCover(item: $viewModel.selectedComic) { comic in
            ReaderView(pdfURL: comic.url)
        }
    }
    
    // MARK: - Subviews
    
    private var comicsGrid: some View {
        LazyVGrid(columns: columns, spacing: 24) {
            ForEach(viewModel.comics) { comic in
                ComicCard(comic: comic) {
                    viewModel.selectComic(comic)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 40)
    }
    
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
                .foregroundColor(.white)
            
            Text(loc.addPDFs)
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.top, 100)
    }
}
