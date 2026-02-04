/**
 * BalloonVectorAdapter.tsx
 * 
 * Adapter component that bridges the legacy Balloon system with the new VectorShape system.
 * 
 * This allows gradual migration without breaking existing functionality.
 */

import React, { useMemo, useCallback } from 'react';
import { Balloon } from '@shared/types';
import { VectorShape } from './vectorTypes';
import { legacyBalloonToVectorShape, vectorShapeToLegacyBalloon } from './vectorSerializer';
import { VectorEditor } from './VectorEditor';
import { VectorRenderer } from './VectorRenderer';

// =============================================================================
// TYPES
// =============================================================================

export interface BalloonVectorAdapterProps {
    /** The balloon to edit/render */
    balloon: Balloon;

    /** Width override (from BalloonShape) */
    width: number;

    /** Height override (from BalloonShape) */
    height: number;

    /** Whether the balloon is selected */
    isSelected?: boolean;

    /** Whether editing mode is active */
    isEditing?: boolean;

    /** Whether curve editing is enabled */
    curveEditingEnabled?: boolean;

    /** Callback when balloon changes */
    onChange: (newAttrs: Partial<Balloon>) => void;

    /** Callback for vertex selection */
    onVertexSelect?: (vertexIndex: number | null) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

const BalloonVectorAdapterComponent: React.FC<BalloonVectorAdapterProps> = ({
    balloon,
    width,
    height,
    isSelected = false,
    isEditing = false,
    curveEditingEnabled = false,
    onChange,
    onVertexSelect
}) => {
    // ==========================================================================
    // CONVERT BALLOON TO VECTOR SHAPE
    // ==========================================================================

    // Box offset for converting between relative and absolute coords
    const minX = balloon.box_2d[1];
    const minY = balloon.box_2d[0];

    const vectorShape = useMemo((): VectorShape => {
        // Use RELATIVE bounds (0,0 to width,height) for the Group context
        // The Group is already positioned at the balloon's absolute position
        const relativeBounds = {
            x: 0,
            y: 0,
            width,
            height
        };

        // Convert balloon points to relative coordinates if they exist
        const relativePoints = balloon.points?.map(p => ({
            x: p.x - minX,
            y: p.y - minY
        }));

        // Create a temporary balloon with relative coordinates for conversion
        const tempBalloon = {
            ...balloon,
            box_2d: [0, 0, height, width] as [number, number, number, number],
            points: relativePoints
        };

        const shape = legacyBalloonToVectorShape(tempBalloon as any);

        // Override bounds to use relative coordinates
        return {
            ...shape,
            bounds: relativeBounds
        };
    }, [balloon, width, height, minX, minY]);

    // ==========================================================================
    // HANDLE SHAPE CHANGES
    // ==========================================================================

    const handleShapeChange = useCallback((newShape: VectorShape) => {
        // Convert back to Balloon format
        const legacyBalloon = vectorShapeToLegacyBalloon(newShape);

        // Convert relative points back to absolute coordinates
        const absolutePoints = legacyBalloon.points?.map(p => ({
            x: p.x + minX,
            y: p.y + minY
        }));

        // Convert relative handles back to absolute coordinates
        const absoluteVertexHandles = legacyBalloon.vertexHandles?.map(vh => ({
            handleIn: vh.handleIn ? { x: vh.handleIn.x + minX, y: vh.handleIn.y + minY } : undefined,
            handleOut: vh.handleOut ? { x: vh.handleOut.x + minX, y: vh.handleOut.y + minY } : undefined
        }));

        // Only pass the changed properties
        onChange({
            points: absolutePoints,
            vertexHandles: absoluteVertexHandles,
            curveControlPoints: undefined // We now use vertexHandles for curves
        });
    }, [onChange, minX, minY]);

    // ==========================================================================
    // HANDLE VERTEX SELECTION
    // ==========================================================================

    const handleVertexSelect = useCallback((_pathIndex: number, vertexIndex: number | null) => {
        onVertexSelect?.(vertexIndex);
    }, [onVertexSelect]);

    // ==========================================================================
    // RENDER
    // ==========================================================================

    if (isEditing) {
        return (
            <VectorEditor
                shape={vectorShape}
                mode={curveEditingEnabled ? 'curvature' : 'select'}
                onChange={handleShapeChange}
                onVertexSelect={handleVertexSelect}
                showHandles={curveEditingEnabled}
                showPath={true}
                vertexSize={8}
                handleSize={6}
            />
        );
    }

    // Just render the shape (no editing)
    return (
        <VectorRenderer
            shape={vectorShape}
            isSelected={isSelected}
            visible={true}
        />
    );
};

// =============================================================================
// MEMOIZED EXPORT
// =============================================================================

export const BalloonVectorAdapter = React.memo(BalloonVectorAdapterComponent);

// =============================================================================
// HOOK FOR STANDALONE USE
// =============================================================================

/**
 * Hook to convert a Balloon to VectorShape for custom rendering.
 */
export function useBalloonAsVectorShape(balloon: Balloon): VectorShape {
    return useMemo(() => {
        return legacyBalloonToVectorShape(balloon as any);
    }, [balloon]);
}

/**
 * Hook to convert VectorShape changes back to Balloon format.
 */
export function useVectorShapeToBalloon(
    _shape: VectorShape,
    onChange: (attrs: Partial<Balloon>) => void
) {
    return useCallback((newShape: VectorShape) => {
        const legacyBalloon = vectorShapeToLegacyBalloon(newShape);
        onChange({
            points: legacyBalloon.points,
            vertexHandles: legacyBalloon.vertexHandles
        });
    }, [onChange]);
}
