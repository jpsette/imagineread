//
//  AnnotationsListSheet.swift
//  ImagineRead
//
//  List of all annotations for a comic
//

import SwiftUI

struct AnnotationsListSheet: View {
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    
    let comicPath: String
    let comicTitle: String
    let onGoToPage: (Int) -> Void
    
    @State private var editingAnnotation: Annotation?
    
    private var annotations: [Annotation] {
        container.annotations.annotations(for: comicPath)
    }
    
    var body: some View {
        NavigationView {
            Group {
                if annotations.isEmpty {
                    emptyState
                } else {
                    annotationsList
                }
            }
            .navigationTitle(loc.annotations)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.close) {
                        dismiss()
                    }
                }
            }
            .sheet(item: $editingAnnotation) { annotation in
                AddAnnotationSheet(
                    comicPath: comicPath,
                    pageIndex: annotation.pageIndex,
                    existingAnnotation: annotation
                )
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
    
    // MARK: - Empty State
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "note.text")
                .font(.system(size: 48))
                .foregroundColor(.gray)
            
            Text(loc.noAnnotations)
                .font(.headline)
                .foregroundColor(.gray)
            
            Text(loc.tapToAnnotate)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
    
    // MARK: - Annotations List
    
    private var annotationsList: some View {
        List {
            ForEach(annotations) { annotation in
                AnnotationRow(annotation: annotation)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                    .onTapGesture {
                        onGoToPage(annotation.pageIndex)
                        dismiss()
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            withAnimation {
                                container.annotations.deleteAnnotation(annotation.id)
                            }
                        } label: {
                            Label(loc.delete_, systemImage: "trash")
                        }
                    }
                    .swipeActions(edge: .leading, allowsFullSwipe: true) {
                        Button {
                            editingAnnotation = annotation
                        } label: {
                            Label(loc.edit, systemImage: "pencil")
                        }
                        .tint(.blue)
                    }
            }
        }
        .listStyle(.plain)
    }
}

// MARK: - Annotation Row

struct AnnotationRow: View {
    @EnvironmentObject private var loc: LocalizationService
    let annotation: Annotation
    
    var body: some View {
        HStack(spacing: 12) {
            // Page Badge
            HStack {
                Image(systemName: "note.text")
                    .foregroundColor(.yellow)
                    .font(.system(size: 14))
                
                Text("\(loc.page) \(annotation.pageIndex + 1)")
                    .font(.headline)
                    .foregroundColor(.primary)
            }
            
            Spacer()
            
            // Note preview
            Text(annotation.text)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
                .frame(maxWidth: 150, alignment: .trailing)
            
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
    }
}

#Preview {
    AnnotationsListSheet(
        comicPath: "/sample/path.pdf",
        comicTitle: "Sample Comic",
        onGoToPage: { _ in }
    )
}
