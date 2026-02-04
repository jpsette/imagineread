import React, { useRef, useEffect, useCallback } from 'react';
import { Circle, Line, Group } from 'react-konva';
import { Balloon } from '@shared/types';

// =============================================================================
// TYPES
// =============================================================================

export type VertexType = 'corner' | 'smooth' | 'symmetric';

export type VertexHandle = {
    handleIn?: { x: number; y: number };
    handleOut?: { x: number; y: number };
    type?: VertexType;
};

interface BezierHandlesProps {
    balloon: Balloon;
    points: { x: number; y: number }[];
    minX: number;
    minY: number;
    selectedVertexIndex: number;
    onVertexSelect: (index: number | null) => void;
    onChange: (newAttrs: Partial<Balloon>) => void;
}

// =============================================================================
// CONSTANTS - Professional Figma-like design (matching vertex squares)
// =============================================================================

const HANDLE_RADIUS = 3;                 // Smaller circles to match 6px vertex squares
const HANDLE_FILL = '#3b82f6';           // Blue fill (matching vertex color)
const HANDLE_FILL_GHOST = '#3b82f640';   // Semi-transparent for ghost
const HANDLE_STROKE = '#ffffff';         // White stroke (like selected vertex)
const HANDLE_STROKE_GHOST = '#ffffff60'; // Semi-transparent white for ghost
const HANDLE_STROKE_WIDTH = 1;
const LINE_STROKE = '#3b82f6';           // Blue line (matching vertex color)
const LINE_STROKE_GHOST = '#3b82f640';   // Semi-transparent for ghost
const LINE_STROKE_WIDTH = 0.5;           // Thinner line

// Bezier approximation constant for circular arcs (≈ 0.5523)
const BEZIER_K = 0.5523;

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Professional Bézier curve handles (Figma/Illustrator style)
 * 
 * Features:
 * - Ghost handles appear when vertex is selected (shows where handles WOULD be)
 * - Dragging ghost handle creates real handle
 * - Alt+drag breaks symmetry (corner mode)
 * - Shift+drag constrains to 45° (TODO)
 * 
 * Handle positions:
 * - HandleIn: Controls curve entering the vertex (from previous point)
 * - HandleOut: Controls curve leaving the vertex (to next point)
 */
export const BezierHandles: React.FC<BezierHandlesProps> = ({
    balloon,
    points,
    minX,
    minY,
    selectedVertexIndex,
    onChange
}) => {
    // Get handles from balloon, or initialize empty array
    const vertexHandles: VertexHandle[] = balloon.vertexHandles || points.map(() => ({}));

    // Local ref for dragging (avoids re-renders during drag)
    const currentHandlesRef = useRef<VertexHandle[]>(vertexHandles);
    const isAltPressedRef = useRef(false);

    useEffect(() => {
        currentHandlesRef.current = vertexHandles;
    }, [vertexHandles]);

    // Track Alt key for breaking symmetry
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Alt') isAltPressedRef.current = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt') isAltPressedRef.current = false;
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Get current vertex info
    const vertex = points[selectedVertexIndex];
    if (!vertex) return null;

    const vh = vertexHandles[selectedVertexIndex] || {};

    // Calculate default handle positions (30% of the way to adjacent vertices)
    const getDefaultHandlePosition = (handleType: 'handleIn' | 'handleOut') => {
        const prevVertex = points[(selectedVertexIndex - 1 + points.length) % points.length];
        const nextVertex = points[(selectedVertexIndex + 1) % points.length];

        if (handleType === 'handleIn') {
            // 30% towards previous vertex
            return {
                x: vertex.x + (prevVertex.x - vertex.x) * 0.3,
                y: vertex.y + (prevVertex.y - vertex.y) * 0.3
            };
        } else {
            // 30% towards next vertex
            return {
                x: vertex.x + (nextVertex.x - vertex.x) * 0.3,
                y: vertex.y + (nextVertex.y - vertex.y) * 0.3
            };
        }
    };

    // Convert from absolute to relative coordinates
    const toRelative = (absPos: { x: number; y: number }) => ({
        x: absPos.x - minX,
        y: absPos.y - minY
    });

    // Get handle positions
    const handleInAbs = vh.handleIn;
    const handleOutAbs = vh.handleOut;

    // Real handles (if they exist)
    const handleInReal = handleInAbs ? toRelative(handleInAbs) : null;
    const handleOutReal = handleOutAbs ? toRelative(handleOutAbs) : null;

    // Ghost handles (default positions, shown when no real handle)
    const handleInGhost = getDefaultHandlePosition('handleIn');
    const handleOutGhost = getDefaultHandlePosition('handleOut');

    // Handle drag move - creates real handle from ghost if needed
    const handleDragMove = useCallback((handleType: 'handleIn' | 'handleOut', e: any) => {
        e.cancelBubble = true;
        const node = e.target;
        const newHandles = [...currentHandlesRef.current];

        // Ensure we have an entry for this vertex
        while (newHandles.length <= selectedVertexIndex) {
            newHandles.push({});
        }
        if (!newHandles[selectedVertexIndex]) {
            newHandles[selectedVertexIndex] = { type: 'smooth' };
        }

        const currentVh = newHandles[selectedVertexIndex];
        const newType = isAltPressedRef.current ? 'corner' : (currentVh.type || 'smooth');

        // Get new position (Circle uses center coordinates)
        const newX = node.x();
        const newY = node.y();

        // New handle position (convert to absolute)
        const newPos = { x: minX + newX, y: minY + newY };

        // Calculate offset from vertex (for mirroring)
        const dx = newX - vertex.x;
        const dy = newY - vertex.y;

        // Apply handle
        newHandles[selectedVertexIndex] = {
            ...currentVh,
            type: newType,
            [handleType]: newPos
        };

        // Apply symmetry rules only for smooth/symmetric types (not corner)
        if (newType === 'symmetric') {
            // Symmetric: both handles same length, opposite direction
            const opposite = handleType === 'handleIn' ? 'handleOut' : 'handleIn';
            newHandles[selectedVertexIndex][opposite] = {
                x: minX + vertex.x - dx,
                y: minY + vertex.y - dy
            };
        } else if (newType === 'smooth') {
            // Smooth: opposite handle maintains its length but follows direction
            const opposite = handleType === 'handleIn' ? 'handleOut' : 'handleIn';
            const existingOpposite = currentVh[opposite];

            if (existingOpposite) {
                const existingDx = existingOpposite.x - (minX + vertex.x);
                const existingDy = existingOpposite.y - (minY + vertex.y);
                const existingLength = Math.sqrt(existingDx * existingDx + existingDy * existingDy);
                const newLength = Math.sqrt(dx * dx + dy * dy);

                if (newLength > 0) {
                    const scale = existingLength / newLength;
                    newHandles[selectedVertexIndex][opposite] = {
                        x: minX + vertex.x - dx * scale,
                        y: minY + vertex.y - dy * scale
                    };
                }
            }
        }
        // For 'corner' type, we don't update the opposite handle

        currentHandlesRef.current = newHandles;

        // UPDATE IN REAL-TIME - call onChange during drag for visual feedback
        // Also materialize points when handles are created (convert borderRadius to explicit polygon)
        const absolutePoints = points.map(p => ({ x: p.x + minX, y: p.y + minY }));

        // Generate handles for curved corners if this is a rounded rect (8 points)
        // This preserves the original curves from borderRadius
        let finalHandles = newHandles;
        if (points.length === 8 && balloon.borderRadius && balloon.borderRadius > 0) {
            const r = balloon.borderRadius;
            const width = balloon.box_2d[3] - balloon.box_2d[1];
            const height = balloon.box_2d[2] - balloon.box_2d[0];
            const clampedR = Math.min(r, width / 2, height / 2);
            const k = clampedR * BEZIER_K;

            // Generate handles for the 8-point rounded rect to preserve curves
            // Points are: 0(r,0), 1(w-r,0), 2(w,r), 3(w,h-r), 4(w-r,h), 5(r,h), 6(0,h-r), 7(0,r)
            // Curves are at corners: 1→2 (top-right), 3→4 (bottom-right), 5→6 (bottom-left), 7→0 (top-left)
            const curveHandles: VertexHandle[] = [
                { handleIn: { x: minX + clampedR - k, y: minY } },  // 0: handleIn from 7→0 curve
                { handleOut: { x: minX + width - clampedR + k, y: minY } },  // 1: handleOut to 1→2 curve
                { handleIn: { x: minX + width, y: minY + clampedR - k } },  // 2: handleIn from 1→2 curve
                { handleOut: { x: minX + width, y: minY + height - clampedR + k } },  // 3: handleOut to 3→4 curve
                { handleIn: { x: minX + width - clampedR + k, y: minY + height } },  // 4: handleIn from 3→4 curve
                { handleOut: { x: minX + clampedR - k, y: minY + height } },  // 5: handleOut to 5→6 curve
                { handleIn: { x: minX, y: minY + height - clampedR + k } },  // 6: handleIn from 5→6 curve
                { handleOut: { x: minX, y: minY + clampedR - k } }  // 7: handleOut to 7→0 curve
            ];

            // Merge user's edited handles with the curve handles
            finalHandles = curveHandles.map((ch, i) => ({
                ...ch,
                ...newHandles[i]  // User's edits take priority
            }));
        }

        onChange({
            vertexHandles: finalHandles,
            points: absolutePoints,
            borderRadius: 0  // Clear borderRadius since we now have explicit curve control
        });
    }, [selectedVertexIndex, vertex, minX, minY, onChange, points, balloon]);

    // Commit changes on drag end (redundant now but kept for safety)
    const handleDragEnd = useCallback(() => {
        // Final commit is now done in handleDragMove, but we keep this for consistency
        onChange({ vertexHandles: currentHandlesRef.current });
    }, [onChange]);

    // Cursor handlers
    const handleMouseEnter = (e: any) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'crosshair';
    };

    const handleMouseLeave = (e: any) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'default';
    };

    // Render a handle (real or ghost)
    const renderHandle = (
        handleType: 'handleIn' | 'handleOut',
        position: { x: number; y: number },
        isReal: boolean
    ) => {
        const fill = isReal ? HANDLE_FILL : HANDLE_FILL_GHOST;
        const stroke = isReal ? HANDLE_STROKE : HANDLE_STROKE_GHOST;
        const lineStroke = isReal ? LINE_STROKE : LINE_STROKE_GHOST;

        return (
            <Group key={handleType}>
                {/* Line from vertex to handle */}
                <Line
                    points={[vertex.x, vertex.y, position.x, position.y]}
                    stroke={lineStroke}
                    strokeWidth={LINE_STROKE_WIDTH}
                    listening={false}
                />
                {/* Handle circle */}
                <Circle
                    x={position.x}
                    y={position.y}
                    radius={HANDLE_RADIUS}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={HANDLE_STROKE_WIDTH}
                    draggable
                    onDragMove={(e) => handleDragMove(handleType, e)}
                    onDragEnd={handleDragEnd}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            </Group>
        );
    };

    return (
        <Group>
            {/* HandleIn - use real if exists, else show ghost */}
            {renderHandle('handleIn', handleInReal || handleInGhost, !!handleInReal)}

            {/* HandleOut - use real if exists, else show ghost */}
            {renderHandle('handleOut', handleOutReal || handleOutGhost, !!handleOutReal)}
        </Group>
    );
};
