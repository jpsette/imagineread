import React, { useRef, useEffect, useState } from 'react';
import { Group, Transformer } from 'react-konva';
import { Balloon } from '@shared/types';
import { BalloonVector } from './parts/BalloonVector';
import { BalloonText } from './parts/BalloonText';
import { BalloonVertexEditor } from './parts/BalloonVertexEditor';
import { TextBoxHandles } from './parts/TextBoxHandles';

interface BalloonShapeProps {
    balloon: Balloon;
    isSelected: boolean;
    isEditing?: boolean;
    // Decoupled Visibility Props
    showBalloon?: boolean;
    showText?: boolean;
    showMaskOverlay?: boolean; // Controls Vertex Editor visibility
    curveEditingEnabled?: boolean; // Controls Curve Editor visibility

    onSelect: () => void;
    onChange: (newAttrs: Partial<Balloon>) => void;
    onEditRequest: () => void;
    onEditingBlur?: () => void;
}

const BalloonShapeComponent: React.FC<BalloonShapeProps> = ({
    balloon,
    isSelected,
    isEditing,
    showBalloon = true,
    showText = true,
    showMaskOverlay = false,
    curveEditingEnabled = false,
    onSelect,
    onChange,
    onEditRequest,
    onEditingBlur
}) => {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);
    const isDragging = useRef(false); // Transient state flag

    // Calculate dimensions from box_2d [top, left, bottom, right]
    const baseY = balloon.box_2d[0];
    const baseX = balloon.box_2d[1];
    const height = balloon.box_2d[2] - balloon.box_2d[0];
    const width = balloon.box_2d[3] - balloon.box_2d[1];

    // Local position state for smooth dragging (text follows balloon)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Computed position (base + drag offset)
    const x = baseX + dragOffset.x;
    const y = baseY + dragOffset.y;

    // Attach Transformer
    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current && !isEditing) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected, isEditing, balloon.box_2d, balloon.points]);

    // HANDLE DRAG & TRANSFORM UPDATES
    // TRANSIENT UPDATE SCHEME:
    // 1. We start dragging (Konva handles pixel movement).
    // 2. We do NOT update the store onDragMove (expensive).
    // 3. We only commit to store onDragEnd.

    const handleDragStart = (e: any) => {
        if (e.target !== shapeRef.current) return;
        isDragging.current = true;
        setDragOffset({ x: 0, y: 0 }); // Reset offset at start
    };

    const handleDragMove = (e: any) => {
        if (e.target !== shapeRef.current) return;
        const node = e.target;
        // Update offset for text to follow
        setDragOffset({
            x: node.x() - baseX,
            y: node.y() - baseY
        });
    };

    const handleDragEnd = (e: any) => {
        if (e.target !== shapeRef.current) return; // Ignore events from children (Vertex Editor)

        isDragging.current = false;
        const node = e.target;

        // remove rounding to prevent drift ("walking")
        const newY = node.y();
        const newX = node.x();

        // Calculate Delta to shift points (use baseX/baseY, not the offset-adjusted x/y)
        const dy = newY - baseY;
        const dx = newX - baseX;

        const newBox = [
            newY,
            newX,
            newY + (height * node.scaleY()), // Preserves current size
            newX + (width * node.scaleX())
        ];

        // Shift Points if they exist
        let newPoints = balloon.points;
        if (newPoints && newPoints.length > 0) {
            newPoints = newPoints.map(p => ({
                x: p.x + dx,
                y: p.y + dy
            }));
        }

        onChange({
            box_2d: newBox,
            points: newPoints
        });
        node.scaleX(1); node.scaleY(1);

        // Reset drag offset after commit
        setDragOffset({ x: 0, y: 0 });
    };

    const handleTransformEnd = () => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();


        // CORRECTION: Standard is [ymin, xmin, ymax, xmax] -> [y, x, y+h, x+w]
        // Original code used: box_2d: [node.y(), node.x(), ...] which is correct.

        // remove rounding to fix drift
        const currentX = node.x();
        const currentY = node.y();



        // Scale Logic for Points
        // Points are relative to the *Original* origin (x, y) before transform
        // NewPoint = OriginalBoxOrigin + dx + (Point - OriginalBoxOrigin) * scale

        let newPoints = balloon.points;
        if (newPoints && newPoints.length > 0) {
            newPoints = newPoints.map(p => ({
                x: currentX + (p.x - x) * scaleX,
                y: currentY + (p.y - y) * scaleY
            }));
        }

        // RESET SCALES
        node.scaleX(1); node.scaleY(1);

        // CRITICAL FIX: Reset Handle Scales
        // Because of React key stability (e.g. 0,0 point stays 0,0), the Node is reused.
        // We must manually strip the 'Counter Scale' we applied during transform.
        const handles = node.find('.vertex-handle');
        handles.forEach((handle: any) => {
            handle.scale({ x: 1, y: 1 });
        });

        onChange({
            box_2d: [
                currentY,
                currentX,
                currentY + height * scaleY,
                currentX + width * scaleX
            ],
            points: newPoints
        });
    };

    const handleTextChange = (html: string, text: string) => {
        onChange({ html, text });
    };

    const handleTransform = () => {
        const node = shapeRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // COUNTER-SCALE LOGIC:
        // Prevent vertex handles from deforming when the group is scaled.
        // We find all nodes with name 'vertex-handle' and apply inverse scale.
        const handles = node.find('.vertex-handle');

        // Safety: Prevent excessive scaling if scale is too close to 0
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
                id={balloon.id}
                x={x}
                y={y}
                draggable={isSelected && !isEditing}
                onClick={(e) => { e.cancelBubble = true; onSelect(); }}
                onTap={(e) => { e.cancelBubble = true; onSelect(); }}
                onDblClick={(e) => { e.cancelBubble = true; if (!showMaskOverlay) onEditRequest(); }}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onTransform={handleTransform} // Added Handler
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
                {/* 3. VERTEX EDITOR (Mask Mode) */}
                {isSelected && showMaskOverlay && (
                    <BalloonVertexEditor
                        balloon={balloon}
                        width={width}
                        height={height}
                        curveEditingEnabled={curveEditingEnabled}
                        onChange={onChange}
                    />
                )}
            </Group>

            {/* 2. TEXT CONTENT - OUTSIDE main Group to not affect Transformer bounds */}
            {showText && (
                <Group
                    x={x + Number(balloon.textOffsetX || 0)}
                    y={y + Number(balloon.textOffsetY || 0)}
                    listening={!!isEditing}
                >
                    <BalloonText
                        balloon={balloon}
                        width={balloon.textWidth || width}
                        height={balloon.textHeight || height}
                        isEditing={!!isEditing}
                        visible={true}
                        onChange={handleTextChange}
                        onBlur={() => onEditingBlur && onEditingBlur()}
                    />
                </Group>
            )}

            {/* TEXT BOX HANDLES - Hidden when vertex editing is active */}
            {isSelected && !isEditing && showText && !showMaskOverlay && (
                <TextBoxHandles
                    balloon={balloon}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    onChange={onChange}
                />
            )}

            {/* Hide Transformer when vertex editing is active */}
            {isSelected && !isEditing && !showMaskOverlay && (
                <Transformer
                    ref={trRef}
                    padding={0}
                    anchorSize={8}
                    anchorCornerRadius={2}
                    borderStrokeWidth={2}
                    rotateEnabled={false}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 20 || newBox.height < 20) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

// MEMOIZATION:
// Comparison function ignores 'on...' handlers to prevent re-renders when parent creates inline functions.
// This is critical for preventing "Snap-back" if parent renders during a global event.
export const BalloonShape = React.memo(BalloonShapeComponent, (prev, next) => {
    // If balloon points/box change, we MUST re-render
    const balloonChanged = prev.balloon !== next.balloon;

    // If selection changes, we re-render
    const selectionChanged = prev.isSelected !== next.isSelected;

    // If editing changes
    const editingChanged = prev.isEditing !== next.isEditing;

    // If visibility changes
    const visibilityChanged =
        prev.showBalloon !== next.showBalloon ||
        prev.showText !== next.showText ||
        prev.showMaskOverlay !== next.showMaskOverlay;

    return !(balloonChanged || selectionChanged || editingChanged || visibilityChanged);
});
