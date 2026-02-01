//
//  ContentView.swift
//  ImagineRead
//
//  Main home screen with library
//

import SwiftUI

struct ContentView: View {
    @State private var showSettings = false
    @State private var showAddComic = false
    
    var body: some View {
        ZStack {
            backgroundGradient
            
            VStack(spacing: 0) {
                headerSection
                LibraryView()
            }
            
            // Floating Add Button
            VStack {
                Spacer()
                
                Button {
                    showAddComic = true
                } label: {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [.purple, .blue],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 64, height: 64)
                            .shadow(color: .purple.opacity(0.5), radius: 10, x: 0, y: 5)
                        
                        Image(systemName: "plus")
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
                .padding(.bottom, 24)
            }
        }
        .sheet(isPresented: $showSettings) {
            AppSettingsSheet()
        }
        .sheet(isPresented: $showAddComic) {
            AddComicSheet()
        }
    }
    
    // MARK: - Subviews
    
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
    
    private var headerSection: some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: "book.pages.fill")
                    .font(.title)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.purple, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                
                Text("ImagineRead")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
                
                // Settings Button
                Button {
                    showSettings = true
                } label: {
                    Image(systemName: "gearshape.fill")
                        .font(.title2)
                        .foregroundColor(.white.opacity(0.8))
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
