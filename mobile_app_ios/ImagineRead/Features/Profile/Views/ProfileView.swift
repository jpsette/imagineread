//
//  ProfileView.swift
//  ImagineRead
//
//  Main user profile screen
//

import SwiftUI

struct ProfileView: View {
    @Environment(\.container) private var container
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    @State private var showSettings = false
    
    var body: some View {
        NavigationView {
            ZStack {
                ScrollView {
                    VStack(spacing: 24) {
                        ProfileHeaderView()
                        
                        quickStatsSection
                        
                        navigationSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 40)
                }
            }
            .appBackground()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(IRColors.textSecondary)
                    }
                }
                
                ToolbarItem(placement: .principal) {
                    Text(loc.myProfile)
                        .font(.headline)
                        .foregroundColor(IRColors.textPrimary)
                }
            }
        }
    }
    

    
    // MARK: - Quick Stats Section
    
    private var quickStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(loc.quickStats)
                .font(.headline)
                .foregroundColor(IRColors.textSecondary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                QuickStatsCard(
                    icon: "book.pages",
                    title: loc.pagesRead,
                    value: "\(container.readingStats.stats.totalPagesRead)",
                    gradient: [.purple, .blue]
                )
                
                QuickStatsCard(
                    icon: "flame.fill",
                    title: loc.currentStreak,
                    value: "\(container.readingStats.stats.currentStreak) \(loc.days)",
                    gradient: [.orange, .red]
                )
                
                QuickStatsCard(
                    icon: "checkmark.circle.fill",
                    title: loc.completedLabel,
                    value: "\(container.readingStats.stats.comicsCompleted)",
                    gradient: [.green, .teal]
                )
                
                QuickStatsCard(
                    icon: "clock.fill",
                    title: loc.readingTime,
                    value: formatTime(container.readingStats.stats.totalReadingTimeMinutes),
                    gradient: [.cyan, .blue]
                )
            }
        }
    }
    
    // MARK: - Navigation Section
    
    private var navigationSection: some View {
        VStack(spacing: 12) {
            NavigationLink {
                CollectionsListView()
            } label: {
                ProfileNavigationRow(
                    icon: "folder.fill",
                    title: loc.myCollections,
                    subtitle: "\(container.collections.allCollections().count) \(loc.collections.lowercased())",
                    color: .purple
                )
            }
            
            NavigationLink {
                ReadingStatsView()
            } label: {
                ProfileNavigationRow(
                    icon: "chart.bar.fill",
                    title: loc.statistics,
                    subtitle: loc.readingHistory,
                    color: .blue
                )
            }
            
            NavigationLink {
                NotificationSettingsView()
            } label: {
                ProfileNavigationRow(
                    icon: "bell.badge.fill",
                    title: loc.notifications,
                    subtitle: container.notifications.settings.dailyReminderEnabled ? loc.enabled : loc.disabled,
                    color: .orange
                )
            }
            
            // Settings button
            Button {
                showSettings = true
            } label: {
                ProfileNavigationRow(
                    icon: "gearshape.fill",
                    title: loc.settings,
                    subtitle: loc.settingsSubtitle,
                    color: .gray
                )
            }
        }
        .sheet(isPresented: $showSettings) {
            AppSettingsSheet()
        }
    }
    
    // MARK: - Helpers
    
    private func formatTime(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes)min"
        } else {
            let hours = minutes / 60
            let mins = minutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }
}

// MARK: - Quick Stats Card

struct QuickStatsCard: View {
    let icon: String
    let title: String
    let value: String
    let gradient: [Color]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(
                        LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                
                Spacer()
            }
            
            Text(value)
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(IRColors.textPrimary)
            
            Text(title)
                .font(.caption)
                .foregroundColor(IRColors.textMuted)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(IRColors.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(
                            LinearGradient(colors: gradient.map { $0.opacity(0.3) }, startPoint: .topLeading, endPoint: .bottomTrailing),
                            lineWidth: 1
                        )
                )
        )
    }
}

// MARK: - Navigation Row

struct ProfileNavigationRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(color.opacity(0.2))
                    .frame(width: 44, height: 44)
                
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(color)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(IRColors.textPrimary)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(IRColors.textMuted)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(IRColors.textMuted)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(IRColors.surface)
        )
    }
}

#Preview {
    ProfileView()
}
