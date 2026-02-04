//
//  ReaderBottomBar.swift
//  ImagineRead
//
//  Bottom bar with progress and page indicator
//

import SwiftUI

/// Bottom bar showing progress bar and page indicator
struct ReaderBottomBar: View {
    let currentPageIndex: Int
    let totalPages: Int
    let pageDisplayText: String
    let showProgressBar: Bool
    let readingMode: ReadingMode
    
    var body: some View {
        VStack(spacing: 12) {
            if showProgressBar && readingMode != .vertical {
                ProgressBar(progress: Double(currentPageIndex + 1) / Double(totalPages))
                    .frame(height: 3)
                    .padding(.horizontal)
            }
            PageIndicator(text: pageDisplayText)
        }
        .padding(.bottom, 40)
    }
}

/// Vertical progress bar for vertical reading mode
struct ReaderVerticalProgress: View {
    let currentPageIndex: Int
    let totalPages: Int
    
    var body: some View {
        HStack {
            Spacer()
            VerticalProgressBar(
                progress: Double(currentPageIndex + 1) / Double(totalPages)
            )
            .frame(width: 4)
            .padding(.trailing, 8)
            .padding(.vertical, 100)
        }
    }
}
