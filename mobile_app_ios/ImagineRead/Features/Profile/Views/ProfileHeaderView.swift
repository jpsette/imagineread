//
//  ProfileHeaderView.swift
//  ImagineRead
//
//  User avatar and name header component
//

import SwiftUI

struct ProfileHeaderView: View {
    @Environment(\.container) private var container
    @EnvironmentObject private var loc: LocalizationService
    @State private var userName: String = "Leitor"
    
    var body: some View {
        VStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.purple, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 100, height: 100)
                
                Image(systemName: "person.fill")
                    .font(.system(size: 44))
                    .foregroundColor(.white)
            }
            .shadow(color: .purple.opacity(0.4), radius: 15, x: 0, y: 8)
            
            // Name
            VStack(spacing: 4) {
                Text(loc.helloReader)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text(memberSinceText)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
            }
            
            // Top comic badge (if available)
            if container.readingStats.stats.comicsCompleted > 0 {
                HStack(spacing: 6) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.yellow)
                    
                    Text(loc.dedicatedReader)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.white.opacity(0.9))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(.yellow.opacity(0.2))
                        .overlay(
                            Capsule().stroke(.yellow.opacity(0.4), lineWidth: 1)
                        )
                )
            }
        }
        .padding(.vertical, 20)
    }
    
    private var memberSinceText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        formatter.locale = Locale(identifier: loc.language == .portuguese ? "pt_BR" : loc.language == .english ? "en_US" : loc.language == .spanish ? "es_ES" : loc.language == .arabic ? "ar_SA" : "fr_FR")
        
        // Use first reading session date or now
        if let firstSession = container.readingStats.sessions.sorted(by: { $0.startTime < $1.startTime }).first {
            return "\(loc.memberSince) \(formatter.string(from: firstSession.startTime))"
        }
        return loc.welcomeMessage
    }
}

#Preview {
    ZStack {
        Color(red: 0.1, green: 0.1, blue: 0.2)
            .ignoresSafeArea()
        ProfileHeaderView()
    }
}
