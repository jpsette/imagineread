//
//  AddComicSheet.swift
//  ImagineRead
//
//  Sheet for adding comics via code or QR scan
//

import SwiftUI

/// Sheet to add comics via code or QR code
struct AddComicSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var deepLinkHandler: DeepLinkHandler
    @EnvironmentObject private var liteService: LiteDownloadService
    
    @State private var code = ""
    @State private var showScanner = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var downloadedFile: URL?
    @State private var downloadedFileInfo: LiteFileInfo?
    @State private var showSuccess = false
    
    var body: some View {
        NavigationView {
            ZStack {
                VStack(spacing: 24) {
                    headerIcon
                    titleSection
                    Spacer().frame(height: 10)
                    codeInputSection
                    divider
                    scanButton
                    errorSection
                    Spacer()
                    infoFooter
                }
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(loc.close) { dismiss() }
                    }
                }
                .disabled(isLoading)
                .opacity(isLoading ? 0.5 : 1)
                
                // Loading overlay
                if isLoading {
                    loadingOverlay
                }
                
                // Success overlay
                if showSuccess {
                    successOverlay
                }
            }
        }
        .sheet(isPresented: $showScanner) {
            QRScannerView { scannedCode in
                code = scannedCode
                showScanner = false
                processCode()
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear {
            // Check for pending deep link code
            if let pendingCode = deepLinkHandler.consumeLiteCode() {
                code = pendingCode
                processCode()
            }
        }
    }
    
    // MARK: - Subviews
    
    private var headerIcon: some View {
        ZStack {
            Circle()
                .fill(IRGradients.primary)
                .frame(width: 80, height: 80)
            
            Image(systemName: "plus.rectangle.on.folder.fill")
                .font(.system(size: 36))
                .foregroundColor(IRColors.textPrimary)
        }
        .padding(.top, 20)
    }
    
    private var titleSection: some View {
        VStack(spacing: 8) {
            Text(loc.addComic)
                .font(.title2)
                .fontWeight(.bold)
            
            Text(loc.addComicDescription)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
    }
    
    private var codeInputSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(loc.enterCode)
                .font(.headline)
            
            HStack {
                TextField(loc.codePlaceholder, text: $code)
                    .textFieldStyle(.roundedBorder)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                
                Button {
                    processCode()
                } label: {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.title2)
                        .foregroundColor(IRColors.accentPrimary)
                }
                .disabled(code.count < 4)
            }
        }
        .padding(.horizontal, 24)
    }
    
    private var divider: some View {
        HStack {
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(height: 1)
            
            Text(loc.or)
                .font(.caption)
                .foregroundColor(.secondary)
                .padding(.horizontal, 16)
            
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(height: 1)
        }
        .padding(.horizontal, 24)
    }
    
    private var scanButton: some View {
        Button {
            showScanner = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "qrcode.viewfinder")
                    .font(.title2)
                
                Text(loc.scanQRCode)
                    .fontWeight(.semibold)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(IRGradients.primaryHorizontal)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal, 24)
    }
    
    @ViewBuilder
    private var errorSection: some View {
        if let error = errorMessage {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
            }
            .padding(.horizontal, 24)
        }
    }
    
    private var infoFooter: some View {
        HStack(spacing: 8) {
            Image(systemName: "info.circle")
                .foregroundColor(.secondary)
            
            Text(loc.codeInfo)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 20)
    }
    
    private var loadingOverlay: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.white)
            
            Text("Downloading...")
                .font(.headline)
                .foregroundColor(.white)
            
            if let fileName = liteService.currentFileName {
                Text(fileName)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .frame(width: 200, height: 150)
        .background(Color.black.opacity(0.8))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    private var successOverlay: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            Text("Added to Library!")
                .font(.headline)
                .foregroundColor(.white)
            
            if let info = downloadedFileInfo {
                Text(info.originalName)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.7))
            }
            
            Button("Done") {
                dismiss()
            }
            .foregroundColor(.white)
            .padding(.horizontal, 32)
            .padding(.vertical, 12)
            .background(IRGradients.primary)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .frame(width: 250, height: 220)
        .background(Color.black.opacity(0.9))
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
    
    // MARK: - Actions
    
    private func processCode() {
        guard !code.isEmpty else { return }
        
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // 1. Extract clean code (handles deep link format)
                let cleanCode = liteService.extractCode(from: code)
                
                // 2. Download file
                let (localURL, fileInfo) = try await liteService.downloadFromCode(cleanCode)
                
                await MainActor.run {
                    downloadedFile = localURL
                    downloadedFileInfo = fileInfo
                    isLoading = false
                    showSuccess = true
                    
                    // Notify library to refresh
                    NotificationCenter.default.post(name: .comicAdded, object: nil)
                }
                
            } catch let error as LiteDownloadError {
                await MainActor.run {
                    isLoading = false
                    switch error {
                    case .codeNotFound:
                        errorMessage = loc.codeNotFound
                    case .codeExpired:
                        errorMessage = "This code has expired"
                    default:
                        errorMessage = error.localizedDescription
                    }
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let comicAdded = Notification.Name("comicAdded")
}

#Preview {
    AddComicSheet()
}
