/**
 * VectorEditor.tsx
 * 
 * Interactive vector editing component.
 * Handles vertex manipulation, bezier handles, and path operations.
 * 
 * Uses refs for drag operations to avoid re-renders during interaction.
 */

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Group, Path, Rect, Circle, Line } from 'react-konva';
import {
    VectorShape,
    VectorPath,
    VertexNode,
    NormalizedPoint,
    AbsolutePoint,
    EditorMode,
    EditorSelection,
    DragState
} from './vectorTypes';
import {
    denormalizePoint,
    normalizePoint,
    generateSVGPath,
    findNearestEdge,
    splitEdgeAt,
    updateVertexPosition,
    updateVertexHandle
} from './vectorMath';

// =============================================================================
// TYPES
// =============================================================================

export interface VectorEditorProps {
    /** The shape being edited */
    shape: VectorShape;

    /** Current editing mode */
    mode?: EditorMode;

    /** Callback when shape changes */
    onChange: (newShape: VectorShape) => void;

    /** Callback when a vertex is selected */
    onVertexSelect?: (pathIndex: number, vertexIndex: number | null) => void;

    /** Size of vertex handles in pixels */
    vertexSize?: number;

    /** Size of bezier control handles in pixels */
    handleSize?: number;

    /** Whether bezier handles are visible */
    showHandles?: boolean;

    /** Whether to show the path outline */
    showPath?: boolean;

    /** Color for vertices */
    vertexColor?: string;

    /** Color for selected vertices */
    selectedVertexColor?: string;

    /** Color for bezier handles */
    handleColor?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_VERTEX_SIZE = 8;
const DEFAULT_HANDLE_SIZE = 6;
const DEFAULT_VERTEX_COLOR = '#ffffff';
const DEFAULT_SELECTED_VERTEX_COLOR = '#007AFF';
const DEFAULT_HANDLE_COLOR = '#666666';
const DEFAULT_LINE_COLOR = '#999999';
const EDGE_HIT_THRESHOLD = 10; // pixels

// =============================================================================
// COMPONENT
// =============================================================================

const VectorEditorComponent: React.FC<VectorEditorProps> = ({
    shape,
    mode = 'select',
    onChange,
    onVertexSelect,
    vertexSize = DEFAULT_VERTEX_SIZE,
    handleSize = DEFAULT_HANDLE_SIZE,
    showHandles = true,
    showPath = true,
    vertexColor = DEFAULT_VERTEX_COLOR,
    selectedVertexColor = DEFAULT_SELECTED_VERTEX_COLOR,
    handleColor = DEFAULT_HANDLE_COLOR
}) => {
    // ==========================================================================
    // STATE
    // ==========================================================================

    const [selection, setSelection] = useState<EditorSelection>({
        shapeId: shape.id,
        pathIndex: 0,
        vertexIndices: [],
        hoveredVertexIndex: null,
        hoveredEdgeIndex: null
    });

    // ==========================================================================
    // REFS (for drag operations without re-render)
    // ==========================================================================

    const dragStateRef = useRef<DragState>({
        isDragging: false,
        dragType: null,
        dragIndex: null,
        startPoint: null,
        currentPoint: null
    });

    // Working copy of paths during drag
    const workingPathsRef = useRef<VectorPath[]>(shape.paths);

    // Path element ref for visual updates
    const pathRef = useRef<any>(null);

    // Sync working paths when shape changes
    useEffect(() => {
        if (!dragStateRef.current.isDragging) {
            workingPathsRef.current = shape.paths;
        }
    }, [shape.paths]);

    // ==========================================================================
    // DERIVED VALUES
    // ==========================================================================

    const bounds = shape.bounds;
    const currentPath = shape.paths[selection.pathIndex ?? 0];

    // Generate path data for display
    const pathData = useMemo(() => {
        if (!currentPath) return '';
        return generateSVGPath(currentPath, bounds);
    }, [currentPath, bounds]);

    // ==========================================================================
    // VERTEX DRAG HANDLERS
    // ==========================================================================

    const handleVertexDragStart = useCallback((vertexIndex: number, e: any) => {
        e.cancelBubble = true;

        const node = e.target;
        dragStateRef.current = {
            isDragging: true,
            dragType: 'vertex',
            dragIndex: vertexIndex,
            startPoint: { x: node.x(), y: node.y() },
            currentPoint: { x: node.x(), y: node.y() }
        };

        // Select the vertex
        setSelection(prev => ({
            ...prev,
            vertexIndices: [vertexIndex]
        }));

        onVertexSelect?.(selection.pathIndex ?? 0, vertexIndex);
    }, [selection.pathIndex, onVertexSelect]);

    const handleVertexDragMove = useCallback((vertexIndex: number, e: any) => {
        e.cancelBubble = true;

        const node = e.target;
        // The Rect is positioned at (absPoint.x - vertexSize/2, absPoint.y - vertexSize/2)
        // So we need to add vertexSize/2 back to get the actual vertex center
        const newX = node.x() + vertexSize / 2;
        const newY = node.y() + vertexSize / 2;

        dragStateRef.current.currentPoint = { x: newX, y: newY };

        // Update working path
        const pathIndex = selection.pathIndex ?? 0;
        const path = workingPathsRef.current[pathIndex];

        if (path) {
            const newPosition = normalizePoint({ x: newX, y: newY }, bounds);
            const updatedPath = updateVertexPosition(path, vertexIndex, newPosition);

            workingPathsRef.current = workingPathsRef.current.map((p, i) =>
                i === pathIndex ? updatedPath : p
            );

            // Update visual path
            if (pathRef.current) {
                pathRef.current.data(generateSVGPath(updatedPath, bounds));
            }
        }
    }, [selection.pathIndex, bounds, vertexSize]);

    const handleVertexDragEnd = useCallback((_vertexIndex: number, e: any) => {
        e.cancelBubble = true;

        dragStateRef.current.isDragging = false;

        // Commit the change
        onChange({
            ...shape,
            paths: workingPathsRef.current
        });
    }, [shape, onChange]);

    // ==========================================================================
    // HANDLE DRAG HANDLERS (for bezier curves)
    // ==========================================================================

    const handleHandleDragStart = useCallback((
        vertexIndex: number,
        handleType: 'handleIn' | 'handleOut',
        e: any
    ) => {
        e.cancelBubble = true;

        const node = e.target;
        dragStateRef.current = {
            isDragging: true,
            dragType: handleType,
            dragIndex: vertexIndex,
            startPoint: { x: node.x(), y: node.y() },
            currentPoint: { x: node.x(), y: node.y() }
        };
    }, []);

    const handleHandleDragMove = useCallback((
        vertexIndex: number,
        handleType: 'handleIn' | 'handleOut',
        e: any
    ) => {
        e.cancelBubble = true;

        const node = e.target;
        const pathIndex = selection.pathIndex ?? 0;
        const path = workingPathsRef.current[pathIndex];

        if (!path) return;

        const vertex = path.nodes[vertexIndex];
        const vertexAbs = denormalizePoint(vertex.point, bounds);

        // Calculate handle offset from vertex
        const handleAbs: AbsolutePoint = { x: node.x(), y: node.y() };
        const handleOffset: NormalizedPoint = {
            nx: (handleAbs.x - vertexAbs.x) / bounds.width,
            ny: (handleAbs.y - vertexAbs.y) / bounds.height
        };

        const updatedPath = updateVertexHandle(path, vertexIndex, handleType, handleOffset);

        workingPathsRef.current = workingPathsRef.current.map((p, i) =>
            i === pathIndex ? updatedPath : p
        );

        // Update visual path
        if (pathRef.current) {
            pathRef.current.data(generateSVGPath(updatedPath, bounds));
        }
    }, [selection.pathIndex, bounds]);

    const handleHandleDragEnd = useCallback(() => {
        dragStateRef.current.isDragging = false;

        onChange({
            ...shape,
            paths: workingPathsRef.current
        });
    }, [shape, onChange]);

    // ==========================================================================
    // EDGE DOUBLE-CLICK (add vertex)
    // ==========================================================================

    const handleEdgeDoubleClick = useCallback((e: any) => {
        if (mode !== 'pen') return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const pathIndex = selection.pathIndex ?? 0;
        const path = shape.paths[pathIndex];

        if (!path) return;

        // Find nearest edge
        const nearestEdge = findNearestEdge(pointer, path, bounds);

        if (nearestEdge.distance < EDGE_HIT_THRESHOLD) {
            // Split the edge
            const newPath = splitEdgeAt(path, nearestEdge.index, nearestEdge.t, bounds);

            const newPaths = shape.paths.map((p, i) =>
                i === pathIndex ? newPath : p
            );

            onChange({
                ...shape,
                paths: newPaths
            });

            // Select the new vertex
            setSelection(prev => ({
                ...prev,
                vertexIndices: [nearestEdge.index + 1]
            }));
        }
    }, [mode, selection.pathIndex, shape, bounds, onChange]);

    // ==========================================================================
    // RENDER HELPERS
    // ==========================================================================

    const renderVertex = useCallback((node: VertexNode, index: number) => {
        const absPoint = denormalizePoint(node.point, bounds);
        const isSelected = selection.vertexIndices.includes(index);
        const isHovered = selection.hoveredVertexIndex === index;

        return (
            <Rect
                key={`vertex-${index}`}
                x={absPoint.x - vertexSize / 2}
                y={absPoint.y - vertexSize / 2}
                width={vertexSize}
                height={vertexSize}
                fill={isSelected ? selectedVertexColor : vertexColor}
                stroke={isSelected ? selectedVertexColor : '#000000'}
                strokeWidth={1}
                cornerRadius={2}
                draggable
                onDragStart={(e) => handleVertexDragStart(index, e)}
                onDragMove={(e) => handleVertexDragMove(index, e)}
                onDragEnd={(e) => handleVertexDragEnd(index, e)}
                onMouseEnter={(e) => {
                    setSelection(prev => ({ ...prev, hoveredVertexIndex: index }));
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                    setSelection(prev => ({ ...prev, hoveredVertexIndex: null }));
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                }}
                opacity={isHovered && !isSelected ? 0.7 : 1}
            />
        );
    }, [
        bounds, vertexSize, vertexColor, selectedVertexColor,
        selection.vertexIndices, selection.hoveredVertexIndex,
        handleVertexDragStart, handleVertexDragMove, handleVertexDragEnd
    ]);

    const renderHandles = useCallback((node: VertexNode, index: number) => {
        if (!showHandles) return null;
        if (!selection.vertexIndices.includes(index)) return null;

        const vertexAbs = denormalizePoint(node.point, bounds);
        const elements: React.ReactNode[] = [];

        // Handle In
        if (node.handleIn || node.type !== 'corner') {
            const handleAbs = node.handleIn
                ? {
                    x: vertexAbs.x + node.handleIn.nx * bounds.width,
                    y: vertexAbs.y + node.handleIn.ny * bounds.height
                }
                : {
                    // Default position if not set
                    x: vertexAbs.x - 30,
                    y: vertexAbs.y
                };

            // Line from vertex to handle
            elements.push(
                <Line
                    key={`handle-line-in-${index}`}
                    points={[vertexAbs.x, vertexAbs.y, handleAbs.x, handleAbs.y]}
                    stroke={DEFAULT_LINE_COLOR}
                    strokeWidth={1}
                    dash={[3, 3]}
                    listening={false}
                    opacity={node.handleIn ? 1 : 0.4}
                />
            );

            // Handle circle
            elements.push(
                <Circle
                    key={`handle-in-${index}`}
                    x={handleAbs.x}
                    y={handleAbs.y}
                    radius={handleSize}
                    fill={node.handleIn ? handleColor : '#ffffff'}
                    stroke={handleColor}
                    strokeWidth={1}
                    draggable
                    onDragStart={(e) => handleHandleDragStart(index, 'handleIn', e)}
                    onDragMove={(e) => handleHandleDragMove(index, 'handleIn', e)}
                    onDragEnd={handleHandleDragEnd}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                />
            );
        }

        // Handle Out
        if (node.handleOut || node.type !== 'corner') {
            const handleAbs = node.handleOut
                ? {
                    x: vertexAbs.x + node.handleOut.nx * bounds.width,
                    y: vertexAbs.y + node.handleOut.ny * bounds.height
                }
                : {
                    // Default position if not set
                    x: vertexAbs.x + 30,
                    y: vertexAbs.y
                };

            // Line from vertex to handle
            elements.push(
                <Line
                    key={`handle-line-out-${index}`}
                    points={[vertexAbs.x, vertexAbs.y, handleAbs.x, handleAbs.y]}
                    stroke={DEFAULT_LINE_COLOR}
                    strokeWidth={1}
                    dash={[3, 3]}
                    listening={false}
                    opacity={node.handleOut ? 1 : 0.4}
                />
            );

            // Handle circle
            elements.push(
                <Circle
                    key={`handle-out-${index}`}
                    x={handleAbs.x}
                    y={handleAbs.y}
                    radius={handleSize}
                    fill={node.handleOut ? handleColor : '#ffffff'}
                    stroke={handleColor}
                    strokeWidth={1}
                    draggable
                    onDragStart={(e) => handleHandleDragStart(index, 'handleOut', e)}
                    onDragMove={(e) => handleHandleDragMove(index, 'handleOut', e)}
                    onDragEnd={handleHandleDragEnd}
                    onMouseEnter={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                />
            );
        }

        return <React.Fragment key={`handles-${index}`}>{elements}</React.Fragment>;
    }, [
        showHandles, bounds, handleSize, handleColor,
        selection.vertexIndices,
        handleHandleDragStart, handleHandleDragMove, handleHandleDragEnd
    ]);

    // ==========================================================================
    // RENDER
    // ==========================================================================

    if (!currentPath) return null;

    return (
        <Group>
            {/* Path outline (for visual reference) */}
            {showPath && (
                <Path
                    ref={pathRef}
                    data={pathData}
                    stroke="#007AFF"
                    strokeWidth={1}
                    fill="transparent"
                    listening={mode === 'pen'}
                    onDblClick={handleEdgeDoubleClick}
                    perfectDrawEnabled={false}
                />
            )}

            {/* Invisible hit area for edge clicks */}
            {mode === 'pen' && (
                <Path
                    data={pathData}
                    stroke="transparent"
                    strokeWidth={EDGE_HIT_THRESHOLD * 2}
                    fill="transparent"
                    listening={true}
                    onDblClick={handleEdgeDoubleClick}
                    perfectDrawEnabled={false}
                />
            )}

            {/* Bezier handles (rendered first so vertices are on top) */}
            {currentPath.nodes.map((node, index) => renderHandles(node, index))}

            {/* Vertices */}
            {currentPath.nodes.map((node, index) => renderVertex(node, index))}
        </Group>
    );
};

// =============================================================================
// MEMOIZED EXPORT
// =============================================================================

export const VectorEditor = React.memo(VectorEditorComponent);
