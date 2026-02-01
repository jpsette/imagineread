//
//  CollectionsListView.swift
//  ImagineRead
//
//  List of user collections with favorites at top
//

import SwiftUI

struct CollectionsListView: View {
    @Environment(\.container) private var container
    @ObservedObject private var collectionsService: CollectionsService
    @State private var showCreateSheet = false
    
    init() {
        // Need to observe collections service for updates
        self._collectionsService = ObservedObject(wrappedValue: AppContainer.shared.collections)
    }
    
    var body: some View {
        ZStack {
            backgroundGradient
            
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(collectionsService.allCollections()) { collection in
                        NavigationLink {
                            CollectionDetailView(collection: collection)
                        } label: {
                            CollectionRow(collection: collection)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
        }
        .navigationTitle("Minhas Coleções")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showCreateSheet = true
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
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
                    .foregroundColor(.white)
                
                Text("\(collection.count) quadrinhos")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white.opacity(0.4))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.white.opacity(0.05))
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
