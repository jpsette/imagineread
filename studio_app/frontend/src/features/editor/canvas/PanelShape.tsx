import React, { useRef, useEffect } from 'react';
import { Group, Line, Text, Transformer } from 'react-konva';
import { Panel } from '@shared/types';
import Konva from 'konva';
import { PanelVertexEditor } from './parts/PanelVertexEditor';

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
    const shapeRef = useRef<Konva.Group>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const mainLineRef = useRef<Konva.Line>(null);

    // Calculate Box (Geometry)
    // We trust panel.box_2d or recompute? Better recompute from points to be safe or use box_2d if synced.
    // Let's recompute for visual consistency.
    const points = panel.points || [];
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;

    // Relative Points for Rendering inside Group
    const relPoints = points.map((p, i) => {
        if (i % 2 === 0) return p - minX; // x
        return p - minY; // y
    });

    // Center point for Number
    const centerPos = { x: width / 2, y: height / 2 };

    // --- TRANSFORMER ATTACHMENT ---
    useEffect(() => {
        if (isSelected && editable && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected, editable, panel.points, panel.box_2d]); // Force update on geom change

    // --- HANDLERS ---

    // 1. DRAG END (Move Whole Panel)
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target !== shapeRef.current) return;
        if (!onUpdate) return;

        const node = shapeRef.current;
        if (!node) return;

        // Drift Fix: No Rounding
        const newX = node.x(); // This corresponds to new minX
        const newY = node.y(); // This corresponds to new minY

        // Delta
        const dx = newX - minX;
        const dy = newY - minY;

        // Shift All Absolute Points
        const newAbsPoints = points.map((p, i) => {
            if (i % 2 === 0) return p + dx;
            return p + dy;
        });

        const newMinX = newX;
        const newMinY = newY;
        const newMaxX = newX + (width * node.scaleX());
        const newMaxY = newY + (height * node.scaleY());

        onUpdate(panel.id, {
            points: newAbsPoints,
            box_2d: [newMinY, newMinX, newMaxY, newMaxX]
        });

        // Reset Scale (Standard Konva Pattern)
        node.scaleX(1);
        node.scaleY(1);
    };

    // 2. TRANSFORM END (Resize)
    const handleTransformEnd = () => {
        if (!onUpdate) return;
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const currentX = node.x();
        const currentY = node.y();

        // Calculate New Points
        // NewPoint = NewOrigin + (RelPoint * Scale)
        const newAbsPoints: number[] = [];
        for (let i = 0; i < relPoints.length; i += 2) {
            const rx = relPoints[i];
            const ry = relPoints[i + 1];

            newAbsPoints.push(currentX + rx * scaleX);
            newAbsPoints.push(currentY + ry * scaleY);
        }

        // Box
        const newMinY = currentY;
        const newMinX = currentX;
        const newMaxY = currentY + height * scaleY;
        const newMaxX = currentX + width * scaleX;

        // RESET SCALES
        node.scaleX(1); node.scaleY(1);

        // CRITICAL FIX: Reset Handle Scales (Same as Balloon)
        const handles = node.find('.vertex-handle');
        handles.forEach((handle: any) => {
            handle.scale({ x: 1, y: 1 });
        });

        onUpdate(panel.id, {
            points: newAbsPoints,
            box_2d: [newMinY, newMinX, newMaxY, newMaxX]
        });
    };

    // 3. TRANSFORM (Counter-Scaling Handles)
    const handleTransform = () => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        const handles = node.find('.vertex-handle');
        const safeScaleX = Math.abs(scaleX) < 0.01 ? 1 : scaleX;
        const safeScaleY = Math.abs(scaleY) < 0.01 ? 1 : scaleY;

        handles.forEach((handle: any) => {
            handle.scale({
                x: 1 / safeScaleX,
                y: 1 / safeScaleY
            });
        });
    };

    return (
        <>
            <Group
                ref={shapeRef}
                id={panel.id}
                x={minX}
                y={minY}
                draggable={isSelected && editable}
                onClick={(e) => { e.cancelBubble = true; onSelect(); }}
                onTap={(e) => { e.cancelBubble = true; onSelect(); }}
                onDragEnd={handleDragEnd}
                onTransform={handleTransform}
                onTransformEnd={handleTransformEnd}
            >
                {/* The Polygon Panel (Relative Points) */}
                <Line
                    ref={mainLineRef}
                    points={relPoints}
                    closed={true}
                    stroke={isSelected ? "#0033CC" : "#0047FF"}
                    strokeWidth={isSelected ? 5 : 3}
                    dash={isSelected ? [] : [10, 5]}
                    fill={isSelected ? "rgba(0, 71, 255, 0.6)" : "rgba(0, 71, 255, 0.35)"}
                    shadowColor={isSelected ? "rgba(0,0,0,0.5)" : "transparent"}
                    shadowBlur={isSelected ? 5 : 0}
                    perfectDrawEnabled={false}
                    shadowForStrokeEnabled={false}
                    hitStrokeWidth={20}
                    onMouseEnter={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                />

                {/* Large Centered Number */}
                <Text
                    x={centerPos.x}
                    y={centerPos.y}
                    text={(panel.order || "?").toString()}
                    fontSize={64}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill="white"
                    stroke="black"
                    strokeWidth={2}
                    opacity={0.9}
                    align="center"
                    verticalAlign="middle"
                    offsetX={20} // Rough centering
                    offsetY={32}
                    listening={false}
                />

                {/* VERTEX EDITOR (Replaces manual circles) */}
                {isSelected && editable && onUpdate && (
                    <PanelVertexEditor
                        panel={panel}
                        width={width}
                        height={height}
                        onChange={(attrs) => onUpdate(panel.id, attrs)}
                        onVertexDragMove={(newRelPoints: number[]) => {
                            // Update the main polygon fill in real-time during drag
                            if (mainLineRef.current) {
                                mainLineRef.current.points(newRelPoints);
                                mainLineRef.current.getLayer()?.batchDraw();
                            }
                        }}
                    />
                )}
            </Group>

            {/* TRANSFORMER */}
            {isSelected && editable && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};
