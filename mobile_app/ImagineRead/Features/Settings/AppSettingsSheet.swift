//
//  AppSettingsSheet.swift
//  ImagineRead
//
//  Global app settings accessible from home screen
//

import SwiftUI

/// App-wide settings sheet
struct AppSettingsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    @State private var appLanguage: AppLanguage = .portuguese
    
    var body: some View {
        NavigationView {
            List {
                // App Info Section
                Section {
                    HStack(spacing: 16) {
                        Image(systemName: "book.pages.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.purple, .blue],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(loc.appName)
                                .font(.headline)
                            Text(loc.version)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                // App Language
                Section {
                    NavigationLink {
                        AppLanguagePickerView(selection: $appLanguage)
                    } label: {
                        HStack {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(LinearGradient(
                                        colors: [.green, .teal],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    .frame(width: 32, height: 32)
                                
                                Image(systemName: "globe")
                                    .foregroundColor(.white)
                                    .font(.system(size: 16))
                            }
                            
                            Text(loc.appLanguage)
                                .padding(.leading, 4)
                            
                            Spacer()
                            
                            Text("\(appLanguage.flag) \(appLanguage.displayName)")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                // Leitor Section - Contains all reader settings
                Section {
                    NavigationLink {
                        ReaderSettingsPage()
                    } label: {
                        HStack {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(LinearGradient(
                                        colors: [.purple, .blue],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    .frame(width: 32, height: 32)
                                
                                Image(systemName: "book.fill")
                                    .foregroundColor(.white)
                                    .font(.system(size: 16))
                            }
                            
                            Text(loc.reader)
                                .padding(.leading, 4)
                        }
                    }
                } footer: {
                    Text(loc.readerSettingsNote)
                }
                
                // Offline Library
                Section {
                    NavigationLink {
                        OfflineLibraryInnerView()
                    } label: {
                        HStack {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(LinearGradient(
                                        colors: [.green, .teal],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    .frame(width: 32, height: 32)
                                
                                Image(systemName: "arrow.down.circle.fill")
                                    .foregroundColor(.white)
                                    .font(.system(size: 16))
                            }
                            
                            Text(loc.offlineLibrary)
                                .padding(.leading, 4)
                        }
                    }
                } footer: {
                    Text(loc.offlineNote)
                }
                
                // About Section
                Section {
                    HStack {
                        Label(loc.developedBy, systemImage: "person.fill")
                        Spacer()
                        Text("ImagineClub")
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://imagine.club")!) {
                        HStack {
                            Label(loc.website, systemImage: "globe")
                            Spacer()
                            Text("imagine.club")
                                .foregroundColor(.purple)
                            Image(systemName: "arrow.up.right")
                                .font(.caption)
                                .foregroundColor(.purple)
                        }
                    }
                } header: {
                    Text(loc.about)
                }
            }
            .navigationTitle(loc.settings)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.ok) {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear {
            appLanguage = loc.language
        }
    }
}

// MARK: - App Language Picker

struct AppLanguagePickerView: View {
    @Binding var selection: AppLanguage
    @EnvironmentObject private var loc: LocalizationService
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        List {
            ForEach(AppLanguage.allCases) { language in
                Button {
                    selection = language
                    loc.language = language
                    dismiss()
                } label: {
                    HStack {
                        Text(language.flag)
                            .font(.title2)
                        
                        Text(language.displayName)
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        if selection == language {
                            Image(systemName: "checkmark")
                                .foregroundColor(.green)
                        }
                    }
                }
            }
        }
        .navigationTitle(loc.appLanguage)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Reader Settings Page

/// Full-page reader settings (accessed from app settings)
struct ReaderSettingsPage: View {
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    @State private var readingLanguage: ReadingLanguage = .portuguese
    @State private var balloonFontSize: Double = 1.0
    @State private var readingMode: ReadingMode = .horizontal
    @State private var nightMode: NightMode = .off
    @State private var filterIntensity: Double = 0.5
    
    var body: some View {
        List {
            // Text Settings
            Section {
                NavigationLink {
                    LanguagePickerView(selection: $readingLanguage)
                } label: {
                    HStack {
                        Label(loc.balloonLanguage, systemImage: "globe")
                        Spacer()
                        Text("\(readingLanguage.flag) \(readingLanguage.displayName)")
                            .foregroundColor(.secondary)
                    }
                }
                
                NavigationLink {
                    FontSizePickerView(fontSize: $balloonFontSize)
                } label: {
                    HStack {
                        Label(loc.fontSize, systemImage: "textformat.size")
                        Spacer()
                        Text("\(Int(balloonFontSize * 100))%")
                            .foregroundColor(.secondary)
                    }
                }
            } header: {
                Label(loc.balloonText, systemImage: "text.bubble")
            } footer: {
                Text(loc.balloonTextNote)
            }
            
            // Reading Mode
            Section {
                NavigationLink {
                    ReadingModePickerView(selection: $readingMode)
                } label: {
                    HStack {
                        Label(loc.readingMode, systemImage: readingMode.icon)
                        Spacer()
                        Text(loc.readingModeName(readingMode))
                            .foregroundColor(.secondary)
                    }
                }
            } header: {
                Label(loc.navigation, systemImage: "hand.draw")
            }
            
            // Visual Settings
            Section {
                NavigationLink {
                    NightModePickerView(selection: $nightMode, intensity: $filterIntensity)
                } label: {
                    HStack {
                        Label(loc.lightFilter, systemImage: nightMode.icon)
                        Spacer()
                        Text(loc.nightModeName(nightMode))
                            .foregroundColor(.secondary)
                    }
                }
            } header: {
                Label(loc.visual, systemImage: "eye")
            }
        }
        .navigationTitle(loc.reader)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            readingLanguage = prefs.readingLanguage
            balloonFontSize = prefs.balloonFontSize
            readingMode = prefs.readingMode
            nightMode = prefs.nightMode
            filterIntensity = prefs.filterIntensity
        }
    }
}

// MARK: - Offline Library Inner View

/// Inline view for offline library (navigable within settings)
struct OfflineLibraryInnerView: View {
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    
    @State private var offlineComics: [OfflineComic] = []
    @State private var selectedComic: OfflineComic?
    
    var body: some View {
        Group {
            if offlineComics.isEmpty {
                emptyState
            } else {
                comicList
            }
        }
        .navigationTitle(loc.offlineLibrary)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            offlineComics = OfflineService.shared.loadOfflineComics()
        }
        .fullScreenCover(item: $selectedComic) { comic in
            ReaderView(pdfURL: comic.url)
        }
    }
    
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.down.circle")
                .font(.system(size: 50))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.green, .teal],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            
            Text(loc.noOfflineComics)
                .font(.headline)
                .foregroundColor(.secondary)
            
            Text(loc.offlineNote)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var comicList: some View {
        List {
            ForEach(offlineComics) { comic in
                offlineComicRow(comic)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowSeparator(.hidden)
                    .onTapGesture {
                        selectedComic = comic
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            withAnimation {
                                removeComic(comic)
                            }
                        } label: {
                            Label("Excluir", systemImage: "trash")
                        }
                    }
            }
        }
        .listStyle(.plain)
    }
    
    private func offlineComicRow(_ comic: OfflineComic) -> some View {
        HStack(spacing: 16) {
            // Cover thumbnail
            Image(uiImage: comic.cover)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 70, height: 100)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .shadow(color: .black.opacity(0.3), radius: 4, x: 0, y: 2)
            
            // Info
            VStack(alignment: .leading, spacing: 6) {
                Text(comic.title)
                    .font(.headline)
                    .foregroundColor(.primary)
                    .lineLimit(2)
                
                Text("\(comic.pageCount) \(loc.pages)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                // Offline badge
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 10))
                    Text(loc.availableOffline)
                        .font(.system(size: 10, weight: .medium))
                }
                .foregroundColor(.green)
            }
            
            Spacer()
            
            Image(systemName: "chevron.left")
                .font(.caption2)
                .foregroundColor(.secondary.opacity(0.5))
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
        )
    }
    
    private func removeComic(_ comic: OfflineComic) {
        OfflineService.shared.removeOfflineComic(at: comic.url.path)
        prefs.removeOfflineComic(path: comic.url.path)
        offlineComics.removeAll { $0.id == comic.id }
    }
}

#Preview {
    AppSettingsSheet()
}
