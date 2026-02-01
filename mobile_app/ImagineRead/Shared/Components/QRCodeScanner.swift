//
//  QRCodeScanner.swift
//  ImagineRead
//
//  QR Code scanning functionality using AVFoundation
//

import SwiftUI
import AVFoundation

// MARK: - QR Scanner View

struct QRScannerView: View {
    let onCodeScanned: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var loc: LocalizationService
    
    @State private var cameraPermissionGranted = false
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                if cameraPermissionGranted {
                    QRCodeScannerRepresentable(onCodeScanned: { code in
                        onCodeScanned(code)
                        dismiss()
                    })
                    
                    // Overlay frame
                    VStack {
                        Spacer()
                        
                        ZStack {
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.white, lineWidth: 3)
                                .frame(width: 250, height: 250)
                            
                            QRCornerAccents()
                        }
                        
                        Text(loc.pointAtQRCode)
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.top, 24)
                        
                        Spacer()
                    }
                } else {
                    cameraPermissionView
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(loc.close) {
                        dismiss()
                    }
                    .foregroundColor(.white)
                }
            }
        }
        .onAppear {
            checkCameraPermission()
        }
    }
    
    private var cameraPermissionView: some View {
        VStack(spacing: 20) {
            Image(systemName: "camera.fill")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text(loc.cameraPermissionRequired)
                .font(.headline)
                .foregroundColor(.white)
            
            Button(loc.openSettings) {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            .foregroundColor(.purple)
        }
    }
    
    private func checkCameraPermission() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            cameraPermissionGranted = true
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    cameraPermissionGranted = granted
                }
            }
        default:
            cameraPermissionGranted = false
        }
    }
}

// MARK: - Corner Accents

struct QRCornerAccents: View {
    var body: some View {
        GeometryReader { geo in
            let size: CGFloat = 30
            let offset: CGFloat = 10
            
            // Top-left
            Path { path in
                path.move(to: CGPoint(x: offset, y: offset + size))
                path.addLine(to: CGPoint(x: offset, y: offset))
                path.addLine(to: CGPoint(x: offset + size, y: offset))
            }
            .stroke(Color.purple, lineWidth: 4)
            
            // Top-right
            Path { path in
                path.move(to: CGPoint(x: geo.size.width - offset - size, y: offset))
                path.addLine(to: CGPoint(x: geo.size.width - offset, y: offset))
                path.addLine(to: CGPoint(x: geo.size.width - offset, y: offset + size))
            }
            .stroke(Color.purple, lineWidth: 4)
            
            // Bottom-left
            Path { path in
                path.move(to: CGPoint(x: offset, y: geo.size.height - offset - size))
                path.addLine(to: CGPoint(x: offset, y: geo.size.height - offset))
                path.addLine(to: CGPoint(x: offset + size, y: geo.size.height - offset))
            }
            .stroke(Color.purple, lineWidth: 4)
            
            // Bottom-right
            Path { path in
                path.move(to: CGPoint(x: geo.size.width - offset - size, y: geo.size.height - offset))
                path.addLine(to: CGPoint(x: geo.size.width - offset, y: geo.size.height - offset))
                path.addLine(to: CGPoint(x: geo.size.width - offset, y: geo.size.height - offset - size))
            }
            .stroke(Color.purple, lineWidth: 4)
        }
        .frame(width: 250, height: 250)
    }
}

// MARK: - UIKit Bridge

struct QRCodeScannerRepresentable: UIViewControllerRepresentable {
    let onCodeScanned: (String) -> Void
    
    func makeUIViewController(context: Context) -> QRScannerViewController {
        let controller = QRScannerViewController()
        controller.onCodeScanned = onCodeScanned
        return controller
    }
    
    func updateUIViewController(_ uiViewController: QRScannerViewController, context: Context) {}
}

// MARK: - View Controller

class QRScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var captureSession: AVCaptureSession?
    var previewLayer: AVCaptureVideoPreviewLayer?
    var onCodeScanned: ((String) -> Void)?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        startScanning()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        stopScanning()
    }
    
    private func setupCamera() {
        captureSession = AVCaptureSession()
        
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video),
              let videoInput = try? AVCaptureDeviceInput(device: videoCaptureDevice),
              let captureSession = captureSession,
              captureSession.canAddInput(videoInput) else {
            return
        }
        
        captureSession.addInput(videoInput)
        
        let metadataOutput = AVCaptureMetadataOutput()
        
        if captureSession.canAddOutput(metadataOutput) {
            captureSession.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        }
        
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer?.frame = view.layer.bounds
        previewLayer?.videoGravity = .resizeAspectFill
        
        if let previewLayer = previewLayer {
            view.layer.addSublayer(previewLayer)
        }
    }
    
    private func startScanning() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession?.startRunning()
        }
    }
    
    private func stopScanning() {
        captureSession?.stopRunning()
    }
    
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           metadataObject.type == .qr,
           let stringValue = metadataObject.stringValue {
            
            // Haptic feedback
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
            
            stopScanning()
            onCodeScanned?(stringValue)
        }
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
    }
}
