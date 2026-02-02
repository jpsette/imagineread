//
//  CollectionsListView.swift
//  ImagineRead
//
//  List of user collections with favorites at top
//

import SwiftUI

struct CollectionsListView: View {
    @Environment(\.container) private var container
    @EnvironmentObject private var loc: LocalizationService
    @ObservedObject private var collectionsService: CollectionsService
    @State private var showCreateSheet = false
    @State private var collectionToEdit: Collection?
    
    init() {
        // Need to observe collections service for updates
        self._collectionsService = ObservedObject(wrappedValue: AppContainer.shared.collections)
    }
    
    var body: some View {
        List {
            ForEach(collectionsService.allCollections()) { collection in
                NavigationLink {
                    CollectionDetailView(collection: collection)
                } label: {
                    CollectionRow(collection: collection)
                }
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    // Delete button (not for Favorites)
                    if collection.id != CollectionsService.favoritesID {
                        Button(role: .destructive) {
                            collectionsService.deleteCollection(collection.id)
                        } label: {
                            Label("Excluir", systemImage: "trash")
                        }
                    }
                    
                    // Edit button (not for Favorites)
                    if collection.id != CollectionsService.favoritesID {
                        Button {
                            collectionToEdit = collection
                        } label: {
                            Label(loc.edit, systemImage: "pencil")
                        }
                        .tint(.blue)
                    }
                }
                .listRowBackground(Color.white.opacity(0.05))
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .appBackground()
        .navigationTitle(loc.myCollections)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showCreateSheet = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundStyle(IRGradients.primary)
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            CreateCollectionSheet()
        }
        .sheet(item: $collectionToEdit) { collection in
            EditCollectionSheet(collection: collection)
        }
    }
    

}

// MARK: - Collection Row

struct CollectionRow: View {
    let collection: Collection
    
    private var color: Color {
        Color(hex: collection.colorHex) ?? .purple
    }
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(color.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                Image(systemName: collection.icon)
                    .font(.system(size: 22))
                    .foregroundColor(color)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(collection.name)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(IRColors.textPrimary)
                
                Text("\(collection.count) quadrinhos")
                    .font(.caption)
                    .foregroundColor(IRColors.textMuted)
            }
            
            Spacer()
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(IRColors.surface)
        )
    }
}

// MARK: - Color Extension

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }
        
        let r = Double((rgb & 0xFF0000) >> 16) / 255.0
        let g = Double((rgb & 0x00FF00) >> 8) / 255.0
        let b = Double(rgb & 0x0000FF) / 255.0
        
        self.init(red: r, green: g, blue: b)
    }
}

#Preview {
    NavigationView {
        CollectionsListView()
    }
}
