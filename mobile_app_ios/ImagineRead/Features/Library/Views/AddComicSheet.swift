//
//  AddComicSheet.swift
//  ImagineRead
//
//  Sheet for adding comics via QR code with preview
//

import SwiftUI
import PDFKit

/// States for the add comic flow
enum AddComicState {
    case input          // Enter code or scan
    case loading        // Fetching file info
    case preview        // Show file preview before download
    case downloading    // Downloading file
    case success        // Download complete
    case error(String)  // Error occurred
}

/// Sheet to add comics via code or QR code
struct AddComicSheet: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    @EnvironmentObject private var deepLinkHandler: DeepLinkHandler
    
    @State private var code = ""
    @State private var showScanner = false
    @State private var state: AddComicState = .input
    
    // File info from API
    @State private var fileInfo: LiteFileInfo?
    @State private var previewImage: UIImage?
    @State private var downloadProgress: Double = 0
    @State private var downloadedURL: URL?
    
    private let liteService = LiteDownloadService.shared
    
    var body: some View {
        NavigationView {
            ZStack {
                // Main content based on state
                switch state {
                case .input:
                    inputView
                case .loading:
                    loadingView(message: "Verificando código...")
                case .preview:
                    previewView
                case .downloading:
                    downloadingView
                case .success:
                    successView
                case .error(let message):
                    errorView(message: message)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(loc.close) { dismiss() }
                }
            }
        }
        .sheet(isPresented: $showScanner) {
            QRScannerView { scannedCode in
                code = liteService.extractCode(from: scannedCode)
                showScanner = false
                fetchFileInfo()
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .onAppear {
            if let pendingCode = deepLinkHandler.consumeLiteCode() {
                code = pendingCode
                fetchFileInfo()
            }
        }
    }
    
    // MARK: - Input View
    
    private var inputView: some View {
        VStack(spacing: 24) {
            headerIcon
            titleSection
            Spacer().frame(height: 10)
            codeInputSection
            divider
            scanButton
            Spacer()
            infoFooter
        }
    }
    
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
                    fetchFileInfo()
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
    
    // MARK: - Loading View
    
    private func loadingView(message: String) -> some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            
            Text(message)
                .font(.headline)
                .foregroundColor(.secondary)
        }
    }
    
    // MARK: - Preview View
    
    private var previewView: some View {
        VStack(spacing: 20) {
            // File preview image
            if let image = previewImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxHeight: 250)
                    .cornerRadius(12)
                    .shadow(radius: 8)
            } else {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 200)
                    .overlay {
                        Image(systemName: "doc.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                    }
            }
            
            // File info
            if let info = fileInfo {
                VStack(spacing: 8) {
                    Text(info.originalName)
                        .font(.headline)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                    
                    HStack(spacing: 16) {
                        Label(formatFileSize(info.fileSize), systemImage: "doc.fill")
                        
                        if let ext = info.originalName.split(separator: ".").last {
                            Label(ext.uppercased(), systemImage: "tag.fill")
                        }
                    }
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                }
                .padding(.horizontal, 24)
            }
            
            Spacer()
            
            // Add to library button
            Button {
                downloadFile()
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.title2)
                    
                    Text("Adicionar na Biblioteca")
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(IRGradients.primaryHorizontal)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 24)
            
            // Cancel button
            Button("Cancelar") {
                state = .input
                fileInfo = nil
                previewImage = nil
            }
            .foregroundColor(.secondary)
            .padding(.bottom, 20)
        }
        .padding(.top, 20)
    }
    
    // MARK: - Downloading View
    
    private var downloadingView: some View {
        VStack(spacing: 24) {
            // Progress circle
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                    .frame(width: 100, height: 100)
                
                Circle()
                    .trim(from: 0, to: downloadProgress)
                    .stroke(IRGradients.primaryHorizontal, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .frame(width: 100, height: 100)
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.2), value: downloadProgress)
                
                Text("\(Int(downloadProgress * 100))%")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            VStack(spacing: 8) {
                Text("Baixando no device...")
                    .font(.headline)
                
                if let info = fileInfo {
                    Text(info.originalName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        }
    }
    
    // MARK: - Success View
    
    private var successView: some View {
        VStack(spacing: 24) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundStyle(IRGradients.primary)
            
            VStack(spacing: 8) {
                Text("Adicionado!")
                    .font(.title2)
                    .fontWeight(.bold)
                
                if let info = fileInfo {
                    Text(info.originalName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                }
            }
            
            Button {
                dismiss()
            } label: {
                Text("Concluído")
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(IRGradients.primaryHorizontal)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 24)
        }
        .padding(.top, 40)
    }
    
    // MARK: - Error View
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 24) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)
            
            VStack(spacing: 8) {
                Text("Erro")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 24)
            
            Button {
                state = .input
            } label: {
                Text("Tentar Novamente")
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(IRGradients.primaryHorizontal)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 24)
        }
        .padding(.top, 40)
    }
    
    // MARK: - Actions
    
    private func fetchFileInfo() {
        guard !code.isEmpty else { return }
        
        state = .loading
        
        Task {
            do {
                let info = try await liteService.fetchFileInfo(code: code)
                
                // Try to get preview image if it's a PDF
                var preview: UIImage?
                if info.originalName.lowercased().hasSuffix(".pdf") {
                    // We'll show cover after download for now
                    preview = nil
                }
                
                await MainActor.run {
                    fileInfo = info
                    previewImage = preview
                    state = .preview
                }
                
            } catch let error as LiteDownloadError {
                await MainActor.run {
                    switch error {
                    case .codeNotFound:
                        state = .error("Código não encontrado")
                    case .codeExpired:
                        state = .error("Este código expirou")
                    default:
                        state = .error(error.localizedDescription)
                    }
                }
            } catch {
                await MainActor.run {
                    state = .error(error.localizedDescription)
                }
            }
        }
    }
    
    private func downloadFile() {
        guard let info = fileInfo else { return }
        
        state = .downloading
        downloadProgress = 0
        
        Task {
            do {
                // Download with progress
                let url = try await liteService.downloadFile(
                    from: info.downloadUrl,
                    fileName: info.originalName
                ) { progress in
                    Task { @MainActor in
                        downloadProgress = progress
                    }
                }
                
                await MainActor.run {
                    downloadedURL = url
                    state = .success
                    
                    // Notify library to refresh
                    NotificationCenter.default.post(name: .comicAdded, object: nil)
                }
                
            } catch {
                await MainActor.run {
                    state = .error("Falha no download: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // MARK: - Helpers
    
    private func formatFileSize(_ bytes: Int64) -> String {
        let mb = Double(bytes) / 1_000_000
        if mb >= 1 {
            return String(format: "%.1f MB", mb)
        } else {
            let kb = Double(bytes) / 1_000
            return String(format: "%.0f KB", kb)
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
