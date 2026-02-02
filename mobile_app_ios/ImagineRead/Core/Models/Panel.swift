//
//  Panel.swift
//  ImagineRead
//
//  Data model for comic panels from Studio
//

import SwiftUI

/// Represents a panel (quadro) in a comic page
struct Panel: Codable, Identifiable, Equatable {
    let id: String
    
    /// Reading order of the panel
    var order: Int
    
    /// Polygon points defining the panel shape [x1, y1, x2, y2, ...]
    var points: [CGFloat]
    
    /// Bounding box [ymin, xmin, ymax, xmax]
    var box2d: [CGFloat]
    
    // MARK: - Computed Properties
    
    /// Bounding rect from box2d
    var boundingRect: CGRect {
        guard box2d.count >= 4 else { return .zero }
        let ymin = box2d[0]
        let xmin = box2d[1]
        let ymax = box2d[2]
        let xmax = box2d[3]
        return CGRect(x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin)
    }
    
    /// Points as array of CGPoint
    var polygonPoints: [CGPoint] {
        var result: [CGPoint] = []
        for i in stride(from: 0, to: points.count - 1, by: 2) {
            result.append(CGPoint(x: points[i], y: points[i + 1]))
        }
        return result
    }
}

// MARK: - Panel Extensions

extension Panel {
    /// Create a mock panel for testing
    static func mock(
        id: String = UUID().uuidString,
        order: Int = 0,
        rect: CGRect = CGRect(x: 0, y: 0, width: 300, height: 400)
    ) -> Panel {
        Panel(
            id: id,
            order: order,
            points: [
                rect.minX, rect.minY,
                rect.maxX, rect.minY,
                rect.maxX, rect.maxY,
                rect.minX, rect.maxY
            ],
            box2d: [rect.minY, rect.minX, rect.maxY, rect.maxX]
        )
    }
}
