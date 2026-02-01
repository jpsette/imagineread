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
    
    @State private var code = ""
    @State private var showScanner = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
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
        }
        .sheet(isPresented: $showScanner) {
            QRScannerView { scannedCode in
                code = scannedCode
                showScanner = false
                validateCode()
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
    
    // MARK: - Subviews
    
    private var headerIcon: some View {
        ZStack {
            Circle()
                .fill(LinearGradient(
                    colors: [.purple, .blue],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: 80, height: 80)
            
            Image(systemName: "plus.rectangle.on.folder.fill")
                .font(.system(size: 36))
                .foregroundColor(.white)
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
                    validateCode()
                } label: {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.title2)
                        .foregroundColor(.purple)
                }
                .disabled(code.count < 6)
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
            .background(
                LinearGradient(
                    colors: [.purple, .blue],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal, 24)
    }
    
    @ViewBuilder
    private var errorSection: some View {
        if let error = errorMessage {
            Text(error)
                .font(.caption)
                .foregroundColor(.red)
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
    
    // MARK: - Actions
    
    private func validateCode() {
        guard !code.isEmpty else { return }
        
        isLoading = true
        errorMessage = nil
        
        // TODO: Implement actual API validation
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            isLoading = false
            errorMessage = loc.codeNotFound
        }
    }
}

#Preview {
    AddComicSheet()
}
