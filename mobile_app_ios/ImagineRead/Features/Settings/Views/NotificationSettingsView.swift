//
//  NotificationSettingsView.swift
//  ImagineRead
//
//  Settings for reading notifications and reminders
//

import SwiftUI

struct NotificationSettingsView: View {
    @Environment(\.container) private var container
    @State private var isRequestingPermission = false
    
    var body: some View {
        ZStack {
            backgroundGradient
            
            ScrollView {
                VStack(spacing: 24) {
                    // Permission Banner (if needed)
                    if !container.notifications.isAuthorized {
                        permissionBanner
                    }
                    
                    // Daily Reminder Section
                    dailyReminderSection
                    
                    // Abandoned Reading Section
                    abandonedReadingSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
        }
        .navigationTitle("Notificações")
        .navigationBarTitleDisplayMode(.inline)
    }
    
    // MARK: - Permission Banner
    
    private var permissionBanner: some View {
        VStack(spacing: 12) {
            Image(systemName: "bell.badge.fill")
                .font(.system(size: 40))
                .foregroundStyle(
                    LinearGradient(colors: [.orange, .yellow], startPoint: .top, endPoint: .bottom)
                )
            
            Text("Ative as Notificações")
                .font(.headline)
                .foregroundColor(.white)
            
            Text("Receba lembretes para manter o hábito de leitura.")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
            
            Button {
                requestPermission()
            } label: {
                Text("Permitir Notificações")
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(
                        Capsule()
                            .fill(
                                LinearGradient(colors: [.purple, .blue], startPoint: .leading, endPoint: .trailing)
                            )
                    )
            }
            .disabled(isRequestingPermission)
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.orange.opacity(0.1))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(.orange.opacity(0.3), lineWidth: 1)
                )
        )
    }
    
    // MARK: - Daily Reminder
    
    private var dailyReminderSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Lembrete Diário")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            
            VStack(spacing: 0) {
                // Toggle Row
                HStack {
                    Image(systemName: "bell.fill")
                        .foregroundColor(.orange)
                    
                    Text("Lembrete de Leitura")
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Toggle("", isOn: Binding(
                        get: { container.notifications.settings.dailyReminderEnabled },
                        set: { enabled in
                            container.notifications.setDailyReminder(
                                enabled: enabled,
                                hour: container.notifications.settings.dailyReminderHour,
                                minute: container.notifications.settings.dailyReminderMinute
                            )
                        }
                    ))
                    .tint(.purple)
                }
                .padding(16)
                
                if container.notifications.settings.dailyReminderEnabled {
                    Divider()
                        .background(.white.opacity(0.1))
                    
                    // Time Picker Row
                    HStack {
                        Image(systemName: "clock.fill")
                            .foregroundColor(.blue)
                        
                        Text("Horário")
                            .foregroundColor(.white)
                        
                        Spacer()
                        
                        DatePicker("", selection: Binding(
                            get: {
                                var components = DateComponents()
                                components.hour = container.notifications.settings.dailyReminderHour
                                components.minute = container.notifications.settings.dailyReminderMinute
                                return Calendar.current.date(from: components) ?? Date()
                            },
                            set: { date in
                                let components = Calendar.current.dateComponents([.hour, .minute], from: date)
                                container.notifications.setDailyReminder(
                                    enabled: true,
                                    hour: components.hour ?? 20,
                                    minute: components.minute ?? 0
                                )
                            }
                        ), displayedComponents: .hourAndMinute)
                        .labelsHidden()
                        .colorScheme(.dark)
                    }
                    .padding(16)
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.white.opacity(0.05))
            )
        }
    }
    
    // MARK: - Abandoned Reading
    
    private var abandonedReadingSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Leituras Abandonadas")
                .font(.headline)
                .foregroundColor(.white.opacity(0.9))
            
            HStack {
                Image(systemName: "book.closed.fill")
                    .foregroundColor(.purple)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Lembrar quadrinhos")
                        .foregroundColor(.white)
                    
                    Text("Após 3 dias sem ler")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.5))
                }
                
                Spacer()
                
                Toggle("", isOn: Binding(
                    get: { container.notifications.settings.abandonedReadingReminder },
                    set: { container.notifications.setAbandonedReadingReminder(enabled: $0) }
                ))
                .tint(.purple)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.white.opacity(0.05))
            )
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
    
    // MARK: - Actions
    
    private func requestPermission() {
        isRequestingPermission = true
        Task {
            _ = await container.notifications.requestPermission()
            isRequestingPermission = false
        }
    }
}

#Preview {
    NavigationView {
        NotificationSettingsView()
    }
}
