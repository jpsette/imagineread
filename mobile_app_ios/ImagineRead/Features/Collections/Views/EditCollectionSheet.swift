//
//  EditCollectionSheet.swift
//  ImagineRead
//
//  Form to edit an existing collection
//

import SwiftUI

struct EditCollectionSheet: View {
    let collection: Collection
    
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    
    @State private var name: String = ""
    @State private var selectedIcon: String = ""
    @State private var selectedColor: String = ""
    
    private let availableIcons = [
        "folder.fill", "star.fill", "heart.fill", "book.fill",
        "bookmark.fill", "flag.fill", "tag.fill", "flame.fill",
        "bolt.fill", "crown.fill", "sparkles", "moon.fill"
    ]
    
    private let availableColors = [
        "#7C3AED", "#EC4899", "#EF4444", "#F97316",
        "#EAB308", "#22C55E", "#14B8A6", "#3B82F6",
        "#6366F1", "#8B5CF6", "#A855F7", "#D946EF"
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Preview
                    previewSection
                    
                    // Name Input
                    nameSection
                    
                    // Icon Selection
                    iconSection
                    
                    // Color Selection
                    colorSection
                }
                .padding(20)
            }
            .appBackground()
            .navigationTitle(loc.editCollection)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(loc.cancel) {
                        dismiss()
                    }
                    .foregroundColor(IRColors.textSecondary)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.save) {
                        saveChanges()
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(IRGradients.primaryHorizontal)
                    .disabled(name.isEmpty)
                }
            }
        }
        .onAppear {
            name = collection.name
            selectedIcon = collection.icon
            selectedColor = collection.colorHex
        }
    }
    
    // MARK: - Sections
    
    private var previewSection: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill((Color(hex: selectedColor) ?? .purple).opacity(0.2))
                .frame(width: 80, height: 80)
            
            Image(systemName: selectedIcon)
                .font(.system(size: 36))
                .foregroundColor(Color(hex: selectedColor) ?? .purple)
        }
        .shadow(color: (Color(hex: selectedColor) ?? .purple).opacity(0.4), radius: 12, x: 0, y: 6)
    }
    
    private var nameSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Nome")
                .font(.headline)
                .foregroundColor(IRColors.textSecondary)
            
            TextField("", text: $name, prompt: Text("Nome da coleção").foregroundColor(.white.opacity(0.3)))
                .foregroundColor(.white)
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(IRColors.surface)
                )
        }
    }
    
    private var iconSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ícone")
                .font(.headline)
                .foregroundColor(IRColors.textSecondary)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                ForEach(availableIcons, id: \.self) { icon in
                    Button {
                        selectedIcon = icon
                    } label: {
                        ZStack {
                            Circle()
                                .fill(selectedIcon == icon ? (Color(hex: selectedColor) ?? .purple).opacity(0.3) : .white.opacity(0.05))
                                .frame(width: 44, height: 44)
                            
                            Image(systemName: icon)
                                .font(.system(size: 18))
                                .foregroundColor(selectedIcon == icon ? (Color(hex: selectedColor) ?? .purple) : .white.opacity(0.6))
                        }
                    }
                }
            }
        }
    }
    
    private var colorSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cor")
                .font(.headline)
                .foregroundColor(IRColors.textSecondary)
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                ForEach(availableColors, id: \.self) { hex in
                    Button {
                        selectedColor = hex
                    } label: {
                        ZStack {
                            Circle()
                                .fill(Color(hex: hex) ?? .purple)
                                .frame(width: 44, height: 44)
                            
                            if selectedColor == hex {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                    }
                }
            }
        }
    }
    

    
    // MARK: - Actions
    
    private func saveChanges() {
        container.collections.updateCollection(
            collection.id,
            name: name,
            icon: selectedIcon,
            colorHex: selectedColor
        )
        dismiss()
    }
}
