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
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    // Calculate center point for the order badge
    const badgePos = { x: minX + 20, y: minY + 20 };

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
        <Group>
            {/* The Polygon Panel */}
            <Line
                points={panel.points}
                closed={true}
                stroke={isSelected ? "#10b981" : "#10b981"} // Always green
                strokeWidth={isSelected ? 4 : 2}
                dash={isSelected ? [] : [10, 5]} // Solid if selected
                fill={isSelected ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.05)"}
                shadowColor={isSelected ? "rgba(0,0,0,0.5)" : "transparent"}
                shadowBlur={isSelected ? 5 : 0}
                onClick={onSelect} // Trigger selection
                onTap={onSelect}
                draggable={false}
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

            {/* Order Badge */}
            <Group x={badgePos.x} y={badgePos.y} listening={false}>
                <Circle
                    radius={12}
                    fill={isSelected ? "#047857" : "#10b981"}
                    shadowColor="black"
                    shadowBlur={4}
                    shadowOpacity={0.3}
                />
                <Text
                    text={(panel.order || "?").toString()}
                    fontSize={12}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill="white"
                    align="center"
                    verticalAlign="middle"
                    offsetX={6}
                    offsetY={6}
                />
            </Group>

            {/* Draggable Anchors (Only if selected & editable) */}
            {isSelected && editable && vertices.map((v, i) => (
                <Circle
                    key={i}
                    x={v.x}
                    y={v.y}
                    radius={6}
                    fill="#fff"
                    stroke="#10b981"
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
