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
    @State private var showSettings = false
    
    var body: some View {
        NavigationView {
            ZStack {
                backgroundGradient
                
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
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                
                ToolbarItem(placement: .principal) {
                    Text("Meu Perfil")
                        .font(.headline)
                        .foregroundColor(.white)
                }
            }
        }
    }
    
    // MARK: - Background
    
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
    
    // MARK: - Quick Stats Section
    
    private var quickStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Estatísticas Rápidas")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                QuickStatsCard(
                    icon: "book.pages",
                    title: "Páginas Lidas",
                    value: "\(container.readingStats.stats.totalPagesRead)",
                    gradient: [.purple, .blue]
                )
                
                QuickStatsCard(
                    icon: "flame.fill",
                    title: "Streak Atual",
                    value: "\(container.readingStats.stats.currentStreak) dias",
                    gradient: [.orange, .red]
                )
                
                QuickStatsCard(
                    icon: "checkmark.circle.fill",
                    title: "Completos",
                    value: "\(container.readingStats.stats.comicsCompleted)",
                    gradient: [.green, .teal]
                )
                
                QuickStatsCard(
                    icon: "clock.fill",
                    title: "Tempo de Leitura",
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
                    title: "Minhas Coleções",
                    subtitle: "\(container.collections.allCollections().count) coleções",
                    color: .purple
                )
            }
            
            NavigationLink {
                ReadingStatsView()
            } label: {
                ProfileNavigationRow(
                    icon: "chart.bar.fill",
                    title: "Estatísticas",
                    subtitle: "Histórico de leitura",
                    color: .blue
                )
            }
            
            NavigationLink {
                NotificationSettingsView()
            } label: {
                ProfileNavigationRow(
                    icon: "bell.badge.fill",
                    title: "Notificações",
                    subtitle: container.notifications.settings.dailyReminderEnabled ? "Ativo" : "Desativado",
                    color: .orange
                )
            }
            
            // Settings button
            Button {
                showSettings = true
            } label: {
                ProfileNavigationRow(
                    icon: "gearshape.fill",
                    title: "Configurações",
                    subtitle: "Idioma, aparência e mais",
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
                .foregroundColor(.white)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.white.opacity(0.08))
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
                    .foregroundColor(.white)
                
                Text(subtitle)
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

#Preview {
    ProfileView()
}
