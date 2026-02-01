//
//  AddToCollectionSheet.swift
//  ImagineRead
//
//  Sheet to add a comic to one or more collections
//

import SwiftUI

struct AddToCollectionSheet: View {
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    
    let comicPath: String
    let comicTitle: String
    
    @State private var showCreateSheet = false
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(container.collections.allCollections()) { collection in
                            collectionToggleRow(collection)
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Adicionar à Coleção")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Fechar") {
                        dismiss()
                    }
                    .foregroundColor(.white.opacity(0.7))
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCreateSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(
                                LinearGradient(colors: [.purple, .blue], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                    }
                }
            }
            .sheet(isPresented: $showCreateSheet) {
                CreateCollectionSheet()
            }
        }
    }
    
    // MARK: - Collection Row
    
    private func collectionToggleRow(_ collection: Collection) -> some View {
        let isInCollection = collection.contains(comicPath)
        let color = Color(hex: collection.colorHex) ?? .purple
        
        return Button {
            toggleCollection(collection)
        } label: {
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(color.opacity(0.2))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: collection.icon)
                        .font(.system(size: 18))
                        .foregroundColor(color)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(collection.name)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.white)
                    
                    Text("\(collection.count) quadrinhos")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                }
                
                Spacer()
                
                // Checkbox
                ZStack {
                    Circle()
                        .stroke(isInCollection ? color : .white.opacity(0.3), lineWidth: 2)
                        .frame(width: 24, height: 24)
                    
                    if isInCollection {
                        Circle()
                            .fill(color)
                            .frame(width: 16, height: 16)
                        
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isInCollection ? color.opacity(0.1) : .white.opacity(0.05))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(isInCollection ? color.opacity(0.3) : .clear, lineWidth: 1)
                    )
            )
        }
        .sensoryFeedback(.selection, trigger: isInCollection)
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
    
    private func toggleCollection(_ collection: Collection) {
        if collection.contains(comicPath) {
            container.collections.removeComic(path: comicPath, from: collection.id)
        } else {
            container.collections.addComic(path: comicPath, to: collection.id)
        }
    }
}

#Preview {
    AddToCollectionSheet(comicPath: "/sample/path.pdf", comicTitle: "Sample Comic")
}
