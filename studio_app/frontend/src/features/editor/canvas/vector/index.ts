/**
 * Vector Editing Module
 * 
 * Figma-inspired vector editing system with:
 * - Normalized coordinates (0-1)
 * - Cubic Bezier curves
 * - Immutable data structures
 * - Pure mathematical functions
 */

// Types
export type {
    AbsolutePoint,
    NormalizedPoint,
    Bounds,
    VertexType,
    VertexNode,
    VectorPath,
    StrokeAlign,
    StrokeStyle,
    VectorStyle,
    VectorShape,
    EditorMode,
    EditorSelection,
    DragState
} from './vectorTypes';

// Factory Functions
export {
    createVertex,
    createSmoothVertex,
    createPath,
    createRectPath,
    createEllipsePath,
    createShape,
    isNormalizedPoint,
    isAbsolutePoint,
    isVertexNode
} from './vectorTypes';

// Math Functions
export {
    // Coordinate conversion
    normalizePoint,
    denormalizePoint,
    handleToAbsolute,
    absoluteToHandleOffset,

    // Bezier calculations
    cubicBezierPoint,
    cubicBezierTangent,

    // Distance calculations
    distance,
    distanceToSegment,
    distanceToCubicBezier,

    // Path operations
    findNearestVertex,
    findNearestEdge,
    splitEdgeAt,
    deleteVertex,
    updateVertexPosition,
    updateVertexHandle,

    // SVG generation
    generateSVGPath,
    generateShapeSVGPath,

    // Bounds
    calculatePathBounds
} from './vectorMath';

// Serialization Functions
export {
    parseSVGPath,
    legacyBalloonToVectorShape,
    vectorShapeToLegacyBalloon,
    serializeVectorShape,
    deserializeVectorShape
} from './vectorSerializer';

// Components
export { VectorRenderer, SimplifiedVectorRenderer } from './VectorRenderer';
export type { VectorRendererProps, SimplifiedVectorRendererProps } from './VectorRenderer';

export { VectorEditor } from './VectorEditor';
export type { VectorEditorProps } from './VectorEditor';

export {
    BalloonVectorAdapter,
    useBalloonAsVectorShape,
    useVectorShapeToBalloon
} from './BalloonVectorAdapter';
export type { BalloonVectorAdapterProps } from './BalloonVectorAdapter';
