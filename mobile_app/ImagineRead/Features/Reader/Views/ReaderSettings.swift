//
//  ReaderSettings.swift
//  ImagineRead
//
//  Reader settings panel with compact UX
//

import SwiftUI

/// Settings sheet for reader customization
struct ReaderSettingsSheet: View {
    @Binding var readingMode: ReadingMode
    @Binding var nightMode: NightMode
    @Binding var filterIntensity: Double
    @Binding var showProgressBar: Bool
    @Binding var readingLanguage: ReadingLanguage
    @Binding var balloonFontSize: Double
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    
    var body: some View {
        NavigationView {
            List {
                // Text Settings Section
                Section {
                    // Language
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
                    
                    // Font Size
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
                
                // Reading Mode Section
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
                
                // Night Mode Section
                NavigationLink {
                    NightModePickerView(
                        selection: $nightMode,
                        intensity: $filterIntensity
                    )
                } label: {
                    HStack {
                        Label(loc.lightFilter, systemImage: nightMode.icon)
                        Spacer()
                        Text(loc.nightModeName(nightMode))
                            .foregroundColor(.secondary)
                    }
                }
                
                // Display Options
                Section {
                    Toggle(isOn: $showProgressBar) {
                        Label(loc.progressBar, systemImage: "chart.bar")
                    }
                    .tint(.purple)
                } header: {
                    Text(loc.display)
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
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Language Picker

struct LanguagePickerView: View {
    @Binding var selection: ReadingLanguage
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        List {
            ForEach(ReadingLanguage.allCases) { language in
                Button {
                    selection = language
                    prefs.saveReadingLanguage(language)
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
        .navigationTitle(loc.balloonLanguage)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Font Size Picker

struct FontSizePickerView: View {
    @Binding var fontSize: Double
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    
    var body: some View {
        List {
            // Preview Section
            Section {
                VStack(spacing: 16) {
                    // Balloon preview
                    ZStack {
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white)
                            .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
                        
                        Text(loc.fontPreviewText)
                            .font(.system(size: 16 * fontSize))
                            .foregroundColor(.black)
                            .multilineTextAlignment(.center)
                            .padding()
                    }
                    .frame(height: 120)
                    .padding(.vertical, 8)
                }
            } header: {
                Text(loc.preview)
            }
            
            // Size Slider
            Section {
                VStack(spacing: 16) {
                    HStack {
                        Text(loc.size)
                        Spacer()
                        Text("\(Int(fontSize * 100))%")
                            .font(.headline)
                            .foregroundColor(.purple)
                    }
                    
                    HStack {
                        Image(systemName: "textformat.size.smaller")
                            .foregroundColor(.secondary)
                        
                        Slider(value: $fontSize, in: 0.5...2.0, step: 0.1)
                            .tint(.purple)
                            .onChange(of: fontSize) { _, newValue in
                                prefs.saveBalloonFontSize(newValue)
                            }
                        
                        Image(systemName: "textformat.size.larger")
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.vertical, 8)
            } footer: {
                Text(loc.adjustFontSize)
            }
            
            // Quick presets
            Section {
                ForEach([0.75, 1.0, 1.25, 1.5, 2.0], id: \.self) { size in
                    Button {
                        fontSize = size
                        prefs.saveBalloonFontSize(size)
                    } label: {
                        HStack {
                            Text(loc.fontSizeLabel(size))
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            Text("\(Int(size * 100))%")
                                .foregroundColor(.secondary)
                            
                            if abs(fontSize - size) < 0.05 {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.purple)
                            }
                        }
                    }
                }
            } header: {
                Text(loc.presetSizes)
            }
        }
        .navigationTitle(loc.fontSize)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Reading Mode Picker

struct ReadingModePickerView: View {
    @Binding var selection: ReadingMode
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        List {
            ForEach(ReadingMode.allCases, id: \.self) { mode in
                Button {
                    selection = mode
                    prefs.saveReadingMode(mode)
                    dismiss()
                } label: {
                    HStack {
                        Image(systemName: mode.icon)
                            .foregroundColor(.purple)
                            .frame(width: 30)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(loc.readingModeName(mode))
                                .foregroundColor(.primary)
                            
                            Text(loc.readingModeDesc(mode))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        if selection == mode {
                            Image(systemName: "checkmark")
                                .foregroundColor(.purple)
                        }
                    }
                }
            }
        }
        .navigationTitle(loc.readingMode)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Night Mode Picker

struct NightModePickerView: View {
    @Binding var selection: NightMode
    @Binding var intensity: Double
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var prefs: PreferencesService
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        List {
            // Mode selection
            Section {
                ForEach(NightMode.allCases, id: \.self) { mode in
                    Button {
                        withAnimation {
                            selection = mode
                            prefs.saveNightMode(mode)
                        }
                    } label: {
                        HStack {
                            Image(systemName: mode.icon)
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            
                            Text(loc.nightModeName(mode))
                                .foregroundColor(.primary)
                            
                            Spacer()
                            
                            if selection == mode {
                                Image(systemName: "checkmark")
                                    .foregroundColor(.orange)
                            }
                        }
                    }
                }
            }
            
            // Intensity slider
            if selection.hasIntensity {
                Section {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(loc.intensity)
                            Spacer()
                            Text("\(Int(intensity * 100))%")
                                .foregroundColor(.secondary)
                        }
                        
                        Slider(value: $intensity, in: 0...1)
                            .tint(selection == .sepia ? .orange : .purple)
                            .onChange(of: intensity) { _, newValue in
                                prefs.saveFilterIntensity(newValue)
                            }
                    }
                } footer: {
                    Text(loc.adjustFilterIntensity)
                }
            }
        }
        .navigationTitle(loc.lightFilter)
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    ReaderSettingsSheet(
        readingMode: .constant(.horizontal),
        nightMode: .constant(.off),
        filterIntensity: .constant(0.5),
        showProgressBar: .constant(true),
        readingLanguage: .constant(.portuguese),
        balloonFontSize: .constant(1.0)
    )
}
