//
//  AddAnnotationSheet.swift
//  ImagineRead
//
//  Form to add or edit an annotation
//

import SwiftUI

struct AddAnnotationSheet: View {
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    
    let comicPath: String
    let pageIndex: Int
    var existingAnnotation: Annotation?
    
    @State private var text: String = ""
    @FocusState private var isTextFocused: Bool
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                VStack(spacing: 24) {
                    // Page indicator
                    HStack {
                        Image(systemName: "bookmark.fill")
                            .foregroundColor(.purple)
                        
                        Text("\(loc.page) \(pageIndex + 1)")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.7))
                        
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    
                    // Text Editor
                    VStack(alignment: .leading, spacing: 8) {
                        Text(loc.yourAnnotation)
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.9))
                            .padding(.horizontal, 20)
                        
                        TextEditor(text: $text)
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
            .navigationTitle(existingAnnotation != nil ? loc.editAnnotation : loc.newAnnotation)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(loc.cancel) {
                        dismiss()
                    }
                    .foregroundColor(.white.opacity(0.7))
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.save) {
                        saveAnnotation()
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                    )
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .onAppear {
                if let existing = existingAnnotation {
                    text = existing.text
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
    
    // MARK: - Actions
    
    private func saveAnnotation() {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty else { return }
        
        if let existing = existingAnnotation {
            container.annotations.updateAnnotation(existing.id, text: trimmedText, highlightColor: nil)
        } else {
            container.annotations.addAnnotation(
                to: comicPath,
                page: pageIndex,
                text: trimmedText,
                highlightColor: nil
            )
        }
        
        dismiss()
    }
}

#Preview {
    AddAnnotationSheet(comicPath: "/sample/path.pdf", pageIndex: 0)
}
