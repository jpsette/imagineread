//
//  ShareComicSheet.swift
//  ImagineRead
//
//  Share sheet for comics in the reader
//

import SwiftUI

struct ShareComicSheet: UIViewControllerRepresentable {
    let pdfURL: URL
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let activityVC = UIActivityViewController(
            activityItems: [pdfURL],
            applicationActivities: nil
        )
        return activityVC
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
