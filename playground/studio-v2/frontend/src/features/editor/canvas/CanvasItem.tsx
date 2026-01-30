import React, { useRef, useEffect } from 'react';
import { Group, Rect, Text, Transformer, Ellipse } from 'react-konva';
import Konva from 'konva';
import { Balloon } from '@shared/types';

interface CanvasItemProps {
    item: Balloon;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: Partial<Balloon>) => void;
}

export const CanvasItem: React.FC<CanvasItemProps> = ({ item, isSelected, onSelect, onChange }) => {
    const shapeRef = useRef<Konva.Group>(null);
    const trRef = useRef<Konva.Transformer>(null);

    // Attach transformer when selected
    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected]);

    // Parse box_2d to Konva coords
    const [y1, x1, y2, x2] = item.box_2d;
    const width = x2 - x1;
    const height = y2 - y1;

    // Handle Transform End
    const handleTransformEnd = () => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale to 1 and bake into dimensions
        node.scaleX(1);
        node.scaleY(1);

        const newWidth = Math.max(5, node.width() * scaleX);
        const newHeight = Math.max(5, node.height() * scaleY);
        const newX = node.x();
        const newY = node.y();

        // Convert back to box_2d [ymin, xmin, ymax, xmax]
        const newBox: [number, number, number, number] = [
            newY,
            newX,
            newY + newHeight,
            newX + newWidth
        ];

        onChange({
            box_2d: newBox,
            rotation: node.rotation()
        });
    };

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        const newX = node.x();
        const newY = node.y();

        // Preserve dimensions, update position
        onChange({
            box_2d: [newY, newX, newY + height, newX + width]
        });
    };

    return (
        <>
            <Group
                ref={shapeRef}
                x={x1}
                y={y1}
                width={width}
                height={height}
                rotation={item.rotation || 0}
                draggable
                onClick={(e) => {
                    e.cancelBubble = true;
                    onSelect();
                }}
                onTap={(e) => {
                    e.cancelBubble = true;
                    onSelect();
                }}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
            >
                {/* BACKGROUND SHAPE */}
                {/* NO SHADOWS for performance */}

                {/* 1. HAS_MASK Logic */}
                {item.type === 'mask' ? (
                    <Rect
                        width={width}
                        height={height}
                        fill="rgba(255, 0, 0, 0.3)"
                        stroke="red"
                        strokeWidth={2}
                        dash={[5, 5]}
                        cornerRadius={4}
                        listening={false} // Optimization? No, masks need to be clickable to select? 
                    // But masks are draggable. So listening=true (default)
                    />
                ) : (
                    // 2. BALLOON/TEXT Logic
                    item.type !== 'text' ? (
                        item.shape === 'ellipse' ? (
                            <Ellipse
                                radiusX={width / 2}
                                radiusY={height / 2}
                                offsetX={-width / 2} // Ellipse center is at (0,0), so offset logic depends on Group placement
                                offsetY={-height / 2} // If Group x/y is TopLeft, and Ellipse is at 0,0, then Ellipse center is at TopLeft. 
                                // We need center to be at Width/2, Height/2.
                                // Instead of offset, let's just set x/y for ellipse relative to group.
                                x={width / 2}
                                y={height / 2}
                                fill={item.color || 'white'}
                                stroke={item.borderColor || 'black'}
                                strokeWidth={item.borderWidth ?? 2}
                                opacity={item.opacity ?? 1}
                            // Shadows removed
                            />
                        ) : (
                            <Rect
                                width={width}
                                height={height}
                                fill={item.color || '#ffffff'}
                                stroke={item.borderColor || '#000000'}
                                strokeWidth={item.borderWidth ?? 2}
                                opacity={item.opacity ?? 1}
                                cornerRadius={item.borderRadius || 10}
                            // Shadows removed
                            />
                        )
                    ) : null
                )}

                {/* TEXT CONTENT */}
                <Text
                    text={item.text || ""} // Ensure empty if null/undefined
                    width={width}
                    height={height}
                    fontFamily={item.fontFamily || 'Comic Neue'}
                    fontSize={item.customFontSize || 16}
                    fill={item.textColor || 'black'}
                    align="center"
                    verticalAlign="middle"
                    padding={10}
                    wrap="word"
                />
            </Group>

            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                    rotateEnabled={item.type === 'text'}
                // enabledAnchors removed to allow all (sides + corners)
                />
            )}
        </>
    );
};
