//
//  ReadingStatsView.swift
//  ImagineRead
//
//  Dashboard showing reading statistics
//

import SwiftUI

struct ReadingStatsView: View {
    @Environment(\.container) private var container
    
    var body: some View {
        ZStack {
            backgroundGradient
            
            ScrollView {
                VStack(spacing: 24) {
                    // Main Stats Grid
                    mainStatsSection
                    
                    // Streak Section
                    streakSection
                    
                    // Monthly Chart
                    monthlyChartSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 40)
            }
        }
        .navigationTitle("Estatísticas")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Main Stats
    
    private var mainStatsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Resumo")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                StatCard(
                    icon: "book.pages",
                    value: "\(container.readingStats.stats.totalPagesRead)",
                    label: "Páginas Lidas",
                    color: .purple
                )
                
                StatCard(
                    icon: "clock.fill",
                    value: formatTime(container.readingStats.stats.totalReadingTimeMinutes),
                    label: "Tempo de Leitura",
                    color: .blue
                )
                
                StatCard(
                    icon: "checkmark.circle.fill",
                    value: "\(container.readingStats.stats.comicsCompleted)",
                    label: "Quadrinhos Completos",
                    color: .green
                )
                
                StatCard(
                    icon: "calendar",
                    value: "\(container.readingStats.stats.readingDays.count)",
                    label: "Dias Ativos",
                    color: .orange
                )
            }
        }
    }
    
    // MARK: - Streak Section
    
    private var streakSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sequência de Leitura")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            
            HStack(spacing: 16) {
                // Current Streak
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(colors: [.orange, .red], startPoint: .top, endPoint: .bottom)
                            )
                            .frame(width: 80, height: 80)
                        
                        VStack(spacing: 0) {
                            Text("\(container.readingStats.stats.currentStreak)")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text("dias")
                                .font(.caption2)
                                .foregroundColor(.white.opacity(0.8))
                        }
                    }
                    
                    Text("Streak Atual")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
                
                // Fire animation placeholder
                VStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(
                            LinearGradient(colors: [.yellow, .orange, .red], startPoint: .top, endPoint: .bottom)
                        )
                    
                    if container.readingStats.stats.currentStreak > 0 {
                        Text("Continue lendo!")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
                .frame(maxWidth: .infinity)
                
                // Longest Streak
                VStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.1))
                            .frame(width: 80, height: 80)
                        
                        VStack(spacing: 0) {
                            Text("\(container.readingStats.stats.longestStreak)")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.white)
                            
                            Text("dias")
                                .font(.caption2)
                                .foregroundColor(.white.opacity(0.6))
                        }
                    }
                    
                    Text("Maior Streak")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.white.opacity(0.05))
            )
        }
    }
    
    // MARK: - Monthly Chart
    
    private var monthlyChartSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Páginas por Mês")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            
            MonthlyChartView(data: container.readingStats.monthlyStats(months: 6))
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
    
    // MARK: - Helpers
    
    private func formatTime(_ minutes: Int) -> String {
        if minutes < 60 {
            return "\(minutes)min"
        } else {
            let hours = minutes / 60
            return "\(hours)h"
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)
            
            Text(value)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.white)
            
            Text(label)
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.white.opacity(0.05))
        )
    }
}

// MARK: - Monthly Chart

struct MonthlyChartView: View {
    let data: [(month: Date, pages: Int)]
    
    private var maxValue: Int {
        max(data.map { $0.pages }.max() ?? 1, 1)
    }
    
    var body: some View {
        VStack(spacing: 8) {
            ForEach(data.indices, id: \.self) { index in
                let item = data[index]
                chartRow(month: item.month, pages: item.pages)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.white.opacity(0.05))
        )
    }
    
    private func chartRow(month: Date, pages: Int) -> some View {
        HStack(spacing: 12) {
            Text(monthName(month))
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
                .frame(width: 40, alignment: .leading)
            
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(.white.opacity(0.1))
                        .frame(height: 12)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(
                            LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                        )
                        .frame(width: max(4, geo.size.width * CGFloat(pages) / CGFloat(maxValue)), height: 12)
                }
            }
            .frame(height: 12)
            
            Text("\(pages)")
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .frame(width: 40, alignment: .trailing)
        }
    }
    
    private func monthName(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        formatter.locale = Locale(identifier: "pt_BR")
        return formatter.string(from: date)
    }
}

#Preview {
    NavigationView {
        ReadingStatsView()
    }
}
