//
//  CreateCollectionSheet.swift
//  ImagineRead
//
//  Form to create a new collection
//

import SwiftUI

struct CreateCollectionSheet: View {
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    
    @State private var name: String = ""
    @State private var selectedIcon: String = "folder.fill"
    @State private var selectedColor: String = "#7C3AED"
    
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
            ZStack {
                backgroundGradient
                
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
            }
            .navigationTitle("Nova Coleção")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancelar") {
                        dismiss()
                    }
                    .foregroundColor(.white.opacity(0.7))
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Criar") {
                        createCollection()
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(
                        LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                    )
                    .disabled(name.isEmpty)
                }
            }
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
                .foregroundColor(.white.opacity(0.9))
            
            TextField("", text: $name, prompt: Text("Ex: Para Ler Depois").foregroundColor(.white.opacity(0.3)))
                .foregroundColor(.white)
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(.white.opacity(0.08))
                )
        }
    }
    
    private var iconSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ícone")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            
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
                .foregroundColor(.white.opacity(0.9))
            
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
    
    private func createCollection() {
        guard !name.isEmpty else { return }
        container.collections.createCollection(name: name, icon: selectedIcon, colorHex: selectedColor)
        dismiss()
    }
}

#Preview {
    CreateCollectionSheet()
}
