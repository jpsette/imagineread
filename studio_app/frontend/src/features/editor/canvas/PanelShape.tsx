import React from 'react';
import { Group, Line, Circle, Text } from 'react-konva';
import { Panel } from '../../../types';
import Konva from 'konva';

interface PanelShapeProps {
    panel: Panel;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate?: (id: string, attrs: Partial<Panel>) => void;
    editable?: boolean;
}

export const PanelShape: React.FC<PanelShapeProps> = ({
    panel,
    isSelected,
    onSelect,
    onUpdate,
    editable = true
}) => {

    // Helper to get {x, y} for each point pair
    const points = panel.points || [];
    const vertices = [];
    for (let i = 0; i < points.length; i += 2) {
        vertices.push({ x: points[i], y: points[i + 1], index: i });
    }

    // Calculate Bounding Box to position the Delete Button (Top-Right)
    // Calculate Bounding Box and Center
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Center point for the large number
    const centerPos = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };

    // Handle Anchor Drag
    const handleAnchorDragMove = (e: Konva.KonvaEventObject<DragEvent>, index: number) => {
        if (!onUpdate) return;
        const newPos = e.target.position();
        const newPoints = [...points];

        // Update x, y at index
        newPoints[index] = newPos.x;
        newPoints[index + 1] = newPos.y;

        onUpdate(panel.id, { points: newPoints });
    };

    return (
        <Group id={panel.id}>
            {/* The Polygon Panel */}
            <Line
                points={panel.points}
                closed={true}
                stroke={isSelected ? "#0033CC" : "#0047FF"} // Darker Blue (Selected) / Vibrant Blue (Unselected)
                strokeWidth={isSelected ? 5 : 3} // Thicker lines
                dash={isSelected ? [] : [10, 5]} // Solid if selected
                fill={isSelected ? "rgba(0, 71, 255, 0.6)" : "rgba(0, 71, 255, 0.35)"} // Much higher opacity
                shadowColor={isSelected ? "rgba(0,0,0,0.5)" : "transparent"}
                shadowBlur={isSelected ? 5 : 0}
                onClick={onSelect} // Trigger selection
                onTap={onSelect}
                draggable={false}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
                hitStrokeWidth={20} // Easier to click
                onMouseEnter={e => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'pointer';
                }}
                onMouseLeave={e => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = 'default';
                }}
            />

            {/* Large Centered Number (No Circle) */}
            <Text
                x={centerPos.x}
                y={centerPos.y}
                text={(panel.order || "?").toString()}
                fontSize={64} // Large font
                fontFamily="Arial"
                fontStyle="bold"
                fill="white"
                stroke="black"
                strokeWidth={2}
                shadowColor="rgba(0,0,0,0.5)"
                shadowBlur={10}
                perfectDrawEnabled={false}
                shadowForStrokeEnabled={false}
                align="center"
                verticalAlign="middle"
                offsetX={20} // Approximate center offset for a generic number
                offsetY={32} // Approximate center offset (half font size)
                listening={false} // Click-through
            />

            {/* Draggable Anchors (Only if selected & editable) */}
            {isSelected && editable && vertices.map((v, i) => (
                <Circle
                    key={i}
                    x={v.x}
                    y={v.y}
                    radius={6}
                    fill="#fff"
                    stroke="#0033CC"
                    strokeWidth={2}
                    draggable
                    onDragMove={(e) => handleAnchorDragMove(e, v.index)}
                    hitStrokeWidth={10}
                    onMouseEnter={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'move';
                    }}
                    onMouseLeave={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                />
            ))}
        </Group>
    );
};
