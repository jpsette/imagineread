//
//  HighlightCanvas.swift
//  ImagineRead
//
//  Drawing canvas with support for creating and editing highlights
//

import SwiftUI

/// Canvas for drawing and editing highlights
struct HighlightCanvas: View {
    let comicPath: String
    let pageIndex: Int
    let containerSize: CGSize
    let zoomScale: CGFloat
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    
    // Drawing state
    @State private var currentRect: CGRect = .zero
    @State private var isDragging = false
    @State private var startPoint: CGPoint = .zero
    
    // Editing state
    @State private var selectedHighlightId: UUID?
    @State private var editMode: EditMode = .none
    @State private var editStartRect: CGRect = .zero
    @State private var editStartPoint: CGPoint = .zero
    @State private var movingRect: CGRect = .zero  // Temporary position during move
    
    private var selectedColor: Color {
        Color(hex: highlightsService.selectedColor) ?? .yellow
    }
    
    private var pageHighlights: [Highlight] {
        highlightsService.highlightsForPage(pageIndex, in: comicPath)
    }
    
    /// Size compensation for zoom (keeps UI elements same visual size)
    private var scaleCompensation: CGFloat {
        1 / zoomScale
    }
    
    enum EditMode {
        case none
        case move
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Transparent overlay to capture gestures
                Color.clear
                    .contentShape(Rectangle())
                
                // Editable highlights (hide selected one - ResizeHandles/MovingRect show it)
                ForEach(Array(pageHighlights.enumerated()), id: \.element.id) { index, highlight in
                    // Hide the selected highlight entirely (we show it via ResizeHandles or MovingRect)
                    if selectedHighlightId != highlight.id {
                        EditableHighlightRect(
                            highlight: highlight,
                            containerSize: geometry.size,
                            isSelected: false,
                            scaleCompensation: scaleCompensation,
                            highlightNumber: index + 1,
                            onSelect: {
                                selectedHighlightId = highlight.id
                                let generator = UIImpactFeedbackGenerator(style: .light)
                                generator.impactOccurred()
                            }
                        )
                    }
                }
                
                // Moving highlight (shown during drag)
                if editMode == .move, movingRect != .zero,
                   let selectedId = selectedHighlightId,
                   let selectedIndex = pageHighlights.firstIndex(where: { $0.id == selectedId }),
                   let highlight = pageHighlights.first(where: { $0.id == selectedId }) {
                    MovingHighlightRect(
                        rect: movingRect,
                        color: Color(hex: highlight.color) ?? .yellow,
                        hasNote: highlight.hasNote,
                        scaleCompensation: scaleCompensation,
                        highlightNumber: selectedIndex + 1
                    )
                }
                
                // Resize handles for selected highlight (not during move)
                if let selectedId = selectedHighlightId,
                   let selectedIndex = pageHighlights.firstIndex(where: { $0.id == selectedId }),
                   let highlight = pageHighlights.first(where: { $0.id == selectedId }),
                   editMode != .move {
                    ResizeHandles(
                        highlight: highlight,
                        containerSize: geometry.size,
                        scaleCompensation: scaleCompensation,
                        highlightNumber: selectedIndex + 1
                    )
                }
                
                // Current drawing rectangle (new highlight)
                if isDragging && selectedHighlightId == nil {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(selectedColor.opacity(0.4))
                        .frame(width: currentRect.width, height: currentRect.height)
                        .position(x: currentRect.midX, y: currentRect.midY)
                }
            }
            .gesture(
                DragGesture(minimumDistance: 5)
                    .onChanged { value in
                        // Check if starting on existing highlight
                        if !isDragging && selectedHighlightId == nil {
                            if let hitHighlight = hitTest(point: value.startLocation, in: geometry.size) {
                                // Select existing highlight and start move
                                selectedHighlightId = hitHighlight.id
                                editMode = .move
                                editStartRect = denormalizeRect(hitHighlight.rect, in: geometry.size)
                                editStartPoint = value.startLocation
                                movingRect = editStartRect
                                isDragging = true
                                return
                            }
                        }
                        
                        // Handle move of selected highlight
                        if selectedHighlightId != nil, editMode == .move {
                            let dx = value.location.x - editStartPoint.x
                            let dy = value.location.y - editStartPoint.y
                            
                            movingRect = CGRect(
                                x: editStartRect.origin.x + dx,
                                y: editStartRect.origin.y + dy,
                                width: editStartRect.width,
                                height: editStartRect.height
                            )
                            isDragging = true
                            return
                        }
                        
                        // Creating new highlight
                        if selectedHighlightId == nil {
                            if !isDragging {
                                isDragging = true
                                startPoint = value.startLocation
                            }
                            
                            let minX = min(startPoint.x, value.location.x)
                            let minY = min(startPoint.y, value.location.y)
                            let width = abs(value.location.x - startPoint.x)
                            let height = abs(value.location.y - startPoint.y)
                            
                            currentRect = CGRect(x: minX, y: minY, width: width, height: height)
                        }
                    }
                    .onEnded { value in
                        // Save move of selected highlight
                        if let selectedId = selectedHighlightId, editMode == .move {
                            let normalizedRect = normalizeRect(movingRect, in: geometry.size)
                            highlightsService.updateRect(for: selectedId, rect: normalizedRect)
                            
                            editMode = .none
                            movingRect = .zero
                            isDragging = false
                            return
                        }
                        
                        // Save new highlight
                        if selectedHighlightId == nil {
                            isDragging = false
                            
                            if currentRect.width > 15 && currentRect.height > 8 {
                                let normalizedRect = normalizeRect(currentRect, in: geometry.size)
                                highlightsService.addHighlight(
                                    to: comicPath,
                                    page: pageIndex,
                                    rect: normalizedRect
                                )
                                
                                let generator = UINotificationFeedbackGenerator()
                                generator.notificationOccurred(.success)
                            }
                            
                            currentRect = .zero
                        }
                    }
            )
            .simultaneousGesture(
                TapGesture()
                    .onEnded {
                        // Deselect on tap outside
                        selectedHighlightId = nil
                        editMode = .none
                        movingRect = .zero
                    }
            )
        }
    }
    
    // MARK: - Helper Methods
    
    private func hitTest(point: CGPoint, in size: CGSize) -> Highlight? {
        for highlight in pageHighlights {
            let frame = denormalizeRect(highlight.rect, in: size)
            if frame.contains(point) {
                return highlight
            }
        }
        return nil
    }
    
    private func normalizeRect(_ rect: CGRect, in size: CGSize) -> CGRect {
        CGRect(
            x: rect.origin.x / size.width,
            y: rect.origin.y / size.height,
            width: rect.width / size.width,
            height: rect.height / size.height
        )
    }
    
    private func denormalizeRect(_ rect: CGRect, in size: CGSize) -> CGRect {
        CGRect(
            x: rect.origin.x * size.width,
            y: rect.origin.y * size.height,
            width: rect.width * size.width,
            height: rect.height * size.height
        )
    }
}

/// Highlight being moved (shown during drag)
struct MovingHighlightRect: View {
    let rect: CGRect
    let color: Color
    let hasNote: Bool
    let scaleCompensation: CGFloat
    let highlightNumber: Int
    
    var body: some View {
        ZStack {
            // Fill
            RoundedRectangle(cornerRadius: 4)
                .fill(color.opacity(0.5))
                .frame(width: rect.width, height: rect.height)
            
            // Border
            RoundedRectangle(cornerRadius: 4)
                .strokeBorder(Color.white, lineWidth: 1 * scaleCompensation)
                .frame(width: rect.width, height: rect.height)
            
            // Number badge (top-left corner)
            Text("\(highlightNumber)")
                .font(.system(size: 11 * scaleCompensation, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: 18 * scaleCompensation, height: 18 * scaleCompensation)
                .background(Circle().fill(color.opacity(0.95)))
                .shadow(color: .black.opacity(0.3), radius: 2 * scaleCompensation)
                .offset(
                    x: -(rect.width / 2) + 10 * scaleCompensation,
                    y: -(rect.height / 2) + 10 * scaleCompensation
                )
            
            // Note indicator (top-right corner)
            if hasNote {
                Image(systemName: "text.bubble.fill")
                    .font(.system(size: 12 * scaleCompensation))
                    .foregroundStyle(.white)
                    .padding(3 * scaleCompensation)
                    .background(Circle().fill(color.opacity(0.9)))
                    .offset(
                        x: (rect.width / 2) + 4 * scaleCompensation,
                        y: -(rect.height / 2) - 4 * scaleCompensation
                    )
            }
        }
        .position(x: rect.midX, y: rect.midY)
    }
}

/// Editable highlight rectangle with selection state
struct EditableHighlightRect: View {
    let highlight: Highlight
    let containerSize: CGSize
    let isSelected: Bool
    let scaleCompensation: CGFloat
    let highlightNumber: Int   // Number to display on the highlight
    let onSelect: () -> Void
    
    private var color: Color {
        Color(hex: highlight.color) ?? .yellow
    }
    
    private var frame: CGRect {
        CGRect(
            x: highlight.rect.origin.x * containerSize.width,
            y: highlight.rect.origin.y * containerSize.height,
            width: highlight.rect.width * containerSize.width,
            height: highlight.rect.height * containerSize.height
        )
    }
    
    var body: some View {
        ZStack {
            // Main highlight fill
            RoundedRectangle(cornerRadius: 4)
                .fill(color.opacity(isSelected ? 0.5 : 0.35))
                .frame(width: frame.width, height: frame.height)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .strokeBorder(isSelected ? Color.white : Color.clear, lineWidth: 1 * scaleCompensation)
                )
            
            // Number badge (top-left corner)
            Text("\(highlightNumber)")
                .font(.system(size: 11 * scaleCompensation, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: 18 * scaleCompensation, height: 18 * scaleCompensation)
                .background(Circle().fill(color.opacity(0.95)))
                .shadow(color: .black.opacity(0.3), radius: 2 * scaleCompensation)
                .offset(
                    x: -(frame.width / 2) + 10 * scaleCompensation,
                    y: -(frame.height / 2) + 10 * scaleCompensation
                )
            
            // Note indicator (top-right corner)
            if highlight.hasNote {
                Image(systemName: "text.bubble.fill")
                    .font(.system(size: 12 * scaleCompensation))
                    .foregroundStyle(.white)
                    .padding(3 * scaleCompensation)
                    .background(Circle().fill(color.opacity(0.9)))
                    .offset(
                        x: (frame.width / 2) + 4 * scaleCompensation,
                        y: -(frame.height / 2) - 4 * scaleCompensation
                    )
            }
        }
        .position(x: frame.midX, y: frame.midY)
        .onTapGesture {
            onSelect()
        }
    }
}

/// Resize handles for selected highlight
struct ResizeHandles: View {
    let highlight: Highlight
    let containerSize: CGSize
    let scaleCompensation: CGFloat
    let highlightNumber: Int
    
    @ObservedObject private var highlightsService = HighlightsService.shared
    @State private var currentRect: CGRect = .zero
    @State private var initialRect: CGRect = .zero
    
    private var baseFrame: CGRect {
        CGRect(
            x: highlight.rect.origin.x * containerSize.width,
            y: highlight.rect.origin.y * containerSize.height,
            width: highlight.rect.width * containerSize.width,
            height: highlight.rect.height * containerSize.height
        )
    }
    
    private var frame: CGRect {
        currentRect != .zero ? currentRect : baseFrame
    }
    
    /// Handle size that stays consistent regardless of zoom
    private var handleSize: CGFloat {
        20 * scaleCompensation
    }
    
    private var highlightColor: Color {
        Color(hex: highlight.color) ?? .yellow
    }
    
    var body: some View {
        ZStack {
            // Highlight fill (updates in real-time during resize/move)
            // Also handles drag to move
            RoundedRectangle(cornerRadius: 4)
                .fill(highlightColor.opacity(0.5))
                .frame(width: frame.width, height: frame.height)
                .position(x: frame.midX, y: frame.midY)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            if initialRect == .zero {
                                initialRect = baseFrame
                            }
                            // Move the entire rect
                            currentRect = CGRect(
                                x: initialRect.origin.x + value.translation.width,
                                y: initialRect.origin.y + value.translation.height,
                                width: initialRect.width,
                                height: initialRect.height
                            )
                        }
                        .onEnded { _ in
                            saveRect()
                        }
                )
            
            // Selection border (updates in real-time during resize/move)
            RoundedRectangle(cornerRadius: 4)
                .strokeBorder(Color.white, lineWidth: 1 * scaleCompensation)
                .frame(width: frame.width, height: frame.height)
                .position(x: frame.midX, y: frame.midY)
                .allowsHitTesting(false)
            
            // Corner handles for resize
            ForEach(Corner.allCases, id: \.self) { corner in
                Circle()
                    .fill(Color.white)
                    .frame(width: handleSize, height: handleSize)
                    .shadow(radius: 1 * scaleCompensation)
                    .position(handlePosition(for: corner))
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                if initialRect == .zero {
                                    initialRect = baseFrame
                                }
                                updateRect(corner: corner, translation: value.translation)
                            }
                            .onEnded { _ in
                                saveRect()
                            }
                    )
            }
            
            // Number badge (top-left corner)
            Text("\(highlightNumber)")
                .font(.system(size: 11 * scaleCompensation, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .frame(width: 18 * scaleCompensation, height: 18 * scaleCompensation)
                .background(Circle().fill(highlightColor.opacity(0.95)))
                .shadow(color: .black.opacity(0.3), radius: 2 * scaleCompensation)
                .position(
                    x: frame.minX + 10 * scaleCompensation,
                    y: frame.minY + 10 * scaleCompensation
                )
                .allowsHitTesting(false)
            
            // Note indicator (top-right corner)
            if highlight.hasNote {
                Image(systemName: "text.bubble.fill")
                    .font(.system(size: 12 * scaleCompensation))
                    .foregroundStyle(.white)
                    .padding(3 * scaleCompensation)
                    .background(Circle().fill(highlightColor.opacity(0.9)))
                    .position(
                        x: frame.maxX + 4 * scaleCompensation,
                        y: frame.minY - 4 * scaleCompensation
                    )
                    .allowsHitTesting(false)
            }
        }
    }
    
    enum Corner: CaseIterable {
        case topLeft, topRight, bottomLeft, bottomRight
    }
    
    private func handlePosition(for corner: Corner) -> CGPoint {
        switch corner {
        case .topLeft: return CGPoint(x: frame.minX, y: frame.minY)
        case .topRight: return CGPoint(x: frame.maxX, y: frame.minY)
        case .bottomLeft: return CGPoint(x: frame.minX, y: frame.maxY)
        case .bottomRight: return CGPoint(x: frame.maxX, y: frame.maxY)
        }
    }
    
    private func updateRect(corner: Corner, translation: CGSize) {
        var newRect = initialRect
        
        switch corner {
        case .topLeft:
            newRect.origin.x += translation.width
            newRect.origin.y += translation.height
            newRect.size.width -= translation.width
            newRect.size.height -= translation.height
        case .topRight:
            newRect.origin.y += translation.height
            newRect.size.width += translation.width
            newRect.size.height -= translation.height
        case .bottomLeft:
            newRect.origin.x += translation.width
            newRect.size.width -= translation.width
            newRect.size.height += translation.height
        case .bottomRight:
            newRect.size.width += translation.width
            newRect.size.height += translation.height
        }
        
        // Ensure minimum size
        if newRect.width > 20 && newRect.height > 10 {
            currentRect = newRect
        }
    }
    
    private func saveRect() {
        guard currentRect != .zero else { return }
        
        let normalizedRect = CGRect(
            x: currentRect.origin.x / containerSize.width,
            y: currentRect.origin.y / containerSize.height,
            width: currentRect.width / containerSize.width,
            height: currentRect.height / containerSize.height
        )
        
        highlightsService.updateRect(for: highlight.id, rect: normalizedRect)
        
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        
        currentRect = .zero
        initialRect = .zero
    }
}
