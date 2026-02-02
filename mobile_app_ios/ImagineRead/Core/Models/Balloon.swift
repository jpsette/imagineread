//
//  Balloon.swift
//  ImagineRead
//
//  Data model for comic balloons (speech bubbles) from Studio
//

import SwiftUI

// MARK: - Balloon Shape

/// Shape variants for balloons
enum BalloonShape: String, Codable, CaseIterable {
    case rectangle
    case ellipse
    case cloud
    case scream
    case custom
}

// MARK: - Balloon Type

/// Type/purpose of balloon
enum BalloonType: String, Codable, CaseIterable {
    case speech
    case thought
    case whisper
    case shout
    case text
    case shape
    case mask
    case balloonSquare = "balloon-square"
    case balloonCircle = "balloon-circle"
    case balloonCloud = "balloon-cloud"
}

// MARK: - Vertex Handle

/// Bézier curve control points for a vertex
struct VertexHandle: Codable, Equatable {
    var handleIn: CGPoint?
    var handleOut: CGPoint?
    
    enum CodingKeys: String, CodingKey {
        case handleIn, handleOut
    }
    
    init(handleIn: CGPoint? = nil, handleOut: CGPoint? = nil) {
        self.handleIn = handleIn
        self.handleOut = handleOut
    }
}

// MARK: - Balloon

/// Main balloon model matching Studio's Balloon type
struct Balloon: Codable, Identifiable, Equatable {
    let id: String
    var text: String
    var box2d: [CGFloat]  // [ymin, xmin, ymax, xmax]
    var shape: BalloonShape
    var type: BalloonType
    
    // MARK: - Geometry (Vector)
    
    /// Polygon points defining the balloon shape
    var points: [CGPoint]?
    
    /// Bézier handles for each vertex
    var vertexHandles: [VertexHandle]?
    
    /// Curve control points for advanced curves
    var curveControlPoints: [[CGPoint]]?
    
    /// Custom SVG path data
    var customSvg: String?
    
    // MARK: - Tail (Rabinho)
    
    /// Tail tip position
    var tailTip: CGPoint?
    
    /// Tail control point for curve
    var tailControl: CGPoint?
    
    /// Tail curve intensity
    var tailCurve: CGFloat?
    
    // MARK: - Style
    
    /// Fill color (hex)
    var color: String?
    
    /// Border color (hex)
    var borderColor: String?
    
    /// Border width in points
    var borderWidth: CGFloat?
    
    /// Overall opacity (0-1)
    var opacity: CGFloat?
    
    /// Text color (hex)
    var textColor: String?
    
    /// Font size in points
    var fontSize: CGFloat?
    
    /// Font family name
    var fontFamily: String?
    
    // MARK: - Transform
    
    /// Rotation in degrees
    var rotation: CGFloat?
    
    /// Scale X factor
    var scaleX: CGFloat?
    
    /// Scale Y factor
    var scaleY: CGFloat?
    
    // MARK: - Animation
    
    /// Animation delay in seconds
    var animationDelay: TimeInterval?
    
    /// Animation duration in seconds
    var animationDuration: TimeInterval?
    
    /// Animation type
    var animationType: String?
    
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
    
    /// Fill color as SwiftUI Color
    var fillColor: Color {
        Color(hex: color ?? "#FFFFFF") ?? .white
    }
    
    /// Stroke color as SwiftUI Color
    var strokeColor: Color {
        Color(hex: borderColor ?? "#000000") ?? .black
    }
    
    /// Text color as SwiftUI Color
    var textFillColor: Color {
        Color(hex: textColor ?? "#000000") ?? .black
    }
}

// MARK: - Balloon Extensions

extension Balloon {
    /// Create a simple test balloon
    static func mock(
        id: String = UUID().uuidString,
        text: String = "Hello!",
        rect: CGRect = CGRect(x: 100, y: 100, width: 200, height: 100)
    ) -> Balloon {
        Balloon(
            id: id,
            text: text,
            box2d: [rect.minY, rect.minX, rect.maxY, rect.maxX],
            shape: .ellipse,
            type: .speech,
            color: "#FFFFFF",
            borderColor: "#000000",
            borderWidth: 2,
            fontSize: 14
        )
    }
}

// MARK: - CGPoint Codable

extension CGPoint: Codable {
    enum CodingKeys: String, CodingKey {
        case x, y
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let x = try container.decode(CGFloat.self, forKey: .x)
        let y = try container.decode(CGFloat.self, forKey: .y)
        self.init(x: x, y: y)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(x, forKey: .x)
        try container.encode(y, forKey: .y)
    }
}
