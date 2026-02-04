/**
 * vectorTypes.ts
 * 
 * Core types for the vector editing system.
 * Inspired by Figma's Vector Networks architecture.
 * 
 * Key principles:
 * 1. Coordinates are NORMALIZED (0-1) relative to bounding box
 * 2. All curves are CUBIC Bezier (like Figma internally converts Q → C)
 * 3. Types are immutable - create new instances for changes
 */

// =============================================================================
// PRIMITIVE TYPES
// =============================================================================

/** 2D point in absolute canvas coordinates */
export interface AbsolutePoint {
    x: number;
    y: number;
}

/** 2D point normalized to 0-1 range relative to bounding box */
export interface NormalizedPoint {
    nx: number;  // 0 = left edge, 1 = right edge
    ny: number;  // 0 = top edge, 1 = bottom edge
}

/** Bounding box in absolute coordinates */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

// =============================================================================
// VERTEX TYPES
// =============================================================================

/**
 * Vertex node type - determines how handles behave
 * 
 * - corner: handles are independent (sharp corner)
 * - smooth: handles are collinear but can have different lengths
 * - symmetric: handles are collinear AND same length (mirror)
 */
export type VertexType = 'corner' | 'smooth' | 'symmetric';

/**
 * A single vertex (node) in a vector path.
 * 
 * In Figma terms: this is an "anchor point" with optional Bezier handles.
 * 
 * Handles are stored as OFFSETS from the vertex position (not absolute).
 * This makes the vertex self-contained and easier to transform.
 */
export interface VertexNode {
    /** Position of the vertex (normalized 0-1) */
    point: NormalizedPoint;

    /** 
     * Incoming handle offset (from point).
     * Controls the curve arriving at this vertex.
     * Null = sharp corner on incoming side.
     */
    handleIn: NormalizedPoint | null;

    /**
     * Outgoing handle offset (from point).
     * Controls the curve leaving this vertex.
     * Null = sharp corner on outgoing side.
     */
    handleOut: NormalizedPoint | null;

    /** How handles relate to each other */
    type: VertexType;

    /** Optional corner radius for auto-rounding */
    cornerRadius?: number;
}

// =============================================================================
// PATH TYPES
// =============================================================================

/**
 * A vector path - sequence of connected vertices.
 * 
 * Can be open (line) or closed (shape).
 * A shape can have multiple paths (main outline + holes).
 */
export interface VectorPath {
    /** Unique identifier for this path */
    id: string;

    /** Whether the path forms a closed loop */
    closed: boolean;

    /** Ordered list of vertices */
    nodes: VertexNode[];
}

// =============================================================================
// SHAPE TYPES
// =============================================================================

/** Stroke alignment options */
export type StrokeAlign = 'center' | 'inner' | 'outer';

/** Border/stroke style */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Visual style properties for a vector shape.
 * Separated from geometry for cleaner architecture.
 */
export interface VectorStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeAlign?: StrokeAlign;
    strokeStyle?: StrokeStyle;
    dashSize?: number;
    dashGap?: number;
    opacity?: number;
}

/**
 * Complete vector shape with geometry and style.
 * 
 * This is the main data structure for vector editing.
 * It's independent of Balloon - an adapter converts between them.
 */
export interface VectorShape {
    /** Unique identifier */
    id: string;

    /** Bounding box in absolute canvas coordinates */
    bounds: Bounds;

    /** 
     * List of paths that make up this shape.
     * First path is the main outline.
     * Additional paths are holes (using even-odd fill rule).
     */
    paths: VectorPath[];

    /** Visual styling */
    style: VectorStyle;
}

// =============================================================================
// EDITOR STATE TYPES
// =============================================================================

/** What the user is currently editing */
export type EditorMode = 'select' | 'pen' | 'curvature' | 'transform';

/** Selection state for editor */
export interface EditorSelection {
    /** Selected shape ID */
    shapeId: string | null;

    /** Selected path index within shape */
    pathIndex: number | null;

    /** Selected vertex indices within path (can be multiple with Shift) */
    vertexIndices: number[];

    /** Currently hovered vertex index (for visual feedback) */
    hoveredVertexIndex: number | null;

    /** Currently hovered edge index (for adding points) */
    hoveredEdgeIndex: number | null;
}

/** Drag operation state */
export interface DragState {
    isDragging: boolean;
    dragType: 'vertex' | 'handleIn' | 'handleOut' | 'edge' | null;
    dragIndex: number | null;
    startPoint: AbsolutePoint | null;
    currentPoint: AbsolutePoint | null;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/** Create a default vertex node at the given position */
export const createVertex = (
    nx: number,
    ny: number,
    type: VertexType = 'corner'
): VertexNode => ({
    point: { nx, ny },
    handleIn: null,
    handleOut: null,
    type,
    cornerRadius: undefined
});

/** Create a smooth vertex with symmetric handles */
export const createSmoothVertex = (
    nx: number,
    ny: number,
    handleOffset: NormalizedPoint
): VertexNode => ({
    point: { nx, ny },
    handleIn: { nx: -handleOffset.nx, ny: -handleOffset.ny },
    handleOut: { nx: handleOffset.nx, ny: handleOffset.ny },
    type: 'smooth'
});

/** Create a new empty path */
export const createPath = (id: string, closed: boolean = true): VectorPath => ({
    id,
    closed,
    nodes: []
});

/** Create a rectangular path (4 corner vertices) */
export const createRectPath = (id: string): VectorPath => ({
    id,
    closed: true,
    nodes: [
        createVertex(0, 0),
        createVertex(1, 0),
        createVertex(1, 1),
        createVertex(0, 1)
    ]
});

/** Create an ellipse path approximation (4 smooth vertices) */
export const createEllipsePath = (id: string): VectorPath => {
    // Magic number for circular bezier approximation
    const k = 0.5522847498;

    return {
        id,
        closed: true,
        nodes: [
            // Top
            {
                point: { nx: 0.5, ny: 0 },
                handleIn: { nx: -k * 0.5, ny: 0 },
                handleOut: { nx: k * 0.5, ny: 0 },
                type: 'smooth'
            },
            // Right
            {
                point: { nx: 1, ny: 0.5 },
                handleIn: { nx: 0, ny: -k * 0.5 },
                handleOut: { nx: 0, ny: k * 0.5 },
                type: 'smooth'
            },
            // Bottom
            {
                point: { nx: 0.5, ny: 1 },
                handleIn: { nx: k * 0.5, ny: 0 },
                handleOut: { nx: -k * 0.5, ny: 0 },
                type: 'smooth'
            },
            // Left
            {
                point: { nx: 0, ny: 0.5 },
                handleIn: { nx: 0, ny: k * 0.5 },
                handleOut: { nx: 0, ny: -k * 0.5 },
                type: 'smooth'
            }
        ]
    };
};

/** Create a default shape with rectangle path */
export const createShape = (
    id: string,
    bounds: Bounds,
    style: VectorStyle = {}
): VectorShape => ({
    id,
    bounds,
    paths: [createRectPath(`${id}-path-0`)],
    style: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 1,
        strokeAlign: 'center',
        strokeStyle: 'solid',
        ...style
    }
});

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isNormalizedPoint = (obj: any): obj is NormalizedPoint =>
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.nx === 'number' &&
    typeof obj.ny === 'number';

export const isAbsolutePoint = (obj: any): obj is AbsolutePoint =>
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number';

export const isVertexNode = (obj: any): obj is VertexNode =>
    typeof obj === 'object' &&
    obj !== null &&
    isNormalizedPoint(obj.point) &&
    (obj.handleIn === null || isNormalizedPoint(obj.handleIn)) &&
    (obj.handleOut === null || isNormalizedPoint(obj.handleOut)) &&
    ['corner', 'smooth', 'symmetric'].includes(obj.type);
