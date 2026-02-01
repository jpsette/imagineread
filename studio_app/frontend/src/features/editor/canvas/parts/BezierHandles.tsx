import React from 'react';
import { Circle, Line } from 'react-konva';
import { Balloon } from '@shared/types';

type VertexHandle = {
    handleIn?: { x: number; y: number };
    handleOut?: { x: number; y: number };
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

/**
 * Renders Bézier curve handles ONLY for the selected vertex
 * - Circle handles for curve control (in/out)
 * - Thin dashed lines connecting vertex to handles
 */
export const BezierHandles: React.FC<BezierHandlesProps> = ({
    balloon,
    points,
    minX,
    minY,
    selectedVertexIndex,
    onChange
}) => {
    // Get handles from balloon, or initialize empty with proper type
    const vertexHandles: VertexHandle[] = balloon.vertexHandles || points.map(() => ({}));

    // Local ref for dragging
    const currentHandlesRef = React.useRef<VertexHandle[]>(vertexHandles);

    React.useEffect(() => {
        currentHandlesRef.current = vertexHandles;
    }, [vertexHandles]);

    // Handle drag for a control handle
    const handleDragMove = (handleType: 'handleIn' | 'handleOut', e: any) => {
        e.cancelBubble = true;
        const node = e.target;
        const newHandles = [...currentHandlesRef.current];

        if (!newHandles[selectedVertexIndex]) {
            newHandles[selectedVertexIndex] = {};
        }

        // Store in absolute coordinates
        newHandles[selectedVertexIndex] = {
            ...newHandles[selectedVertexIndex],
            [handleType]: { x: minX + node.x(), y: minY + node.y() }
        };

        currentHandlesRef.current = newHandles;
    };

    // Commit on drag end
    const handleDragEnd = () => {
        onChange({ vertexHandles: currentHandlesRef.current });
    };

    // Create default handle positions (extend from vertex)
    const getDefaultHandle = (handleType: 'handleIn' | 'handleOut') => {
        const vertex = points[selectedVertexIndex];
        const prevVertex = points[(selectedVertexIndex - 1 + points.length) % points.length];
        const nextVertex = points[(selectedVertexIndex + 1) % points.length];

        if (handleType === 'handleIn') {
            return {
                x: vertex.x + (prevVertex.x - vertex.x) * 0.3,
                y: vertex.y + (prevVertex.y - vertex.y) * 0.3
            };
        } else {
            return {
                x: vertex.x + (nextVertex.x - vertex.x) * 0.3,
                y: vertex.y + (nextVertex.y - vertex.y) * 0.3
            };
        }
    };

    // Initialize handles on first interaction
    const initializeHandle = (handleType: 'handleIn' | 'handleOut') => {
        const defaultPos = getDefaultHandle(handleType);
        const newHandles = [...currentHandlesRef.current];

        if (!newHandles[selectedVertexIndex]) {
            newHandles[selectedVertexIndex] = {};
        }

        newHandles[selectedVertexIndex] = {
            ...newHandles[selectedVertexIndex],
            [handleType]: { x: minX + defaultPos.x, y: minY + defaultPos.y }
        };

        currentHandlesRef.current = newHandles;
        onChange({ vertexHandles: newHandles });
    };

    // Get current vertex and its handles
    const vertex = points[selectedVertexIndex];
    const vh = vertexHandles[selectedVertexIndex] || {};

    const handleIn = vh.handleIn
        ? { x: vh.handleIn.x - minX, y: vh.handleIn.y - minY }
        : getDefaultHandle('handleIn');
    const handleOut = vh.handleOut
        ? { x: vh.handleOut.x - minX, y: vh.handleOut.y - minY }
        : getDefaultHandle('handleOut');

    const hasHandleIn = !!vh.handleIn;
    const hasHandleOut = !!vh.handleOut;

    return (
        <>
            {/* Thin dashed line from vertex to handleIn */}
            <Line
                points={[vertex.x, vertex.y, handleIn.x, handleIn.y]}
                stroke="#666"
                strokeWidth={0.5}
                dash={[2, 2]}
                opacity={hasHandleIn ? 0.8 : 0.4}
                listening={false}
            />

            {/* Thin dashed line from vertex to handleOut */}
            <Line
                points={[vertex.x, vertex.y, handleOut.x, handleOut.y]}
                stroke="#666"
                strokeWidth={0.5}
                dash={[2, 2]}
                opacity={hasHandleOut ? 0.8 : 0.4}
                listening={false}
            />

            {/* Handle In (small circle) */}
            <Circle
                x={handleIn.x}
                y={handleIn.y}
                radius={4}
                fill={hasHandleIn ? "#333" : "#fff"}
                stroke="#333"
                strokeWidth={1}
                draggable
                onDragStart={() => {
                    if (!hasHandleIn) initializeHandle('handleIn');
                }}
                onDragMove={(e) => handleDragMove('handleIn', e)}
                onDragEnd={handleDragEnd}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                }}
            />

            {/* Handle Out (small circle) */}
            <Circle
                x={handleOut.x}
                y={handleOut.y}
                radius={4}
                fill={hasHandleOut ? "#333" : "#fff"}
                stroke="#333"
                strokeWidth={1}
                draggable
                onDragStart={() => {
                    if (!hasHandleOut) initializeHandle('handleOut');
                }}
                onDragMove={(e) => handleDragMove('handleOut', e)}
                onDragEnd={handleDragEnd}
                onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                }}
            />
        </>
    );
};
