//
//  ContentView.swift
//  ImagineRead
//
//  Main home screen with library
//

import SwiftUI

struct ContentView: View {
    @State private var showAddComic = false
    @State private var showProfile = false
    @State private var showSearch = false
    
    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                headerSection
                LibraryView()
            }
            
            // Floating Add Button
            IRFloatingButton(icon: "plus") {
                showAddComic = true
            }
            .floatingPosition()
        }
        .appBackground()
        .sheet(isPresented: $showAddComic) {
            AddComicSheet()
        }
        .sheet(isPresented: $showProfile) {
            ProfileView()
        }
        .sheet(isPresented: $showSearch) {
            SearchView()
        }
    }
    
    // MARK: - Subviews
    
    private var headerSection: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "book.pages.fill")
                    .font(.title)
                    .foregroundStyle(IRGradients.primary)
                
                Text("ImagineRead")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(IRColors.textPrimary)
                
                Spacer()
                
                // Search Button
                Button {
                    showSearch = true
                } label: {
                    Image(systemName: "magnifyingglass")
                        .font(.title2)
                        .foregroundColor(IRColors.textSecondary)
                }
                
                // Profile Button
                Button {
                    showProfile = true
                } label: {
                    Image(systemName: "person.circle.fill")
                        .font(.title2)
                        .foregroundColor(IRColors.textSecondary)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 60)
            .padding(.bottom, 16)
        }
    }
}

#Preview {
    ContentView()
}

