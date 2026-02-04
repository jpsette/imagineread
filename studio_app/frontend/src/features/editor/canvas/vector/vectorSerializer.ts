/**
 * vectorSerializer.ts
 * 
 * Serialization functions for vector data:
 * - VectorShape ↔ SVG path data
 * - Legacy Balloon ↔ VectorShape (migration)
 */

import {
    AbsolutePoint,
    NormalizedPoint,
    Bounds,
    VertexNode,
    VectorPath,
    VectorShape,
    VectorStyle,
    createVertex
} from './vectorTypes';

import {
    normalizePoint,
    denormalizePoint
} from './vectorMath';

// =============================================================================
// LEGACY BALLOON TYPE (for migration)
// =============================================================================

/** 
 * Legacy Balloon structure from existing codebase.
 * Used for migration purposes only.
 */
interface LegacyBalloon {
    id: string;
    type?: string;
    box_2d: [number, number, number, number]; // [y1, x1, y2, x2]
    points?: { x: number; y: number }[];
    curveControlPoints?: ({ x: number; y: number } | null)[];
    vertexHandles?: {
        handleIn?: { x: number; y: number };
        handleOut?: { x: number; y: number };
    }[];
    color?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    borderStyle?: string;
    strokeAlign?: 'center' | 'inner' | 'outer';
    dashSize?: number;
    dashGap?: number;
}

// =============================================================================
// SVG PARSING
// =============================================================================

/**
 * Parse SVG path data string into VectorPath structure.
 * 
 * Supports commands: M, L, C, Q, Z
 * Converts all curves to cubic bezier internally.
 */
export const parseSVGPath = (
    pathData: string,
    bounds: Bounds
): VectorPath | null => {
    if (!pathData || pathData.trim() === '') {
        return null;
    }

    const nodes: VertexNode[] = [];

    // Tokenize the path data
    const commands = pathData.match(/[A-Za-z][^A-Za-z]*/g);
    if (!commands) return null;

    let currentX = 0;
    let currentY = 0;
    let closed = false;

    for (const cmd of commands) {
        const type = cmd[0];
        const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

        switch (type.toUpperCase()) {
            case 'M': {
                // Move to
                const isRelative = type === 'm';
                currentX = isRelative ? currentX + args[0] : args[0];
                currentY = isRelative ? currentY + args[1] : args[1];

                nodes.push(createVertex(
                    ...normalizePointTuple({ x: currentX, y: currentY }, bounds)
                ));
                break;
            }

            case 'L': {
                // Line to
                const isRelative = type === 'l';
                currentX = isRelative ? currentX + args[0] : args[0];
                currentY = isRelative ? currentY + args[1] : args[1];

                nodes.push(createVertex(
                    ...normalizePointTuple({ x: currentX, y: currentY }, bounds)
                ));
                break;
            }

            case 'H': {
                // Horizontal line
                const isRelative = type === 'h';
                currentX = isRelative ? currentX + args[0] : args[0];

                nodes.push(createVertex(
                    ...normalizePointTuple({ x: currentX, y: currentY }, bounds)
                ));
                break;
            }

            case 'V': {
                // Vertical line
                const isRelative = type === 'v';
                currentY = isRelative ? currentY + args[0] : args[0];

                nodes.push(createVertex(
                    ...normalizePointTuple({ x: currentX, y: currentY }, bounds)
                ));
                break;
            }

            case 'C': {
                // Cubic bezier: C x1 y1, x2 y2, x y
                const isRelative = type === 'c';

                const cp1x = isRelative ? currentX + args[0] : args[0];
                const cp1y = isRelative ? currentY + args[1] : args[1];
                const cp2x = isRelative ? currentX + args[2] : args[2];
                const cp2y = isRelative ? currentY + args[3] : args[3];
                const endX = isRelative ? currentX + args[4] : args[4];
                const endY = isRelative ? currentY + args[5] : args[5];

                // Add handle to previous node (handleOut)
                if (nodes.length > 0) {
                    const prevNode = nodes[nodes.length - 1];
                    const cpNorm = normalizePoint({ x: cp1x, y: cp1y }, bounds);
                    prevNode.handleOut = {
                        nx: cpNorm.nx - prevNode.point.nx,
                        ny: cpNorm.ny - prevNode.point.ny
                    };
                }

                // Create new node with handleIn
                const endNorm = normalizePoint({ x: endX, y: endY }, bounds);
                const cp2Norm = normalizePoint({ x: cp2x, y: cp2y }, bounds);

                nodes.push({
                    point: endNorm,
                    handleIn: {
                        nx: cp2Norm.nx - endNorm.nx,
                        ny: cp2Norm.ny - endNorm.ny
                    },
                    handleOut: null,
                    type: 'smooth'
                });

                currentX = endX;
                currentY = endY;
                break;
            }

            case 'Q': {
                // Quadratic bezier: Q x1 y1, x y
                // Convert to cubic approximation
                const isRelative = type === 'q';

                const cpX = isRelative ? currentX + args[0] : args[0];
                const cpY = isRelative ? currentY + args[1] : args[1];
                const endX = isRelative ? currentX + args[2] : args[2];
                const endY = isRelative ? currentY + args[3] : args[3];

                // Convert Q to C: cp1 = start + 2/3*(cp - start), cp2 = end + 2/3*(cp - end)
                const cp1x = currentX + (2 / 3) * (cpX - currentX);
                const cp1y = currentY + (2 / 3) * (cpY - currentY);
                const cp2x = endX + (2 / 3) * (cpX - endX);
                const cp2y = endY + (2 / 3) * (cpY - endY);

                // Add handle to previous node
                if (nodes.length > 0) {
                    const prevNode = nodes[nodes.length - 1];
                    const cpNorm = normalizePoint({ x: cp1x, y: cp1y }, bounds);
                    prevNode.handleOut = {
                        nx: cpNorm.nx - prevNode.point.nx,
                        ny: cpNorm.ny - prevNode.point.ny
                    };
                }

                // Create new node
                const endNorm = normalizePoint({ x: endX, y: endY }, bounds);
                const cp2Norm = normalizePoint({ x: cp2x, y: cp2y }, bounds);

                nodes.push({
                    point: endNorm,
                    handleIn: {
                        nx: cp2Norm.nx - endNorm.nx,
                        ny: cp2Norm.ny - endNorm.ny
                    },
                    handleOut: null,
                    type: 'smooth'
                });

                currentX = endX;
                currentY = endY;
                break;
            }

            case 'Z': {
                closed = true;
                break;
            }
        }
    }

    // If closed, check if we need to merge first/last nodes
    if (closed && nodes.length > 1) {
        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        const dist = Math.hypot(
            first.point.nx - last.point.nx,
            first.point.ny - last.point.ny
        );

        // If last point is very close to first, merge them
        if (dist < 0.001) {
            first.handleIn = last.handleIn;
            nodes.pop();
        }
    }

    return {
        id: `path-${Date.now()}`,
        closed,
        nodes
    };
};

// Helper to normalize and return as tuple
const normalizePointTuple = (
    abs: AbsolutePoint,
    bounds: Bounds
): [number, number] => {
    const norm = normalizePoint(abs, bounds);
    return [norm.nx, norm.ny];
};

// =============================================================================
// LEGACY BALLOON MIGRATION
// =============================================================================

/**
 * Convert a legacy Balloon to VectorShape.
 * 
 * Handles:
 * - box_2d → bounds
 * - points → VectorPath nodes (if available)
 * - curveControlPoints → converted to handleIn/handleOut
 * - vertexHandles → directly mapped
 * - style properties → VectorStyle
 */
export const legacyBalloonToVectorShape = (balloon: LegacyBalloon): VectorShape => {
    // Extract bounds from box_2d [y1, x1, y2, x2]
    const bounds: Bounds = {
        x: balloon.box_2d[1],
        y: balloon.box_2d[0],
        width: balloon.box_2d[3] - balloon.box_2d[1],
        height: balloon.box_2d[2] - balloon.box_2d[0]
    };

    // Create nodes from points or generate rectangle
    let nodes: VertexNode[];

    if (balloon.points && balloon.points.length > 2) {
        // Has explicit points
        nodes = balloon.points.map((pt, i) => {
            const norm = normalizePoint(pt, bounds);

            let handleIn: NormalizedPoint | null = null;
            let handleOut: NormalizedPoint | null = null;

            // Check for vertexHandles (cubic bezier system)
            if (balloon.vertexHandles && balloon.vertexHandles[i]) {
                const vh = balloon.vertexHandles[i];
                if (vh.handleIn) {
                    const absHandle = vh.handleIn;
                    const normHandle = normalizePoint(absHandle, bounds);
                    handleIn = {
                        nx: normHandle.nx - norm.nx,
                        ny: normHandle.ny - norm.ny
                    };
                }
                if (vh.handleOut) {
                    const absHandle = vh.handleOut;
                    const normHandle = normalizePoint(absHandle, bounds);
                    handleOut = {
                        nx: normHandle.nx - norm.nx,
                        ny: normHandle.ny - norm.ny
                    };
                }
            }

            // Check for curveControlPoints (quadratic bezier system)
            // Convert Q → C approximation
            if (!handleOut && balloon.curveControlPoints && balloon.curveControlPoints[i]) {
                const cp = balloon.curveControlPoints[i]!;

                // Q control point → approximate C control points
                const cpNorm = normalizePoint(cp, bounds);
                handleOut = {
                    nx: (2 / 3) * (cpNorm.nx - norm.nx),
                    ny: (2 / 3) * (cpNorm.ny - norm.ny)
                };

                // Set handleIn on next node
                // (This is approximate, proper conversion would need iteration)
            }

            return {
                point: norm,
                handleIn,
                handleOut,
                type: (handleIn || handleOut) ? 'smooth' as const : 'corner' as const
            };
        });
    } else {
        // Generate rectangle with optional corner radius
        const r = balloon.borderRadius || 0;

        if (r > 0 && bounds.width > 0 && bounds.height > 0) {
            // Rounded rectangle - 8 vertices
            const rNormX = Math.min(r / bounds.width, 0.5);
            const rNormY = Math.min(r / bounds.height, 0.5);

            // Bezier approximation constant
            const k = 0.5522847498;

            nodes = [
                // Top-left arc start
                {
                    point: { nx: rNormX, ny: 0 },
                    handleIn: { nx: -rNormX * k, ny: 0 },
                    handleOut: null,
                    type: 'smooth'
                },
                // Top-right arc start
                {
                    point: { nx: 1 - rNormX, ny: 0 },
                    handleIn: null,
                    handleOut: { nx: rNormX * k, ny: 0 },
                    type: 'smooth'
                },
                // Top-right arc end
                {
                    point: { nx: 1, ny: rNormY },
                    handleIn: { nx: 0, ny: -rNormY * k },
                    handleOut: null,
                    type: 'smooth'
                },
                // Bottom-right arc start
                {
                    point: { nx: 1, ny: 1 - rNormY },
                    handleIn: null,
                    handleOut: { nx: 0, ny: rNormY * k },
                    type: 'smooth'
                },
                // Bottom-right arc end
                {
                    point: { nx: 1 - rNormX, ny: 1 },
                    handleIn: { nx: rNormX * k, ny: 0 },
                    handleOut: null,
                    type: 'smooth'
                },
                // Bottom-left arc start
                {
                    point: { nx: rNormX, ny: 1 },
                    handleIn: null,
                    handleOut: { nx: -rNormX * k, ny: 0 },
                    type: 'smooth'
                },
                // Bottom-left arc end
                {
                    point: { nx: 0, ny: 1 - rNormY },
                    handleIn: { nx: 0, ny: rNormY * k },
                    handleOut: null,
                    type: 'smooth'
                },
                // Top-left arc end
                {
                    point: { nx: 0, ny: rNormY },
                    handleIn: null,
                    handleOut: { nx: 0, ny: -rNormY * k },
                    type: 'smooth'
                }
            ];
        } else {
            // Sharp rectangle - 4 vertices
            nodes = [
                createVertex(0, 0),
                createVertex(1, 0),
                createVertex(1, 1),
                createVertex(0, 1)
            ];
        }
    }

    // Extract style
    const style: VectorStyle = {
        fill: balloon.color,
        stroke: balloon.borderColor,
        strokeWidth: balloon.borderWidth,
        strokeAlign: balloon.strokeAlign,
        strokeStyle: balloon.borderStyle as VectorStyle['strokeStyle'],
        dashSize: balloon.dashSize,
        dashGap: balloon.dashGap
    };

    return {
        id: balloon.id,
        bounds,
        paths: [{
            id: `${balloon.id}-path-0`,
            closed: true,
            nodes
        }],
        style
    };
};

/**
 * Convert VectorShape back to legacy Balloon format.
 * 
 * Used for compatibility with existing save/load system.
 */
export const vectorShapeToLegacyBalloon = (shape: VectorShape): LegacyBalloon => {
    const mainPath = shape.paths[0];
    if (!mainPath) {
        throw new Error('VectorShape has no paths');
    }

    // Convert bounds to box_2d [y1, x1, y2, x2]
    const box_2d: [number, number, number, number] = [
        shape.bounds.y,
        shape.bounds.x,
        shape.bounds.y + shape.bounds.height,
        shape.bounds.x + shape.bounds.width
    ];

    // Convert nodes to absolute points
    const points = mainPath.nodes.map(node =>
        denormalizePoint(node.point, shape.bounds)
    );

    // Convert handles to vertexHandles
    const vertexHandles = mainPath.nodes.map(node => {
        const result: {
            handleIn?: { x: number; y: number };
            handleOut?: { x: number; y: number };
        } = {};

        if (node.handleIn) {
            const absHandle: NormalizedPoint = {
                nx: node.point.nx + node.handleIn.nx,
                ny: node.point.ny + node.handleIn.ny
            };
            result.handleIn = denormalizePoint(absHandle, shape.bounds);
        }

        if (node.handleOut) {
            const absHandle: NormalizedPoint = {
                nx: node.point.nx + node.handleOut.nx,
                ny: node.point.ny + node.handleOut.ny
            };
            result.handleOut = denormalizePoint(absHandle, shape.bounds);
        }

        return result;
    });

    return {
        id: shape.id,
        box_2d,
        points,
        vertexHandles,
        color: shape.style.fill,
        borderColor: shape.style.stroke,
        borderWidth: shape.style.strokeWidth,
        strokeAlign: shape.style.strokeAlign,
        borderStyle: shape.style.strokeStyle,
        dashSize: shape.style.dashSize,
        dashGap: shape.style.dashGap
    };
};

// =============================================================================
// JSON SERIALIZATION
// =============================================================================

/**
 * Serialize VectorShape to JSON string.
 */
export const serializeVectorShape = (shape: VectorShape): string => {
    return JSON.stringify(shape);
};

/**
 * Deserialize JSON string to VectorShape.
 */
export const deserializeVectorShape = (json: string): VectorShape | null => {
    try {
        return JSON.parse(json) as VectorShape;
    } catch {
        return null;
    }
};
