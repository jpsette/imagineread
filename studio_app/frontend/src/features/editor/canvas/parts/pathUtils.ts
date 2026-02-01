/**
 * Utility functions for SVG path generation and edge calculations
 * Used by BalloonVertexEditor for vertex and curve editing
 */

export type Point = { x: number; y: number };
export type ControlPoint = Point | null;

/**
 * Generate SVG path data with quadratic bezier curves
 */
export const generatePathData = (
    points: Point[],
    controlPoints: ControlPoint[]
): string => {
    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length; i++) {
        const nextI = (i + 1) % points.length;
        const p2 = points[nextI];
        const cp = controlPoints[i];

        if (cp) {
            // Quadratic bezier curve
            d += ` Q ${cp.x} ${cp.y} ${p2.x} ${p2.y}`;
        } else {
            // Straight line
            d += ` L ${p2.x} ${p2.y}`;
        }
    }

    d += ' Z';
    return d;
};

// Type for vertex handles (cubic bezier)
export type VertexHandle = {
    handleIn?: Point;
    handleOut?: Point;
};

/**
 * Generate SVG path data with CUBIC bezier curves (using vertex handles)
 * Uses C command: C c1x c1y, c2x c2y, ex ey
 */
export const generateCubicPathData = (
    points: Point[],
    vertexHandles: VertexHandle[],
    minX: number = 0,
    minY: number = 0
): string => {
    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length; i++) {
        const nextI = (i + 1) % points.length;
        const p2 = points[nextI];

        // Get handles for this edge
        const handleOut = vertexHandles[i]?.handleOut;
        const handleIn = vertexHandles[nextI]?.handleIn;

        // Convert to relative if absolute handles provided
        const c1 = handleOut
            ? { x: handleOut.x - minX, y: handleOut.y - minY }
            : null;
        const c2 = handleIn
            ? { x: handleIn.x - minX, y: handleIn.y - minY }
            : null;

        if (c1 && c2) {
            // Full cubic bezier curve
            d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
        } else if (c1) {
            // Only outgoing handle - use quadratic approximation
            d += ` Q ${c1.x} ${c1.y}, ${p2.x} ${p2.y}`;
        } else if (c2) {
            // Only incoming handle - use quadratic approximation
            d += ` Q ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
        } else {
            // Straight line
            d += ` L ${p2.x} ${p2.y}`;
        }
    }

    d += ' Z';
    return d;
};

/**
 * Find the closest edge to a given position
 * Returns edge index and distance, or -1 if not found
 */
export const findClosestEdge = (
    points: Point[],
    pos: { x: number; y: number }
): { index: number; distance: number } => {
    let minDist = Infinity;
    let closestEdge = -1;

    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        const l2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
        if (l2 === 0) continue;

        let t = ((pos.x - p1.x) * (p2.x - p1.x) + (pos.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));

        const projX = p1.x + t * (p2.x - p1.x);
        const projY = p1.y + t * (p2.y - p1.y);
        const dist = Math.sqrt((pos.x - projX) ** 2 + (pos.y - projY) ** 2);

        if (dist < minDist) {
            minDist = dist;
            closestEdge = i;
        }
    }

    return { index: closestEdge, distance: minDist };
};
