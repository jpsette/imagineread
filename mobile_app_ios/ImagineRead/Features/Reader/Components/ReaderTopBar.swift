//
//  ReaderTopBar.swift
//  ImagineRead
//
//  Top navigation bar for the reader
//

import SwiftUI

/// Top bar with close button, counter badges, and actions menu
struct ReaderTopBar: View {
    let pdfURL: URL
    let currentPageIndex: Int
    let isCurrentPageBookmarked: Bool
    let comicTitle: String
    
    @Binding var showMenu: Bool
    @Binding var showBookmarks: Bool
    @Binding var showAnnotationsList: Bool
    @Binding var showHighlightsList: Bool
    @Binding var showShareSheet: Bool
    @Binding var showCollectionSheet: Bool
    @Binding var showAnnotations: Bool
    @Binding var showHighlightMode: Bool
    @Binding var showSettings: Bool
    
    let onDismiss: () -> Void
    let onBookmarkToggle: () -> Void
    let goToPage: (Int) -> Void
    
    var body: some View {
        HStack {
            GlassButton(icon: "xmark") { onDismiss() }
            
            BookmarkCountBadge(comicPath: pdfURL.path) {
                showBookmarks = true
            }
            
            AnnotationCountBadge(
                comicPath: pdfURL.path,
                pageIndex: currentPageIndex
            ) {
                showAnnotationsList = true
            }
            
            HighlightCountBadge(
                comicPath: pdfURL.path,
                pageIndex: currentPageIndex
            ) {
                showHighlightsList = true
            }
            
            Spacer()
            
            // Expandable Menu
            ReaderActionsMenu(
                showMenu: $showMenu,
                isCurrentPageBookmarked: isCurrentPageBookmarked,
                onBookmarkToggle: onBookmarkToggle,
                onAddToCollection: { showCollectionSheet = true },
                onAddAnnotation: { showAnnotations = true },
                onHighlightMode: { showHighlightMode = true },
                onShare: { showShareSheet = true },
                onSettings: { showSettings = true }
            )
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .readerTopBarSheets(
            pdfURL: pdfURL,
            currentPageIndex: currentPageIndex,
            comicTitle: comicTitle,
            showShareSheet: $showShareSheet,
            showCollectionSheet: $showCollectionSheet,
            showAnnotations: $showAnnotations,
            showAnnotationsList: $showAnnotationsList,
            showHighlightsList: $showHighlightsList,
            showHighlightMode: $showHighlightMode,
            goToPage: goToPage
        )
    }
}

// MARK: - Sheets Modifier

extension View {
    func readerTopBarSheets(
        pdfURL: URL,
        currentPageIndex: Int,
        comicTitle: String,
        showShareSheet: Binding<Bool>,
        showCollectionSheet: Binding<Bool>,
        showAnnotations: Binding<Bool>,
        showAnnotationsList: Binding<Bool>,
        showHighlightsList: Binding<Bool>,
        showHighlightMode: Binding<Bool>,
        goToPage: @escaping (Int) -> Void
    ) -> some View {
        self
            .sheet(isPresented: showShareSheet) {
                ShareComicSheet(pdfURL: pdfURL)
            }
            .sheet(isPresented: showCollectionSheet) {
                AddToCollectionSheet(comicPath: pdfURL.path, comicTitle: comicTitle)
            }
            .sheet(isPresented: showAnnotations) {
                AddAnnotationSheet(
                    comicPath: pdfURL.path,
                    pageIndex: currentPageIndex
                )
            }
            .sheet(isPresented: showAnnotationsList) {
                AnnotationsListSheet(
                    comicPath: pdfURL.path,
                    comicTitle: comicTitle,
                    onGoToPage: goToPage
                )
            }
            .sheet(isPresented: showHighlightsList) {
                HighlightsListSheet(
                    comicPath: pdfURL.path,
                    pageIndex: currentPageIndex,
                    onEditHighlight: {
                        showHighlightMode.wrappedValue = true
                    }
                )
            }
    }
}
