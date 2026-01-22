import React, { useRef, useEffect } from 'react';
import { Group, Transformer } from 'react-konva';
import { Balloon } from '../../../types';
import { BalloonVector } from './parts/BalloonVector';
import { BalloonText } from './parts/BalloonText';

interface BalloonShapeProps {
    balloon: Balloon;
    isSelected: boolean;
    isEditing?: boolean;
    // Decoupled Visibility Props
    showBalloon?: boolean;
    showText?: boolean;

    onSelect: () => void;
    onChange: (newAttrs: Partial<Balloon>) => void;
    onEditRequest: () => void;
    onEditingBlur?: () => void;
}

export const BalloonShape: React.FC<BalloonShapeProps> = ({
    balloon,
    isSelected,
    isEditing,
    showBalloon = true,
    showText = true,
    onSelect,
    onChange,
    onEditRequest,
    onEditingBlur
}) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    // Calculate dimensions from box_2d [top, left, bottom, right]
    const y = balloon.box_2d[0];
    const x = balloon.box_2d[1];
    const height = balloon.box_2d[2] - balloon.box_2d[0];
    const width = balloon.box_2d[3] - balloon.box_2d[1];

    // Attach Transformer
    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current && !isEditing) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected, isEditing]);

    // HANDLE DRAG & TRANSFORM UPDATES
    const handleDragEnd = (e: any) => {
        const node = e.target;
        onChange({
            box_2d: [
                Math.round(node.y()),
                Math.round(node.x()),
                Math.round(node.y() + (height * node.scaleY())), // Preserves current size
                Math.round(node.x() + (width * node.scaleX()))
            ]
        });
        node.scaleX(1); node.scaleY(1);
    };

    const handleTransformEnd = () => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1); node.scaleY(1);

        onChange({
            box_2d: [
                Math.round(node.y()),
                Math.round(node.x()),
                Math.round(node.y() + height * scaleY),
                Math.round(node.x() + width * scaleX)
            ]
        });
    };

    const handleTextChange = (html: string, text: string) => {
        onChange({ html, text });
    };

    return (
        <>
            <Group
                ref={shapeRef}
                id={balloon.id}
                x={x}
                y={y}
                draggable={!isEditing}
                onClick={(e) => { e.cancelBubble = true; onSelect(); }}
                onTap={(e) => { e.cancelBubble = true; onSelect(); }}
                onDblClick={(e) => { e.cancelBubble = true; onEditRequest(); }}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
            >
                {/* 1. VECTOR SHAPE (Controlled by showBalloon) */}
                <BalloonVector
                    balloon={balloon}
                    width={width}
                    height={height}
                    isSelected={isSelected}
                    visible={showBalloon}
                />

                {/* 2. TEXT CONTENT (Controlled by showText) */}
                <BalloonText
                    balloon={balloon}
                    width={width}
                    height={height}
                    isEditing={!!isEditing}
                    visible={showText}
                    onChange={handleTextChange}
                    onBlur={() => onEditingBlur && onEditingBlur()}
                />
            </Group>

            {isSelected && !isEditing && (
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
