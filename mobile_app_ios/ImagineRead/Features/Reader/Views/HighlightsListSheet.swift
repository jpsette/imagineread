//
//  HighlightsListSheet.swift
//  ImagineRead
//
//  Modal to view all highlights for the current page
//

import SwiftUI

struct HighlightsListSheet: View {
    let comicPath: String
    let pageIndex: Int
    let onEditHighlight: () -> Void
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    @State private var selectedHighlightId: UUID?
    @State private var showNoteEditor: Bool = false
    @Environment(\.dismiss) private var dismiss
    
    private var pageHighlights: [Highlight] {
        highlightsService.highlightsForPage(pageIndex, in: comicPath)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                VStack(spacing: 0) {
                    // Page indicator
                    HStack {
                        Image(systemName: "bookmark.fill")
                            .foregroundColor(.purple)
                        
                        Text("Página \(pageIndex + 1)")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))
                        
                        Spacer()
                        
                        Text("\(pageHighlights.count) marcações")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.5))
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    .padding(.bottom, 12)
                    
                    if pageHighlights.isEmpty {
                        // No highlights message
                        VStack(spacing: 16) {
                            Image(systemName: "highlighter")
                                .font(.system(size: 48))
                                .foregroundStyle(.white.opacity(0.3))
                            Text("Nenhuma marcação nesta página")
                                .font(.headline)
                                .foregroundStyle(.white.opacity(0.5))
                            
                            Button {
                                dismiss()
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                    onEditHighlight()
                                }
                            } label: {
                                Text("Criar Marcação")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 24)
                                    .padding(.vertical, 12)
                                    .background(
                                        Capsule()
                                            .fill(LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing))
                                    )
                            }
                            .padding(.top, 8)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        // List of highlights
                        ScrollView {
                            LazyVStack(spacing: 12) {
                                ForEach(Array(pageHighlights.enumerated()), id: \.element.id) { index, highlight in
                                    HighlightListRow(
                                        highlight: highlight,
                                        highlightNumber: index + 1,
                                        onTap: {
                                            selectedHighlightId = highlight.id
                                            showNoteEditor = true
                                        },
                                        onDelete: {
                                            highlightsService.deleteHighlight(highlight.id)
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                        }
                        
                        // Edit button
                        Button {
                            dismiss()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                onEditHighlight()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "pencil")
                                Text("Editar Marcações")
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(LinearGradient(colors: [.pink, .orange], startPoint: .leading, endPoint: .trailing))
                            )
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                    }
                }
            }
            .navigationTitle("Marcações")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("OK") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(.white.opacity(0.7))
                }
            }
        }
        .sheet(isPresented: $showNoteEditor) {
            if let highlightId = selectedHighlightId {
                HighlightNoteEditorSheet(highlightId: highlightId)
            }
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

/// Row for each highlight in the list
struct HighlightListRow: View {
    let highlight: Highlight
    let highlightNumber: Int
    let onTap: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Number badge with color indicator
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color(hex: highlight.color) ?? .yellow)
                        .frame(width: 32, height: 32)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6)
                                .strokeBorder(.white.opacity(0.3), lineWidth: 1)
                        )
                    
                    Text("\(highlightNumber)")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(color: .black.opacity(0.3), radius: 1)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    if let note = highlight.note, !note.isEmpty {
                        Text(note)
                            .font(.body)
                            .foregroundColor(.white)
                            .lineLimit(2)
                    } else {
                        Text("Sem anotação")
                            .font(.body)
                            .foregroundColor(.white.opacity(0.5))
                            .italic()
                    }
                    
                    Text(highlight.createdAt.formatted(date: .abbreviated, time: .shortened))
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.4))
                }
                
                Spacer()
                
                if highlight.hasNote {
                    Image(systemName: "text.bubble.fill")
                        .foregroundStyle(.blue)
                        .font(.system(size: 14))
                }
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.white.opacity(0.3))
                    .font(.system(size: 14))
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(.white.opacity(0.08))
            )
        }
        .contextMenu {
            Button(role: .destructive) {
                onDelete()
            } label: {
                Label("Apagar", systemImage: "trash")
            }
        }
    }
}

/// Sheet to edit a highlight's note
struct HighlightNoteEditorSheet: View {
    let highlightId: UUID
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    @State private var noteText: String = ""
    @FocusState private var isTextFocused: Bool
    @Environment(\.dismiss) private var dismiss
    
    private var highlight: Highlight? {
        highlightsService.highlight(by: highlightId)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                VStack(spacing: 24) {
                    // Color indicator
                    if let highlight = highlight {
                        HStack {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(Color(hex: highlight.color) ?? .yellow)
                                .frame(width: 24, height: 16)
                            
                            Text("Editar anotação")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.7))
                            
                            Spacer()
                        }
                        .padding(.horizontal, 20)
                    }
                    
                    // Text Editor
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Sua anotação")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.9))
                            .padding(.horizontal, 20)
                        
                        TextEditor(text: $noteText)
                            .scrollContentBackground(.hidden)
                            .foregroundColor(.white)
                            .padding(16)
                            .frame(minHeight: 150)
                            .background(
                                RoundedRectangle(cornerRadius: 16)
                                    .fill(.white.opacity(0.08))
                            )
                            .padding(.horizontal, 20)
                            .focused($isTextFocused)
                    }
                    
                    Spacer()
                }
                .padding(.top, 20)
            }
            .navigationTitle("Anotação")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancelar") {
                        dismiss()
                    }
                    .foregroundColor(.white.opacity(0.7))
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Salvar") {
                        saveNote()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                    )
                }
            }
            .onAppear {
                if let highlight = highlight {
                    noteText = highlight.note ?? ""
                }
                isTextFocused = true
            }
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
    
    private func saveNote() {
        let trimmed = noteText.trimmingCharacters(in: .whitespacesAndNewlines)
        highlightsService.updateNote(for: highlightId, note: trimmed.isEmpty ? nil : trimmed)
    }
}
