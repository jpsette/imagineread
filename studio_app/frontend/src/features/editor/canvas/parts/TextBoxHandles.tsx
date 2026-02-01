import React from 'react';
import { Rect } from 'react-konva';
import { Balloon } from '@shared/types';

interface TextBoxHandlesProps {
    balloon: Balloon;
    x: number;
    y: number;
    width: number;
    height: number;
    onChange: (newAttrs: Partial<Balloon>) => void;
}

/**
 * Handles for manipulating text box position and size
 * - Resize handle (purple, bottom-right)
 * - Position handle (green, top-left)
 */
export const TextBoxHandles: React.FC<TextBoxHandlesProps> = ({
    balloon,
    x,
    y,
    width,
    height,
    onChange
}) => {
    const textX = x + Number(balloon.textOffsetX || 0);
    const textY = y + Number(balloon.textOffsetY || 0);
    const textWidth = balloon.textWidth || width;
    const textHeight = balloon.textHeight || height;

    return (
        <>
            {/* Dashed border showing text box bounds */}
            <Rect
                x={textX}
                y={textY}
                width={textWidth}
                height={textHeight}
                stroke="#a855f7"
                strokeWidth={1}
                dash={[4, 4]}
                listening={false}
            />

            {/* Resize handle (bottom-right corner) */}
            <Rect
                x={textX + textWidth - 6}
                y={textY + textHeight - 6}
                width={12}
                height={12}
                fill="#a855f7"
                stroke="#fff"
                strokeWidth={1}
                cornerRadius={2}
                draggable
                onDragMove={(e) => {
                    e.cancelBubble = true;
                    const newWidth = Math.max(30, e.target.x() - textX + 6);
                    const newHeight = Math.max(20, e.target.y() - textY + 6);
                    onChange({
                        textWidth: newWidth,
                        textHeight: newHeight
                    });
                }}
                onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'se-resize';
                }}
                onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default';
                }}
            />

            {/* Position handle (top-left corner) */}
            <Rect
                x={textX - 18}
                y={textY - 18}
                width={12}
                height={12}
                fill="#10b981"
                stroke="#fff"
                strokeWidth={1}
                cornerRadius={2}
                draggable
                shadowColor="black"
                shadowBlur={4}
                shadowOpacity={0.3}
                onDragMove={(e: any) => {
                    e.cancelBubble = true;
                    const newX = e.target.x() - x + 18;
                    const newY = e.target.y() - y + 18;
                    onChange({
                        textOffsetX: newX,
                        textOffsetY: newY
                    });
                }}
                onMouseEnter={(e: any) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'move';
                }}
                onMouseLeave={(e: any) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default';
                }}
            />
        </>
    );
};
