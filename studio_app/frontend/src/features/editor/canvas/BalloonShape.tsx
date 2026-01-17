import React, { useRef, useEffect, useState } from 'react';
import { Group, Rect, Path, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';
import { Balloon } from '../../../types';
import { BALLOON_PATHS } from './utils/balloonPaths';

interface BalloonShapeProps {
    balloon: Balloon;
    isSelected: boolean;
    isEditing?: boolean;
    onSelect: () => void;
    onChange: (newAttrs: Partial<Balloon>) => void;
    onEditRequest: () => void;
    onEditingBlur?: () => void;
}

export const BalloonShape: React.FC<BalloonShapeProps> = ({
    balloon, isSelected, isEditing, onSelect, onChange, onEditRequest, onEditingBlur
}) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    // Calculate dimensions from box_2d [top, left, bottom, right]
    const y = balloon.box_2d[0];
    const x = balloon.box_2d[1];
    const height = balloon.box_2d[2] - balloon.box_2d[0];
    const width = balloon.box_2d[3] - balloon.box_2d[1];

    // Initialize content from html or text
    const [content, setContent] = useState(balloon.html || balloon.text);

    // Sync external changes (e.g. from undo/redo or initial load)
    useEffect(() => {
        if (!isEditing) {
            setContent(balloon.html || balloon.text);
        }
    }, [balloon.html, balloon.text, isEditing]);

    // Attach Transformer
    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current && !isEditing) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected, isEditing]);

    // Save on Blur
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        const newText = e.currentTarget.innerText;
        onChange({ html: newHtml, text: newText });
        if (onEditingBlur) onEditingBlur();
    };

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

    // Construct Font Style String
    const getInitialStyle = () => {
        return {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: balloon.fontFamily || 'Comic Neue',
            fontSize: `${balloon.fontSize || 14}px`,
            color: balloon.textColor || '#000000',
            fontWeight: (balloon.fontStyle || '').includes('bold') ? 'bold' : 'normal',
            fontStyle: (balloon.fontStyle || '').includes('italic') ? 'italic' : 'normal',
            textDecoration: (balloon.textDecoration || '').includes('underline') ? 'underline' : 'none',
            textAlign: 'center' as const,
            lineHeight: 1.2,
            outline: 'none',
            userSelect: 'text' as const,
            cursor: isEditing ? 'text' : 'move',
            overflow: 'hidden',
            pointerEvents: isEditing ? 'auto' : 'none',
        };
    };

    // RENDER THE SPECIFIC SHAPE
    const renderShape = () => {
        const commonProps = {
            width: width,
            height: height,
            fill: balloon.type === 'text' ? undefined : (balloon.color || '#ffffff'),
            stroke: isSelected ? '#007AFF' : (balloon.borderColor || (balloon.type === 'text' ? undefined : '#000000')),
            strokeWidth: isSelected ? 2 : (balloon.borderWidth || 1), // Thicker stroke for shout if actively set
            perfectDrawEnabled: false, // Performance
            shadowForStrokeEnabled: false,
            listening: true
        };

        if (balloon.type === 'balloon-square' || balloon.type === 'balloon') {
            return <Rect {...commonProps} cornerRadius={10} />;
        }

        if (balloon.type === 'balloon-circle') {
            // Pill shape using Rect with high corner radius
            return <Rect {...commonProps} cornerRadius={Math.min(width, height) / 2} />;
        }

        if (balloon.type === 'balloon-thought') {
            return (
                <Path
                    {...commonProps}
                    data={BALLOON_PATHS.thought}
                    // Scale path to fit the box
                    scaleX={width / 100}
                    scaleY={height / 100}
                    width={undefined} height={undefined} // Path doesn't use w/h directly in the same way Rect does for boundaries
                />
            );
        }

        if (balloon.type === 'balloon-shout') {
            // Force thicker stroke for shout if not selected (unless overridden)
            const strokeWidth = isSelected ? 2 : (balloon.borderWidth || 2);

            return (
                <Path
                    {...commonProps}
                    strokeWidth={strokeWidth}
                    data={BALLOON_PATHS.shout}
                    scaleX={width / 100}
                    scaleY={height / 100}
                    width={undefined} height={undefined}
                />
            );
        }

        // Fallback for Text Tool (Transparent)
        if (balloon.type === 'text') {
            return <Rect {...commonProps} fill={undefined} stroke={isSelected ? '#007AFF' : undefined} />;
        }

        // Default
        return <Rect {...commonProps} cornerRadius={10} />;
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
                {renderShape()}

                {/* HTML Text Overlay */}
                <Html
                    groupProps={{
                        width: width,
                        height: height,
                    }}
                    divProps={{
                        style: {
                            width: `${width}px`,
                            height: `${height}px`,
                            pointerEvents: 'none',
                        }
                    }}
                >
                    <div
                        style={{
                            ...getInitialStyle(),
                            pointerEvents: isEditing ? 'auto' : 'none',
                            padding: balloon.type === 'balloon-thought' ? '15%' : '5%' // Add padding for thought bubble
                        }}
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                        onBlur={handleBlur}
                        dangerouslySetInnerHTML={{ __html: content }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                        }}
                        id={`balloon-text-${balloon.id}`}
                    />
                </Html>
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
