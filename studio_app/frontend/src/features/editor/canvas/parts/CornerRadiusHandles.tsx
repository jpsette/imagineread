import React from 'react';
import { Circle, Line } from 'react-konva';
import { Balloon } from '@shared/types';

interface CornerRadiusHandlesProps {
    balloon: Balloon;
    width: number;
    height: number;
    onChange: (newAttrs: Partial<Balloon>) => void;
}

/**
 * Renders corner radius handles (like Illustrator) - small circles inside corners
 * that can be dragged to adjust the borderRadius
 */
export const CornerRadiusHandles: React.FC<CornerRadiusHandlesProps> = ({
    balloon,
    width,
    height,
    onChange
}) => {
    const initialRadius = balloon.borderRadius || 0;
    const maxRadius = Math.min(width, height) / 2;

    // Local state for live preview during drag
    const [liveRadius, setLiveRadius] = React.useState(initialRadius);
    const [isDragging, setIsDragging] = React.useState(false);

    // Sync with balloon when not dragging
    React.useEffect(() => {
        if (!isDragging) {
            setLiveRadius(initialRadius);
        }
    }, [initialRadius, isDragging]);

    // Current radius to use for positioning (live during drag, balloon value otherwise)
    const currentRadius = isDragging ? liveRadius : initialRadius;

    // Four corner positions
    const corners = [
        { id: 'tl', cx: 0, cy: 0, dx: 1, dy: 1 },
        { id: 'tr', cx: width, cy: 0, dx: -1, dy: 1 },
        { id: 'br', cx: width, cy: height, dx: -1, dy: -1 },
        { id: 'bl', cx: 0, cy: height, dx: 1, dy: -1 }
    ];

    // Calculate handle position
    const getHandlePosition = (corner: typeof corners[0], radius: number) => {
        const clampedRadius = Math.min(radius, maxRadius);
        const offset = clampedRadius * 0.7;
        return {
            x: corner.cx + corner.dx * offset,
            y: corner.cy + corner.dy * offset
        };
    };

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragMove = (corner: typeof corners[0], e: any) => {
        e.cancelBubble = true;
        const node = e.target;

        // Calculate distance from corner
        const dx = node.x() - corner.cx;
        const dy = node.y() - corner.cy;
        const distance = Math.sqrt(dx * dx + dy * dy) / 0.7;

        // Update live radius for preview
        const newRadius = Math.max(0, Math.min(distance, maxRadius));
        setLiveRadius(newRadius);
    };

    const handleDragEnd = () => {
        // Commit to balloon - clear points to use Rect with borderRadius instead of polygon
        onChange({
            borderRadius: Math.round(liveRadius),
            points: undefined,  // Clear custom points
            curveControlPoints: undefined  // Clear curve control points
        });
        setIsDragging(false);
    };

    return (
        <>
            {corners.map(corner => {
                const pos = getHandlePosition(corner, currentRadius);

                return (
                    <React.Fragment key={corner.id}>
                        {/* Thin line from corner to handle */}
                        {currentRadius > 5 && (
                            <Line
                                points={[corner.cx, corner.cy, pos.x, pos.y]}
                                stroke="#3b82f6"
                                strokeWidth={0.5}
                                opacity={0.4}
                                listening={false}
                            />
                        )}

                        {/* Corner radius handle */}
                        <Circle
                            x={pos.x}
                            y={pos.y}
                            radius={4}
                            fill="#fff"
                            stroke="#3b82f6"
                            strokeWidth={1}
                            draggable
                            onDragStart={handleDragStart}
                            onDragMove={(e) => handleDragMove(corner, e)}
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
                    </React.Fragment>
                );
            })}
        </>
    );
};
