//
//  BalloonOverlay.swift
//  ImagineRead
//
//  Vector rendering of balloons using SwiftUI Canvas
//

import SwiftUI
import Foundation

/// Renders a single balloon with vector graphics
struct BalloonOverlay: View {
    let balloon: Balloon
    let pageSize: CGSize
    let isVisible: Bool
    
    init(balloon: Balloon, pageSize: CGSize, isVisible: Bool = true) {
        self.balloon = balloon
        self.pageSize = pageSize
        self.isVisible = isVisible
    }
    
    var body: some View {
        ZStack {
            // Balloon shape
            Canvas { context, size in
                let path = buildPath(in: size)
                
                // Fill
                context.fill(
                    path,
                    with: .color(balloon.fillColor.opacity(balloon.opacity ?? 1.0))
                )
                
                // Stroke
                context.stroke(
                    path,
                    with: .color(balloon.strokeColor),
                    lineWidth: balloon.borderWidth ?? 2
                )
            }
            
            // Text overlay
            Text(balloon.text)
                .font(balloonFont)
                .foregroundColor(balloon.textFillColor)
                .multilineTextAlignment(.center)
                .padding(8)
        }
        .frame(
            width: balloon.boundingRect.width,
            height: balloon.boundingRect.height
        )
        .rotationEffect(.degrees(balloon.rotation ?? 0))
        .scaleEffect(
            x: balloon.scaleX ?? 1.0,
            y: balloon.scaleY ?? 1.0
        )
        .position(
            x: balloon.boundingRect.midX,
            y: balloon.boundingRect.midY
        )
        .opacity(isVisible ? 1 : 0)
        .scaleEffect(isVisible ? 1 : 0.5)
        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: isVisible)
    }
    
    // MARK: - Path Building
    
    private func buildPath(in size: CGSize) -> Path {
        // If we have custom vector points, use them
        if let points = balloon.points, points.count > 2 {
            return buildBezierPath(points: points, handles: balloon.vertexHandles, in: size)
        }
        
        // Otherwise use predefined shapes
        return buildShapePath(in: size)
    }
    
    /// Build path from Bézier points and handles
    private func buildBezierPath(points: [CGPoint], handles: [VertexHandle]?, in size: CGSize) -> Path {
        var path = Path()
        
        guard points.count > 0 else { return path }
        
        // Scale points to fit size
        let scaleX = size.width / balloon.boundingRect.width
        let scaleY = size.height / balloon.boundingRect.height
        
        let scaledPoints = points.map { point in
            CGPoint(
                x: (point.x - balloon.boundingRect.minX) * scaleX,
                y: (point.y - balloon.boundingRect.minY) * scaleY
            )
        }
        
        path.move(to: scaledPoints[0])
        
        for i in 1..<scaledPoints.count {
            if let handles = handles, i - 1 < handles.count {
                let handle = handles[i - 1]
                
                if let handleOut = handle.handleOut, let handleIn = handle.handleIn {
                    // Cubic Bézier curve
                    let cp1 = CGPoint(
                        x: (handleOut.x - balloon.boundingRect.minX) * scaleX,
                        y: (handleOut.y - balloon.boundingRect.minY) * scaleY
                    )
                    let cp2 = CGPoint(
                        x: (handleIn.x - balloon.boundingRect.minX) * scaleX,
                        y: (handleIn.y - balloon.boundingRect.minY) * scaleY
                    )
                    path.addCurve(to: scaledPoints[i], control1: cp1, control2: cp2)
                } else if let handleOut = handle.handleOut {
                    // Quadratic curve
                    let cp = CGPoint(
                        x: (handleOut.x - balloon.boundingRect.minX) * scaleX,
                        y: (handleOut.y - balloon.boundingRect.minY) * scaleY
                    )
                    path.addQuadCurve(to: scaledPoints[i], control: cp)
                } else {
                    // Straight line
                    path.addLine(to: scaledPoints[i])
                }
            } else {
                path.addLine(to: scaledPoints[i])
            }
        }
        
        path.closeSubpath()
        
        // Add tail if present
        if let tailPath = buildTailPath(in: size, scaleX: scaleX, scaleY: scaleY) {
            path.addPath(tailPath)
        }
        
        return path
    }
    
    /// Build path for predefined shapes
    private func buildShapePath(in size: CGSize) -> Path {
        var path = Path()
        let rect = CGRect(origin: .zero, size: size)
        let inset = (balloon.borderWidth ?? 2) / 2
        let insetRect = rect.insetBy(dx: inset, dy: inset)
        
        switch balloon.shape {
        case .rectangle:
            path.addRoundedRect(in: insetRect, cornerSize: CGSize(width: 8, height: 8))
            
        case .ellipse:
            path.addEllipse(in: insetRect)
            
        case .cloud:
            path = buildCloudPath(in: insetRect)
            
        case .scream:
            path = buildScreamPath(in: insetRect)
            
        case .custom:
            // Custom should have points, fallback to ellipse
            path.addEllipse(in: insetRect)
        }
        
        // Add tail for speech type
        if balloon.type == .speech, let tailPath = buildTailPath(in: size, scaleX: 1, scaleY: 1) {
            path.addPath(tailPath)
        }
        
        return path
    }
    
    /// Build cloud-shaped path
    private func buildCloudPath(in rect: CGRect) -> Path {
        var path = Path()
        
        let centerX = rect.midX
        let centerY = rect.midY
        let radiusX = rect.width / 2
        let radiusY = rect.height / 2
        
        // Create bumpy cloud effect with multiple arcs
        let bumps = 8
        for i in 0..<bumps {
            let angle1 = CGFloat(i) * (2 * .pi / CGFloat(bumps))
            let angle2 = CGFloat(i + 1) * (2 * .pi / CGFloat(bumps))
            
            let r1 = radiusX * (0.8 + 0.2 * Darwin.sin(Double(i) * 1.5))
            let r2 = radiusY * (0.8 + 0.2 * Darwin.cos(Double(i) * 1.5))
            
            let x1 = centerX + r1 * Darwin.cos(Double(angle1))
            let y1 = centerY + r2 * Darwin.sin(Double(angle1))
            let x2 = centerX + r1 * Darwin.cos(Double(angle2))
            let y2 = centerY + r2 * Darwin.sin(Double(angle2))
            
            if i == 0 {
                path.move(to: CGPoint(x: x1, y: y1))
            }
            
            let midAngle = (angle1 + angle2) / 2
            let bumpRadius = (r1 + r2) / 2 * 1.15
            let cpX = centerX + bumpRadius * Darwin.cos(Double(midAngle))
            let cpY = centerY + bumpRadius * Darwin.sin(Double(midAngle))
            
            path.addQuadCurve(to: CGPoint(x: x2, y: y2), control: CGPoint(x: cpX, y: cpY))
        }
        
        path.closeSubpath()
        return path
    }
    
    /// Build scream/shout shaped path (spiky)
    private func buildScreamPath(in rect: CGRect) -> Path {
        var path = Path()
        
        let centerX = rect.midX
        let centerY = rect.midY
        let radiusX = rect.width / 2
        let radiusY = rect.height / 2
        
        let spikes = 12
        for i in 0..<spikes {
            let angle = CGFloat(i) * (2 * .pi / CGFloat(spikes))
            let isSpike = i % 2 == 0
            let radius = isSpike ? 1.0 : 0.7
            
            let x = centerX + radiusX * radius * Darwin.cos(Double(angle))
            let y = centerY + radiusY * radius * Darwin.sin(Double(angle))
            
            if i == 0 {
                path.move(to: CGPoint(x: x, y: y))
            } else {
                path.addLine(to: CGPoint(x: x, y: y))
            }
        }
        
        path.closeSubpath()
        return path
    }
    
    /// Build tail (rabinho) path
    private func buildTailPath(in size: CGSize, scaleX: CGFloat, scaleY: CGFloat) -> Path? {
        guard let tailTip = balloon.tailTip else { return nil }
        
        var path = Path()
        
        let tip = CGPoint(
            x: (tailTip.x - balloon.boundingRect.minX) * scaleX,
            y: (tailTip.y - balloon.boundingRect.minY) * scaleY
        )
        
        // Simple triangular tail
        let baseWidth: CGFloat = 20
        let baseY = size.height * 0.8
        
        path.move(to: CGPoint(x: size.width / 2 - baseWidth / 2, y: baseY))
        path.addLine(to: tip)
        path.addLine(to: CGPoint(x: size.width / 2 + baseWidth / 2, y: baseY))
        path.closeSubpath()
        
        return path
    }
    
    // MARK: - Font
    
    private var balloonFont: Font {
        let size = balloon.fontSize ?? 14
        if let family = balloon.fontFamily {
            return .custom(family, size: size)
        }
        return .system(size: size, weight: .medium)
    }
}

// MARK: - Preview

#Preview {
    ZStack {
        Color.gray.opacity(0.3)
        
        BalloonOverlay(
            balloon: .mock(text: "Hello World!", rect: CGRect(x: 50, y: 50, width: 200, height: 100)),
            pageSize: CGSize(width: 400, height: 600)
        )
    }
    .frame(width: 400, height: 600)
}
