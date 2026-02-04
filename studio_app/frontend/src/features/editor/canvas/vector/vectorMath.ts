/**
 * vectorMath.ts
 * 
 * Pure mathematical functions for vector editing.
 * All functions are side-effect free and can be easily tested.
 */

import {
    AbsolutePoint,
    NormalizedPoint,
    Bounds,
    VertexNode,
    VectorPath,
    VectorShape
} from './vectorTypes';

// =============================================================================
// COORDINATE CONVERSION
// =============================================================================

/**
 * Convert absolute canvas coordinates to normalized (0-1) coordinates.
 */
export const normalizePoint = (
    abs: AbsolutePoint,
    bounds: Bounds
): NormalizedPoint => ({
    nx: bounds.width === 0 ? 0 : (abs.x - bounds.x) / bounds.width,
    ny: bounds.height === 0 ? 0 : (abs.y - bounds.y) / bounds.height
});

/**
 * Convert normalized (0-1) coordinates to absolute canvas coordinates.
 */
export const denormalizePoint = (
    norm: NormalizedPoint,
    bounds: Bounds
): AbsolutePoint => ({
    x: bounds.x + norm.nx * bounds.width,
    y: bounds.y + norm.ny * bounds.height
});

/**
 * Convert a handle offset (relative to vertex) to absolute coordinates.
 */
export const handleToAbsolute = (
    vertexNorm: NormalizedPoint,
    handleOffset: NormalizedPoint | null,
    bounds: Bounds
): AbsolutePoint | null => {
    if (!handleOffset) return null;

    const absVertexPoint: NormalizedPoint = {
        nx: vertexNorm.nx + handleOffset.nx,
        ny: vertexNorm.ny + handleOffset.ny
    };
    return denormalizePoint(absVertexPoint, bounds);
};

/**
 * Convert absolute handle position to offset from vertex.
 */
export const absoluteToHandleOffset = (
    vertexAbs: AbsolutePoint,
    handleAbs: AbsolutePoint | null,
    bounds: Bounds
): NormalizedPoint | null => {
    if (!handleAbs) return null;

    const vertexNorm = normalizePoint(vertexAbs, bounds);
    const handleNorm = normalizePoint(handleAbs, bounds);

    return {
        nx: handleNorm.nx - vertexNorm.nx,
        ny: handleNorm.ny - vertexNorm.ny
    };
};

// =============================================================================
// BEZIER CALCULATIONS
// =============================================================================

/**
 * Evaluate a cubic Bezier curve at parameter t (0-1).
 * P0 = start, P1 = control1, P2 = control2, P3 = end
 */
export const cubicBezierPoint = (
    p0: AbsolutePoint,
    p1: AbsolutePoint,
    p2: AbsolutePoint,
    p3: AbsolutePoint,
    t: number
): AbsolutePoint => {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
        x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
        y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    };
};

/**
 * Evaluate derivative of cubic Bezier at parameter t.
 * Useful for finding tangent direction.
 */
export const cubicBezierTangent = (
    p0: AbsolutePoint,
    p1: AbsolutePoint,
    p2: AbsolutePoint,
    p3: AbsolutePoint,
    t: number
): AbsolutePoint => {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;

    return {
        x: 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x),
        y: 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y)
    };
};

// =============================================================================
// DISTANCE CALCULATIONS
// =============================================================================

/**
 * Distance between two points.
 */
export const distance = (a: AbsolutePoint, b: AbsolutePoint): number =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

/**
 * Distance from point to line segment.
 */
export const distanceToSegment = (
    point: AbsolutePoint,
    segStart: AbsolutePoint,
    segEnd: AbsolutePoint
): { distance: number; t: number } => {
    const l2 = (segStart.x - segEnd.x) ** 2 + (segStart.y - segEnd.y) ** 2;

    if (l2 === 0) {
        return { distance: distance(point, segStart), t: 0 };
    }

    let t = (
        (point.x - segStart.x) * (segEnd.x - segStart.x) +
        (point.y - segStart.y) * (segEnd.y - segStart.y)
    ) / l2;

    t = Math.max(0, Math.min(1, t));

    const proj: AbsolutePoint = {
        x: segStart.x + t * (segEnd.x - segStart.x),
        y: segStart.y + t * (segEnd.y - segStart.y)
    };

    return { distance: distance(point, proj), t };
};

/**
 * Approximate distance from point to cubic Bezier curve.
 * Uses subdivision for accuracy.
 */
export const distanceToCubicBezier = (
    point: AbsolutePoint,
    p0: AbsolutePoint,
    p1: AbsolutePoint,
    p2: AbsolutePoint,
    p3: AbsolutePoint,
    samples: number = 20
): { distance: number; t: number } => {
    let minDist = Infinity;
    let minT = 0;

    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const curvePoint = cubicBezierPoint(p0, p1, p2, p3, t);
        const d = distance(point, curvePoint);

        if (d < minDist) {
            minDist = d;
            minT = t;
        }
    }

    return { distance: minDist, t: minT };
};

// =============================================================================
// PATH OPERATIONS
// =============================================================================

/**
 * Find the nearest vertex to a given point.
 */
export const findNearestVertex = (
    point: AbsolutePoint,
    path: VectorPath,
    bounds: Bounds
): { index: number; distance: number } => {
    let minDist = Infinity;
    let minIndex = -1;

    path.nodes.forEach((node, i) => {
        const absPoint = denormalizePoint(node.point, bounds);
        const d = distance(point, absPoint);

        if (d < minDist) {
            minDist = d;
            minIndex = i;
        }
    });

    return { index: minIndex, distance: minDist };
};

/**
 * Find the nearest edge (segment between vertices) to a given point.
 * Returns edge index and parameter t along the edge.
 */
export const findNearestEdge = (
    point: AbsolutePoint,
    path: VectorPath,
    bounds: Bounds
): { index: number; distance: number; t: number } => {
    let minDist = Infinity;
    let minIndex = -1;
    let minT = 0;

    const nodeCount = path.nodes.length;
    const edgeCount = path.closed ? nodeCount : nodeCount - 1;

    for (let i = 0; i < edgeCount; i++) {
        const node1 = path.nodes[i];
        const node2 = path.nodes[(i + 1) % nodeCount];

        const p0 = denormalizePoint(node1.point, bounds);
        const p3 = denormalizePoint(node2.point, bounds);

        // Check if this edge has curves
        const hasHandles = node1.handleOut !== null || node2.handleIn !== null;

        let result: { distance: number; t: number };

        if (hasHandles) {
            // Cubic bezier edge
            const p1 = handleToAbsolute(node1.point, node1.handleOut, bounds) || p0;
            const p2 = handleToAbsolute(node2.point, node2.handleIn, bounds) || p3;
            result = distanceToCubicBezier(point, p0, p1, p2, p3);
        } else {
            // Straight line
            result = distanceToSegment(point, p0, p3);
        }

        if (result.distance < minDist) {
            minDist = result.distance;
            minIndex = i;
            minT = result.t;
        }
    }

    return { index: minIndex, distance: minDist, t: minT };
};

/**
 * Split an edge at parameter t, inserting a new vertex.
 * Returns a new path with the inserted vertex.
 */
export const splitEdgeAt = (
    path: VectorPath,
    edgeIndex: number,
    t: number,
    bounds: Bounds
): VectorPath => {
    const nodeCount = path.nodes.length;
    const node1 = path.nodes[edgeIndex];
    const node2 = path.nodes[(edgeIndex + 1) % nodeCount];

    const p0 = denormalizePoint(node1.point, bounds);
    const p3 = denormalizePoint(node2.point, bounds);

    // Calculate new point position
    let newPointAbs: AbsolutePoint;
    let newNode: VertexNode;

    const hasHandles = node1.handleOut !== null || node2.handleIn !== null;

    if (hasHandles) {
        // De Casteljau subdivision for cubic bezier
        const p1 = handleToAbsolute(node1.point, node1.handleOut, bounds) || p0;
        const p2 = handleToAbsolute(node2.point, node2.handleIn, bounds) || p3;

        newPointAbs = cubicBezierPoint(p0, p1, p2, p3, t);

        // For now, create a corner vertex at the split point
        // TODO: Calculate proper handle positions for smooth split
        newNode = {
            point: normalizePoint(newPointAbs, bounds),
            handleIn: null,
            handleOut: null,
            type: 'corner'
        };
    } else {
        // Linear interpolation
        newPointAbs = {
            x: p0.x + t * (p3.x - p0.x),
            y: p0.y + t * (p3.y - p0.y)
        };

        newNode = {
            point: normalizePoint(newPointAbs, bounds),
            handleIn: null,
            handleOut: null,
            type: 'corner'
        };
    }

    // Create new nodes array with inserted vertex
    const newNodes = [...path.nodes];
    newNodes.splice(edgeIndex + 1, 0, newNode);

    return {
        ...path,
        nodes: newNodes
    };
};

/**
 * Delete a vertex from a path.
 * Returns null if path would become invalid (< 2 vertices for open, < 3 for closed).
 */
export const deleteVertex = (
    path: VectorPath,
    vertexIndex: number
): VectorPath | null => {
    const minNodes = path.closed ? 3 : 2;

    if (path.nodes.length <= minNodes) {
        return null;
    }

    const newNodes = path.nodes.filter((_, i) => i !== vertexIndex);

    return {
        ...path,
        nodes: newNodes
    };
};

/**
 * Update a vertex's position.
 */
export const updateVertexPosition = (
    path: VectorPath,
    vertexIndex: number,
    newPosition: NormalizedPoint
): VectorPath => ({
    ...path,
    nodes: path.nodes.map((node, i) =>
        i === vertexIndex
            ? { ...node, point: newPosition }
            : node
    )
});

/**
 * Update a vertex's handle.
 */
export const updateVertexHandle = (
    path: VectorPath,
    vertexIndex: number,
    handleType: 'handleIn' | 'handleOut',
    newOffset: NormalizedPoint | null
): VectorPath => {
    const node = path.nodes[vertexIndex];
    let updatedNode = { ...node, [handleType]: newOffset };

    // Apply symmetry rules based on vertex type
    if (newOffset !== null) {
        if (node.type === 'symmetric') {
            // Mirror the handle
            const opposite = handleType === 'handleIn' ? 'handleOut' : 'handleIn';
            updatedNode[opposite] = { nx: -newOffset.nx, ny: -newOffset.ny };
        } else if (node.type === 'smooth') {
            // Keep direction but allow different length
            const opposite = handleType === 'handleIn' ? 'handleOut' : 'handleIn';
            const existingOpposite = node[opposite];

            if (existingOpposite) {
                // Calculate opposite direction from new handle
                const length = Math.sqrt(existingOpposite.nx ** 2 + existingOpposite.ny ** 2);
                const newLength = Math.sqrt(newOffset.nx ** 2 + newOffset.ny ** 2);

                if (newLength > 0) {
                    const scale = length / newLength;
                    updatedNode[opposite] = {
                        nx: -newOffset.nx * scale,
                        ny: -newOffset.ny * scale
                    };
                }
            }
        }
        // For 'corner', handles are independent - no mirroring
    }

    return {
        ...path,
        nodes: path.nodes.map((n, i) => i === vertexIndex ? updatedNode : n)
    };
};

// =============================================================================
// SVG PATH GENERATION
// =============================================================================

/**
 * Generate SVG path data (d attribute) from a VectorPath.
 * Uses cubic Bezier curves (C command) for all curved segments.
 */
export const generateSVGPath = (
    path: VectorPath,
    bounds: Bounds
): string => {
    if (path.nodes.length < 2) return '';

    const parts: string[] = [];

    // Move to first point
    const firstPoint = denormalizePoint(path.nodes[0].point, bounds);
    parts.push(`M ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`);

    const nodeCount = path.nodes.length;
    const edgeCount = path.closed ? nodeCount : nodeCount - 1;

    for (let i = 0; i < edgeCount; i++) {
        const node1 = path.nodes[i];
        const node2 = path.nodes[(i + 1) % nodeCount];

        const p0 = denormalizePoint(node1.point, bounds);
        const p3 = denormalizePoint(node2.point, bounds);

        const hasHandles = node1.handleOut !== null || node2.handleIn !== null;

        if (hasHandles) {
            // Cubic bezier
            const p1 = handleToAbsolute(node1.point, node1.handleOut, bounds) || p0;
            const p2 = handleToAbsolute(node2.point, node2.handleIn, bounds) || p3;

            parts.push(`C ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}, ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`);
        } else {
            // Straight line
            parts.push(`L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`);
        }
    }

    if (path.closed) {
        parts.push('Z');
    }

    return parts.join(' ');
};

/**
 * Generate SVG path data for an entire VectorShape (all paths).
 */
export const generateShapeSVGPath = (shape: VectorShape): string => {
    return shape.paths
        .map(path => generateSVGPath(path, shape.bounds))
        .join(' ');
};

// =============================================================================
// BOUNDS CALCULATIONS
// =============================================================================

/**
 * Recalculate bounds from path vertices.
 * Useful after transformations.
 */
export const calculatePathBounds = (
    path: VectorPath,
    currentBounds: Bounds
): Bounds => {
    if (path.nodes.length === 0) return currentBounds;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    path.nodes.forEach(node => {
        const abs = denormalizePoint(node.point, currentBounds);
        minX = Math.min(minX, abs.x);
        minY = Math.min(minY, abs.y);
        maxX = Math.max(maxX, abs.x);
        maxY = Math.max(maxY, abs.y);

        // Also consider handles for proper bounds
        if (node.handleIn) {
            const h = handleToAbsolute(node.point, node.handleIn, currentBounds);
            if (h) {
                minX = Math.min(minX, h.x);
                minY = Math.min(minY, h.y);
                maxX = Math.max(maxX, h.x);
                maxY = Math.max(maxY, h.y);
            }
        }
        if (node.handleOut) {
            const h = handleToAbsolute(node.point, node.handleOut, currentBounds);
            if (h) {
                minX = Math.min(minX, h.x);
                minY = Math.min(minY, h.y);
                maxX = Math.max(maxX, h.x);
                maxY = Math.max(maxY, h.y);
            }
        }
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};
