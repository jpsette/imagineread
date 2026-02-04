/**
 * VectorRenderer.tsx
 * 
 * Pure rendering component for VectorShape.
 * No editing logic - just draws the shape using Konva.
 * 
 * Memoized to prevent unnecessary re-renders.
 */

import React, { useMemo } from 'react';
import { Path, Rect, Group } from 'react-konva';
import { VectorShape, VectorStyle } from './vectorTypes';
import { generateShapeSVGPath } from './vectorMath';

// =============================================================================
// TYPES
// =============================================================================

export interface VectorRendererProps {
    /** The vector shape to render */
    shape: VectorShape;

    /** Whether the shape is selected (shows selection border) */
    isSelected?: boolean;

    /** Whether the shape is visible */
    visible?: boolean;

    /** Optional style overrides */
    styleOverrides?: Partial<VectorStyle>;

    /** Callback when shape is clicked */
    onClick?: (e: any) => void;

    /** Callback when shape is double-clicked */
    onDblClick?: (e: any) => void;

    /** Callback for drag start */
    onDragStart?: (e: any) => void;

    /** Callback for drag move */
    onDragMove?: (e: any) => void;

    /** Callback for drag end */
    onDragEnd?: (e: any) => void;

    /** Whether the shape is draggable */
    draggable?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get dash array from stroke style
 */
const getDashArray = (style: VectorStyle): number[] | undefined => {
    if (!style.strokeStyle || style.strokeStyle === 'solid') {
        return undefined;
    }

    const sw = style.strokeWidth ?? 1;

    if (style.strokeStyle === 'dashed') {
        const size = style.dashSize ?? sw * 4;
        const gap = style.dashGap ?? sw * 2;
        return [size, gap];
    }

    if (style.strokeStyle === 'dotted') {
        const size = style.dashSize ?? sw;
        const gap = style.dashGap ?? sw;
        return [size, gap];
    }

    return undefined;
};

/**
 * Calculate stroke offset based on alignment
 */
const getStrokeOffset = (style: VectorStyle): number => {
    const sw = style.strokeWidth ?? 1;

    switch (style.strokeAlign) {
        case 'inner':
            return sw / 2;
        case 'outer':
            return -sw / 2;
        default:
            return 0;
    }
};

// =============================================================================
// COMPONENT
// =============================================================================

const VectorRendererComponent: React.FC<VectorRendererProps> = ({
    shape,
    isSelected = false,
    visible = true,
    styleOverrides,
    onClick,
    onDblClick,
    onDragStart,
    onDragMove,
    onDragEnd,
    draggable = false
}) => {
    // Don't render if not visible
    if (!visible) return null;

    // Merge styles
    const style: VectorStyle = useMemo(() => ({
        ...shape.style,
        ...styleOverrides
    }), [shape.style, styleOverrides]);

    // Generate SVG path data
    const pathData = useMemo(() => {
        return generateShapeSVGPath(shape);
    }, [shape]);

    // Calculate stroke offset for inner/outer alignment
    const strokeOffset = useMemo(() => getStrokeOffset(style), [style]);

    // Get dash array
    const dashArray = useMemo(() => getDashArray(style), [style]);

    // Common props for the path
    const pathProps = useMemo(() => ({
        data: pathData,
        fill: style.fill || '#ffffff',
        stroke: style.stroke || '#000000',
        strokeWidth: style.strokeWidth ?? 1,
        dash: dashArray,
        opacity: style.opacity ?? 1,
        perfectDrawEnabled: false,
        shadowForStrokeEnabled: false,
        listening: true,

        // Offset for stroke alignment
        x: strokeOffset,
        y: strokeOffset
    }), [pathData, style, dashArray, strokeOffset]);

    return (
        <Group
            x={shape.bounds.x}
            y={shape.bounds.y}
            width={shape.bounds.width}
            height={shape.bounds.height}
            draggable={draggable}
            onClick={onClick}
            onDblClick={onDblClick}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
        >
            {/* Main shape path */}
            <Path {...pathProps} />

            {/* Selection border */}
            {isSelected && (
                <Rect
                    x={0}
                    y={0}
                    width={shape.bounds.width}
                    height={shape.bounds.height}
                    stroke="#007AFF"
                    strokeWidth={2}
                    fill="transparent"
                    listening={false}
                    dash={[5, 3]}
                />
            )}
        </Group>
    );
};

// =============================================================================
// MEMOIZED EXPORT
// =============================================================================

/**
 * Memoized vector renderer.
 * Only re-renders when shape, selection state, or visibility changes.
 */
export const VectorRenderer = React.memo(VectorRendererComponent, (prev, next) => {
    // Custom comparison for better performance
    return (
        prev.shape === next.shape &&
        prev.isSelected === next.isSelected &&
        prev.visible === next.visible &&
        prev.draggable === next.draggable &&
        prev.styleOverrides === next.styleOverrides
        // Note: We don't compare callbacks since they're typically stable
    );
});

// =============================================================================
// SIMPLIFIED VERSION (for LOD)
// =============================================================================

export interface SimplifiedVectorRendererProps {
    shape: VectorShape;
    visible?: boolean;
}

/**
 * Simplified renderer for distant/zoomed-out views.
 * Uses a simple rectangle instead of the full path for better performance.
 */
const SimplifiedVectorRendererComponent: React.FC<SimplifiedVectorRendererProps> = ({
    shape,
    visible = true
}) => {
    if (!visible) return null;

    return (
        <Rect
            x={shape.bounds.x}
            y={shape.bounds.y}
            width={shape.bounds.width}
            height={shape.bounds.height}
            fill={shape.style.fill || '#ffffff'}
            stroke={shape.style.stroke || '#000000'}
            strokeWidth={1}
            perfectDrawEnabled={false}
            listening={false}
        />
    );
};

export const SimplifiedVectorRenderer = React.memo(SimplifiedVectorRendererComponent);
