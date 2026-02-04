/**
 * Curve Materialization Utilities
 * 
 * When a balloon has borderRadius > 0, it's rendered as a rounded rectangle
 * using Konva's native cornerRadius. However, for vertex editing, we need
 * explicit points and curve handles.
 * 
 * This module provides the function to "materialize" a rounded rect into
 * explicit vertex data that can be edited.
 */

import { Balloon } from '@shared/types';

export type Point = { x: number; y: number };
export type VertexHandle = {
    handleIn?: Point;
    handleOut?: Point;
};

/**
 * Magic number for bezier approximation of circular arc.
 * For a quarter circle, control points should be at distance k*r from endpoints.
 * k ≈ 0.5522847498 ≈ 4/3 * (√2 - 1)
 */
const BEZIER_CIRCLE_CONSTANT = 0.552;

/**
 * Generate 4 corner points for a rectangle (with or without rounded corners).
 * Points are in ABSOLUTE coordinates.
 * 
 * Layout (4 corners):
 *     0 -------- 1
 *     |          |
 *     |          |
 *     3 -------- 2
 */
export function generateRoundedRectPoints(
    box_2d: number[], // [ymin, xmin, ymax, xmax]
    _borderRadius: number // Not used - points are just corners, handles define curves
): Point[] {
    const [ymin, xmin, ymax, xmax] = box_2d;

    // Just 4 corner points - handles will define the curves
    return [
        { x: xmin, y: ymin },  // 0 - top-left
        { x: xmax, y: ymin },  // 1 - top-right
        { x: xmax, y: ymax },  // 2 - bottom-right
        { x: xmin, y: ymax }   // 3 - bottom-left
    ];
}

/**
 * Generate vertex handles for a rounded rectangle with 4 corners.
 * These handles create cubic bezier curves that approximate circular corners.
 * Handles are in ABSOLUTE coordinates.
 * 
 * For cubic bezier approximation of rounded corners:
 * - Each corner point has both handleIn and handleOut
 * - handleIn controls the incoming edge (makes it curve)
 * - handleOut controls the outgoing edge (makes it curve)
 * 
 * Point order (4 corners):
 *     0 -------- 1
 *     |          |
 *     |          |
 *     3 -------- 2
 * 
 * Edges:
 * - 0→1: top (horizontal)
 * - 1→2: right (vertical) 
 * - 2→3: bottom (horizontal)
 * - 3→0: left (vertical) - closing edge
 */
export function generateRoundedRectHandles(
    box_2d: number[], // [ymin, xmin, ymax, xmax]
    borderRadius: number
): VertexHandle[] {
    const [ymin, xmin, ymax, xmax] = box_2d;
    const width = xmax - xmin;
    const height = ymax - ymin;

    // Clamp radius to half of smallest dimension
    const r = Math.min(borderRadius, width / 2, height / 2);
    const k = r * BEZIER_CIRCLE_CONSTANT;

    // For 4 corners, each corner needs handles to curve both adjacent edges
    return [
        // Point 0 (xmin, ymin): top-left corner
        // handleIn: from left edge (edge 3→0, going UP), so tangent is vertical going DOWN
        // handleOut: to top edge (edge 0→1, going RIGHT), so tangent is horizontal going RIGHT
        {
            handleIn: { x: xmin, y: ymin + k },      // Pull from below
            handleOut: { x: xmin + k, y: ymin }     // Push to right
        },

        // Point 1 (xmax, ymin): top-right corner
        // handleIn: from top edge (edge 0→1, going RIGHT), so tangent is horizontal going LEFT
        // handleOut: to right edge (edge 1→2, going DOWN), so tangent is vertical going DOWN
        {
            handleIn: { x: xmax - k, y: ymin },     // Pull from left
            handleOut: { x: xmax, y: ymin + k }     // Push down
        },

        // Point 2 (xmax, ymax): bottom-right corner
        // handleIn: from right edge (edge 1→2, going DOWN), so tangent is vertical going UP
        // handleOut: to bottom edge (edge 2→3, going LEFT), so tangent is horizontal going LEFT
        {
            handleIn: { x: xmax, y: ymax - k },     // Pull from above
            handleOut: { x: xmax - k, y: ymax }     // Push to left
        },

        // Point 3 (xmin, ymax): bottom-left corner
        // handleIn: from bottom edge (edge 2→3, going LEFT), so tangent is horizontal going RIGHT
        // handleOut: to left edge (edge 3→0, going UP), so tangent is vertical going UP
        {
            handleIn: { x: xmin + k, y: ymax },     // Pull from right
            handleOut: { x: xmin, y: ymax - k }     // Push up
        }
    ];
}

/**
 * Materialize a balloon with borderRadius into explicit points and handles.
 * This is a one-way conversion - the balloon becomes a freeform polygon.
 * 
 * Returns partial balloon data to merge, or empty object if no conversion needed.
 */
export function materializeRoundedRect(balloon: Balloon): Partial<Balloon> {
    const r = balloon.borderRadius || 0;

    // Skip if:
    // - No borderRadius to materialize
    // - Already has explicit points (already materialized)
    if (r === 0 || (balloon.points && balloon.points.length > 0)) {
        return {};
    }

    const points = generateRoundedRectPoints(balloon.box_2d, r);
    const vertexHandles = generateRoundedRectHandles(balloon.box_2d, r);

    return {
        points,
        vertexHandles,
        borderRadius: 0 // No longer needed - curves are explicit now
    };
}

/**
 * Check if a balloon needs materialization before vertex editing.
 */
export function needsMaterialization(balloon: Balloon): boolean {
    const r = balloon.borderRadius || 0;
    return r > 0 && (!balloon.points || balloon.points.length === 0);
}
