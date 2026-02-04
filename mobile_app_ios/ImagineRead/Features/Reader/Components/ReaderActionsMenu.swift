//
//  ReaderActionsMenu.swift
//  ImagineRead
//
//  Expandable actions menu for the reader
//

import SwiftUI

/// Expandable floating menu with reader actions
struct ReaderActionsMenu: View {
    @Binding var showMenu: Bool
    let isCurrentPageBookmarked: Bool
    let onBookmarkToggle: () -> Void
    let onAddToCollection: () -> Void
    let onAddAnnotation: () -> Void
    let onHighlightMode: () -> Void
    let onShare: () -> Void
    let onSettings: () -> Void
    
    var body: some View {
        // Menu toggle button (fixed position)
        Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                showMenu.toggle()
            }
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
        } label: {
            Image(systemName: showMenu ? "xmark" : "ellipsis")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.white)
                .contentTransition(.symbolEffect(.replace))
                .frame(width: 44, height: 44)
                .background(
                    Circle()
                        .fill(
                            showMenu ?
                            AnyShapeStyle(LinearGradient(colors: [.red.opacity(0.8), .orange.opacity(0.8)], startPoint: .topLeading, endPoint: .bottomTrailing)) :
                            AnyShapeStyle(Color.white.opacity(0.15))
                        )
                )
                .background(Circle().fill(.ultraThinMaterial))
        }
        .overlay(alignment: .top) {
            // Dropdown menu as overlay
            if showMenu {
                VStack(spacing: 8) {
                    GlassButton(icon: isCurrentPageBookmarked ? "bookmark.fill" : "bookmark") {
                        onBookmarkToggle()
                        withAnimation(.spring(response: 0.3)) { showMenu = false }
                    }
                    
                    GlassButton(icon: "plus") {
                        onAddToCollection()
                        withAnimation(.spring(response: 0.3)) { showMenu = false }
                    }
                    
                    GlassButton(icon: "note.text") {
                        onAddAnnotation()
                        withAnimation(.spring(response: 0.3)) { showMenu = false }
                    }
                    
                    GlassButton(icon: "highlighter") {
                        onHighlightMode()
                        withAnimation(.spring(response: 0.3)) { showMenu = false }
                    }
                    
                    GlassButton(icon: "square.and.arrow.up") {
                        onShare()
                        withAnimation(.spring(response: 0.3)) { showMenu = false }
                    }
                    
                    GlassButton(icon: "gearshape") {
                        onSettings()
                        withAnimation(.spring(response: 0.3)) { showMenu = false }
                    }
                }
                .offset(y: 52)
                .transition(.scale(scale: 0.01, anchor: .top).combined(with: .opacity))
            }
        }
    }
}
