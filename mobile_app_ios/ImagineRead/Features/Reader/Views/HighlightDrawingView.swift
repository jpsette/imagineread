//
//  HighlightDrawingView.swift
//  ImagineRead
//
//  Control overlay for highlight mode (color picker + action buttons)
//

import SwiftUI

/// Overlay with highlight mode controls (color picker and action buttons)
/// The actual drawing is handled by HighlightCanvas inside PageView
struct HighlightDrawingView: View {
    let comicPath: String
    let pageIndex: Int
    let onDismiss: () -> Void
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    @State private var localSelectedColor: String = Highlight.colors[0].hex
    @State private var showNoteSheet = false
    
    var body: some View {
        VStack {
            // Color picker at top
            HStack(spacing: 16) {
                Spacer()
                
                HStack(spacing: 12) {
                    ForEach(Highlight.colors, id: \.hex) { color in
                        ColorPickerButton(
                            hex: color.hex,
                            isSelected: localSelectedColor == color.hex
                        ) {
                            localSelectedColor = color.hex
                            highlightsService.selectedColor = color.hex
                            let generator = UIImpactFeedbackGenerator(style: .light)
                            generator.impactOccurred()
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Capsule().fill(.ultraThinMaterial))
                
                Spacer()
            }
            .padding(.horizontal)
            .padding(.top, 60)
            
            Spacer()
            
            // Instructions
            Text("Arraste para marcar • Segure para apagar")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.8))
                .padding(.bottom, 16)
            
            // Two action buttons
            HStack(spacing: 16) {
                // Add note button
                Button {
                    showNoteSheet = true
                    let generator = UIImpactFeedbackGenerator(style: .medium)
                    generator.impactOccurred()
                } label: {
                    HStack {
                        Image(systemName: "note.text.badge.plus")
                        Text("Anotação")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(.ultraThinMaterial)
                    )
                }
                
                // Done button
                Button {
                    onDismiss()
                    let generator = UIImpactFeedbackGenerator(style: .medium)
                    generator.impactOccurred()
                } label: {
                    HStack {
                        Image(systemName: "checkmark")
                        Text("Concluído")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(LinearGradient(
                                colors: [.pink, .orange],
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                    )
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 50)
        }
        .onAppear {
            localSelectedColor = highlightsService.selectedColor
        }
        .sheet(isPresented: $showNoteSheet) {
            PageAnnotationSheet(
                comicPath: comicPath,
                pageIndex: pageIndex
            )
        }
    }
}

/// Sheet for adding annotations to highlights
struct PageAnnotationSheet: View {
    let comicPath: String
    let pageIndex: Int
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    @State private var noteText: String = ""
    @State private var selectedHighlightId: UUID?
    @FocusState private var isTextFocused: Bool
    @Environment(\.dismiss) private var dismiss
    
    private var pageHighlights: [Highlight] {
        highlightsService.highlightsForPage(pageIndex, in: comicPath)
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                VStack(spacing: 24) {
                    // Page indicator
                    HStack {
                        Image(systemName: "bookmark.fill")
                            .foregroundColor(.purple)
                        
                        Text("Página \(pageIndex + 1)")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))
                        
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    
                    if pageHighlights.isEmpty {
                        // No highlights message
                        VStack(spacing: 16) {
                            Image(systemName: "highlighter")
                                .font(.system(size: 48))
                                .foregroundStyle(.white.opacity(0.3))
                            Text("Nenhuma marcação nesta página")
                                .font(.headline)
                                .foregroundStyle(.white.opacity(0.5))
                            Text("Faça uma marcação primeiro")
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.3))
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        // Highlight selector (if multiple)
                        if pageHighlights.count > 1 {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Selecione a marcação")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.7))
                                    .padding(.horizontal, 20)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 12) {
                                        ForEach(Array(pageHighlights.enumerated()), id: \.element.id) { index, highlight in
                                            HighlightSelectorButton(
                                                highlight: highlight,
                                                highlightNumber: index + 1,
                                                isSelected: selectedHighlightId == highlight.id,
                                                onSelect: {
                                                    // Save current note before switching
                                                    if let currentId = selectedHighlightId, currentId != highlight.id {
                                                        let trimmed = noteText.trimmingCharacters(in: .whitespacesAndNewlines)
                                                        highlightsService.updateNote(for: currentId, note: trimmed.isEmpty ? nil : trimmed)
                                                    }
                                                    selectedHighlightId = highlight.id
                                                    noteText = highlight.note ?? ""
                                                }
                                            )
                                        }
                                    }
                                    .padding(.horizontal, 20)
                                }
                            }
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
                }
                .padding(.top, 20)
            }
            .navigationTitle("Nova Anotação")
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
                        saveAnnotation()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                    )
                    .disabled(selectedHighlightId == nil && pageHighlights.count > 1)
                }
            }
            .onAppear {
                // Auto-select first (or only) highlight
                if let first = pageHighlights.first {
                    selectedHighlightId = first.id
                    noteText = first.note ?? ""
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
    
    private func saveAnnotation() {
        guard let id = selectedHighlightId else { return }
        let trimmed = noteText.trimmingCharacters(in: .whitespacesAndNewlines)
        highlightsService.updateNote(for: id, note: trimmed.isEmpty ? nil : trimmed)
    }
}

/// Button to select a highlight
struct HighlightSelectorButton: View {
    let highlight: Highlight
    let highlightNumber: Int
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 4) {
                ZStack {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(hex: highlight.color) ?? .yellow)
                        .frame(width: 40, height: 24)
                        .overlay(
                            RoundedRectangle(cornerRadius: 4)
                                .strokeBorder(isSelected ? Color.white : Color.clear, lineWidth: 2)
                        )
                    
                    Text("\(highlightNumber)")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(color: .black.opacity(0.4), radius: 1)
                }
                
                if highlight.hasNote {
                    Image(systemName: "text.bubble.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                }
            }
            .padding(8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? Color(.systemGray5) : Color.clear)
            )
        }
    }
}

/// Row for each highlight in the annotation sheet
struct HighlightNoteRow: View {
    let highlight: Highlight
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 12) {
                // Color indicator
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(hex: highlight.color) ?? .yellow)
                    .frame(width: 24, height: 16)
                
                VStack(alignment: .leading, spacing: 4) {
                    if let note = highlight.note, !note.isEmpty {
                        Text(note)
                            .font(.body)
                            .foregroundStyle(.primary)
                            .lineLimit(2)
                    } else {
                        Text("Sem anotação")
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .italic()
                    }
                }
                
                Spacer()
                
                if highlight.hasNote {
                    Image(systemName: "text.bubble.fill")
                        .foregroundStyle(.blue)
                }
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.blue)
                }
            }
            .padding(.vertical, 4)
        }
        .listRowBackground(isSelected ? Color.blue.opacity(0.1) : Color.clear)
    }
}

/// Color picker button
struct ColorPickerButton: View {
    let hex: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Circle()
                .fill(Color(hex: hex) ?? .yellow)
                .frame(width: 28, height: 28)
                .overlay(
                    Circle()
                        .strokeBorder(.white, lineWidth: isSelected ? 3 : 0)
                )
                .scaleEffect(isSelected ? 1.1 : 1.0)
        }
        .animation(.spring(response: 0.3), value: isSelected)
    }
}
