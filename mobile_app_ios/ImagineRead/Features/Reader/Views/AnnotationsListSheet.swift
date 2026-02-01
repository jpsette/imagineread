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
    
    let comicPath: String
    let comicTitle: String
    let onGoToPage: (Int) -> Void
    
    private var annotations: [Annotation] {
        container.annotations.annotations(for: comicPath)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                if annotations.isEmpty {
                    emptyState
                } else {
                    annotationsList
                }
            }
            .navigationTitle("Anotações")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Fechar") {
                        dismiss()
                    }
                    .foregroundColor(.white.opacity(0.7))
                }
            }
        }
    }
    
    // MARK: - Empty State
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "note.text")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.3))
            
            Text("Sem Anotações")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white.opacity(0.8))
            
            Text("Toque no ícone de anotação durante\na leitura para adicionar notas.")
                .font(.body)
                .foregroundColor(.white.opacity(0.5))
                .multilineTextAlignment(.center)
        }
    }
    
    // MARK: - Annotations List
    
    private var annotationsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(annotations) { annotation in
                    AnnotationRow(
                        annotation: annotation,
                        onTap: {
                            onGoToPage(annotation.pageIndex)
                            dismiss()
                        },
                        onDelete: {
                            container.annotations.deleteAnnotation(annotation.id)
                        }
                    )
                }
            }
            .padding(20)
        }
    }
    
    private var backgroundGradient: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 0.1, green: 0.1, blue: 0.2),
                Color(red: 0.05, green: 0.05, blue: 0.15)
            ]),
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }
}

// MARK: - Annotation Row

struct AnnotationRow: View {
    let annotation: Annotation
    let onTap: () -> Void
    let onDelete: () -> Void
    
    @State private var showDeleteConfirm = false
    
    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .top, spacing: 12) {
                // Page Badge
                Text("P.\(annotation.pageIndex + 1)")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(
                                LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                            )
                    )
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(annotation.text)
                        .font(.body)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.leading)
                    
                    Text(formatDate(annotation.createdAt))
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.5))
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white.opacity(0.4))
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.white.opacity(0.05))
            )
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                onDelete()
            } label: {
                Label("Apagar", systemImage: "trash")
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = Locale(identifier: "pt_BR")
        formatter.unitsStyle = .short
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    AnnotationsListSheet(
        comicPath: "/sample/path.pdf",
        comicTitle: "Sample Comic",
        onGoToPage: { _ in }
    )
}
