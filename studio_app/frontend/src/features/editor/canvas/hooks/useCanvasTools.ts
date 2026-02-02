import { v4 as uuidv4 } from 'uuid';
import { useRef, useCallback, useState } from 'react';
import Konva from 'konva';
import { Balloon, EditorTool } from '@shared/types';

interface UseCanvasToolsProps {
    activeTool: EditorTool;
    setActiveTool: (tool: EditorTool) => void;
    onSelect: (id: string | null) => void;
    onBalloonAdd: (balloon: Balloon) => void;
    onPanelAdd?: (panel: any) => void; // NEW: For panel creation tool
    setEditingId: (id: string | null) => void;
    imgOriginal: HTMLImageElement | undefined;
}

interface DragState {
    isDragging: boolean;
    startPos: { x: number; y: number } | null;
    startTime: number;
}

export interface DragPreviewBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const useCanvasTools = ({
    activeTool,
    setActiveTool,
    onSelect,
    onBalloonAdd,
    onPanelAdd,
    setEditingId,
    imgOriginal
}: UseCanvasToolsProps) => {

    const dragStateRef = useRef<DragState>({
        isDragging: false,
        startPos: null,
        startTime: 0
    });

    // State for drag preview rectangle
    const [dragPreview, setDragPreview] = useState<DragPreviewBounds | null>(null);

    // Helper to get canvas position from mouse event
    const getCanvasPos = (stage: Konva.Stage) => {
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        return transform.point(stage.getPointerPosition() || { x: 0, y: 0 });
    };

    const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const clickedOnEmpty = e.target === stage;

        // Track drag for text/balloon/mask/panel tools on empty canvas
        const isCreationTool = activeTool === 'text' || activeTool === 'mask' || activeTool === 'panel' || activeTool.startsWith('balloon-');
        if (isCreationTool && clickedOnEmpty && imgOriginal) {
            const pos = getCanvasPos(stage);
            dragStateRef.current = {
                isDragging: true,
                startPos: pos,
                startTime: Date.now()
            };
            return; // Don't process click yet, wait for mouseup
        }

        // Default behavior for select tool
        if (clickedOnEmpty && activeTool === 'select') {
            onSelect(null);
            setEditingId(null);
        }
    }, [activeTool, imgOriginal, onSelect, setEditingId]);

    const handleStageMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const dragState = dragStateRef.current;

        // ALWAYS clear preview immediately
        setDragPreview(null);

        // Reset drag state
        dragStateRef.current = { isDragging: false, startPos: null, startTime: 0 };

        // Only process if we were dragging with a creation tool
        if (!dragState.startPos || !imgOriginal) return;
        const isCreationTool = activeTool === 'text' || activeTool === 'mask' || activeTool === 'panel' || activeTool.startsWith('balloon-');
        if (!isCreationTool) return;

        const endPos = getCanvasPos(stage);
        const startPos = dragState.startPos;

        // Calculate drag distance and duration
        const dragDistance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
        );
        const dragDuration = Date.now() - dragState.startTime;

        // Determine if it's a click (small movement, short duration) or drag
        const isClick = dragDistance < 10 && dragDuration < 300;

        if (activeTool === 'text') {
            let box_2d: [number, number, number, number];

            if (isClick) {
                // Click: Create small isolated text at position - cursor at click point
                box_2d = [
                    Math.round(startPos.y),
                    Math.round(startPos.x),
                    Math.round(startPos.y + 30),
                    Math.round(startPos.x + 200)
                ];
            } else {
                // Drag: Create text box with dragged dimensions
                const minX = Math.min(startPos.x, endPos.x);
                const maxX = Math.max(startPos.x, endPos.x);
                const minY = Math.min(startPos.y, endPos.y);
                const maxY = Math.max(startPos.y, endPos.y);

                box_2d = [
                    Math.round(minY),
                    Math.round(minX),
                    Math.round(maxY),
                    Math.round(maxX)
                ];
            }

            const newBalloon: Balloon = {
                id: uuidv4(),
                type: 'text',
                shape: 'rectangle',
                text: '',
                fontSize: isClick ? 16 : 14,
                direction: 'UP',
                tail_box_2d: [0, 0, 0, 0],
                box_2d,
                color: undefined,
                textColor: '#000000',
                // Always left/top aligned so cursor appears consistently at start
                textAlign: 'left',
                verticalAlign: 'top'
            };

            onBalloonAdd(newBalloon);
            onSelect(newBalloon.id);
            setActiveTool('select');
            setEditingId(newBalloon.id);
            return;
        }

        // Balloon shapes (always centered on click position or use drag bounds)
        if (activeTool.startsWith('balloon-')) {
            let box_2d: [number, number, number, number];

            if (isClick) {
                const w = 150;
                const h = 100;
                box_2d = [
                    Math.round(startPos.y - h / 2),
                    Math.round(startPos.x - w / 2),
                    Math.round(startPos.y + h / 2),
                    Math.round(startPos.x + w / 2)
                ];
            } else {
                const minX = Math.min(startPos.x, endPos.x);
                const maxX = Math.max(startPos.x, endPos.x);
                const minY = Math.min(startPos.y, endPos.y);
                const maxY = Math.max(startPos.y, endPos.y);
                box_2d = [
                    Math.round(minY),
                    Math.round(minX),
                    Math.round(maxY),
                    Math.round(maxX)
                ];
            }

            const newBalloon: Balloon = {
                id: uuidv4(),
                type: activeTool as any,
                shape: 'rectangle',
                text: activeTool === 'balloon-thought' ? '...' : (activeTool === 'balloon-shout' ? 'AAAA!' : ''),
                color: '#ffffff',
                borderColor: '#000000',
                borderWidth: activeTool === 'balloon-shout' ? 3 : 1,
                fontSize: 14,
                box_2d,
                direction: 'UP',
                tail_box_2d: [0, 0, 0, 0]
            };

            onBalloonAdd(newBalloon);
            onSelect(newBalloon.id);
            setActiveTool('select');
        }

        // MASK creation tool
        if (activeTool === 'mask') {
            const minX = Math.min(startPos.x, endPos.x);
            const maxX = Math.max(startPos.x, endPos.x);
            const minY = Math.min(startPos.y, endPos.y);
            const maxY = Math.max(startPos.y, endPos.y);

            // Minimum size check
            if (maxX - minX < 30 || maxY - minY < 30) {
                setActiveTool('select');
                return;
            }

            const box_2d: [number, number, number, number] = [
                Math.round(minY),
                Math.round(minX),
                Math.round(maxY),
                Math.round(maxX)
            ];

            const newMask: Balloon = {
                id: `mask-${Date.now()}`,
                type: 'mask',
                text: '',
                box_2d,
                shape: 'rectangle',
                color: 'rgba(255, 0, 0, 0.4)',
                borderColor: 'red',
                borderWidth: 2,
                borderRadius: 4,
                opacity: 1
            } as Balloon;

            onBalloonAdd(newMask);
            onSelect(newMask.id);
            setActiveTool('select');
        }

        // PANEL creation tool
        if (activeTool === 'panel' && onPanelAdd) {
            const minX = Math.min(startPos.x, endPos.x);
            const maxX = Math.max(startPos.x, endPos.x);
            const minY = Math.min(startPos.y, endPos.y);
            const maxY = Math.max(startPos.y, endPos.y);

            // Minimum size check
            if (maxX - minX < 30 || maxY - minY < 30) {
                setActiveTool('select');
                return;
            }

            const box_2d = [
                Math.round(minY),
                Math.round(minX),
                Math.round(maxY),
                Math.round(maxX)
            ];

            const newPanel = {
                id: `panel-${Date.now()}`,
                type: 'panel',
                order: 0, // Will be updated by parent
                box_2d,
                points: [
                    minX, minY,
                    maxX, minY,
                    maxX, maxY,
                    minX, maxY
                ]
            };

            onPanelAdd(newPanel);
            onSelect(newPanel.id);
            setActiveTool('select');
        }
    }, [activeTool, imgOriginal, onBalloonAdd, onPanelAdd, onSelect, setActiveTool, setEditingId]);

    // Track mouse movement to show preview rectangle
    const handleStageMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const dragState = dragStateRef.current;

        // Only show preview if actively dragging with a creation tool
        if (!dragState.isDragging || !dragState.startPos) {
            return;
        }

        const currentPos = getCanvasPos(stage);
        const startPos = dragState.startPos;

        // Calculate bounds
        const minX = Math.min(startPos.x, currentPos.x);
        const maxX = Math.max(startPos.x, currentPos.x);
        const minY = Math.min(startPos.y, currentPos.y);
        const maxY = Math.max(startPos.y, currentPos.y);

        setDragPreview({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        });
    }, []);

    return {
        handleStageMouseDown,
        handleStageMouseUp,
        handleStageMouseMove,
        dragPreview
    };
};
