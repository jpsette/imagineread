import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import { BalloonShape } from './BalloonShape';
import { PanelShape } from './PanelShape';
import { Balloon, Panel } from '../../../types';
import { useEditorStore } from '../store'; // Verify path relative to file structure

interface EditorCanvasProps {
    imageUrl: string;
    balloons?: Balloon[];
    panels?: Panel[];
    showPanels?: boolean;
    selectedId?: string | null;
    activeTool?: string;
    setActiveTool?: (tool: string) => void;
    onSelect?: (id: string | null) => void;
    onUpdate?: (id: string, attrs: Partial<Balloon>) => void;
    onImageLoad?: (width: number, height: number) => void;
    onEditRequest?: (balloon: Balloon) => void;
    onBalloonAdd?: (balloon: Balloon) => void;
    editingId?: string | null;
    setEditingId?: (id: string | null) => void;
}

// Background Component
const BackgroundImage = ({ image }: { image: HTMLImageElement | undefined }) => {
    if (!image) return null;
    return (
        <KonvaImage
            image={image}
            perfectDrawEnabled={false}
            listening={false}
        />
    );
};

export const EditorCanvas = React.forwardRef<Konva.Stage, EditorCanvasProps>(({
    imageUrl,
    balloons = [],
    panels = [],
    showPanels = true,
    selectedId = null,
    activeTool = 'select',
    setActiveTool = () => { },
    onSelect = () => { },
    onUpdate = () => { },
    onImageLoad,
    onEditRequest = () => console.log("Edit requested"),
    onBalloonAdd = () => { },
    editingId,
    setEditingId = () => { }
}, stageRef) => {

    const localRef = useRef<Konva.Stage>(null);
    React.useImperativeHandle(stageRef, () => localRef.current!);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- STORE STATE ---
    const cleanImageUrl = useEditorStore(state => state.cleanImageUrl);
    const isOriginalVisible = useEditorStore(state => state.isOriginalVisible);

    // --- LOAD IMAGES STRATEGY (DUAL LOAD) ---
    // 1. Original (Base) - Always loaded
    const [imgOriginal, statusOriginal] = useImage(imageUrl);

    // 2. Clean (Overlay) - Loaded if URL exists
    // We pass undefined if null so use-image doesn't fetch
    const [imgClean] = useImage(cleanImageUrl || undefined);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hasFitted, setHasFitted] = useState(false);

    // --- AUTO-FIT LOGIC (Based on Original Image) ---
    useEffect(() => {
        // Only fit once when the original image loads
        if (statusOriginal === 'loaded' && imgOriginal && containerRef.current && !hasFitted) {
            const container = containerRef.current;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            const imgRatio = imgOriginal.width / imgOriginal.height;
            const containerRatio = containerWidth / containerHeight;

            let finalScale = 1;
            if (containerRatio > imgRatio) {
                finalScale = (containerHeight * 0.9) / imgOriginal.height;
            } else {
                finalScale = (containerWidth * 0.9) / imgOriginal.width;
            }

            const finalX = (containerWidth - imgOriginal.width * finalScale) / 2;
            const finalY = (containerHeight - imgOriginal.height * finalScale) / 2;

            setScale(finalScale);
            setPosition({ x: finalX, y: finalY });
            setHasFitted(true);

            if (onImageLoad) {
                onImageLoad(imgOriginal.width, imgOriginal.height);
            }
        }
    }, [imgOriginal, statusOriginal, hasFitted, onImageLoad]);

    // Zoom Handling
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = localRef.current;
        if (!stage) return;

        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        if (newScale < 0.1 || newScale > 10) return;

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setScale(newScale);
        setPosition(newPos);
    };

    const handleEditRequest = (balloon: Balloon) => {
        setEditingId(balloon.id);
        setActiveTool('select');
        onEditRequest(balloon);
    };

    // LOGIC: Should we show the clean overlay?
    // Show if: We have a clean image AND the user has NOT requested the original
    const showCleanOverlay = !!(cleanImageUrl && imgClean && !isOriginalVisible);

    return (
        <div ref={containerRef} className="w-full h-full bg-[#1e1e1e] overflow-hidden relative">
            <Stage
                ref={localRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable={activeTool === 'select' && !editingId}
                onMouseDown={(e) => {
                    const stage = e.target.getStage();
                    if (!stage) return;
                    if (editingId) return;

                    const clickedOnEmpty = e.target === stage;
                    if (clickedOnEmpty && activeTool === 'select') {
                        onSelect(null);
                        return;
                    }

                    // 2. Handle Text Tool Creation
                    if (activeTool === 'text' && clickedOnEmpty && imgOriginal) {
                        const transform = stage.getAbsoluteTransform().copy();
                        transform.invert();
                        const pos = transform.point(stage.getPointerPosition() || { x: 0, y: 0 });
                        const newBalloon: Balloon = {
                            id: uuidv4(), type: 'text', shape: 'rectangle', text: 'Novo Texto',
                            fontSize: 20, direction: 'UP', tail_box_2d: [0, 0, 0, 0],
                            box_2d: [Math.round(pos.y), Math.round(pos.x), Math.round(pos.y + 50), Math.round(pos.x + 150)],
                            color: undefined
                        };
                        onBalloonAdd(newBalloon); onSelect(newBalloon.id); setActiveTool('select'); setEditingId(newBalloon.id);
                    }

                    // 3. Handle SHAPE Creation (New Tools)
                    if (activeTool && activeTool.startsWith('balloon-') && clickedOnEmpty && imgOriginal) {
                        const transform = stage.getAbsoluteTransform().copy();
                        transform.invert();
                        const pos = transform.point(stage.getPointerPosition() || { x: 0, y: 0 });

                        // Default dimensions
                        const w = 150;
                        const h = 100;

                        const newBalloon: Balloon = {
                            id: uuidv4(),
                            type: activeTool as any, // 'balloon-square', etc.
                            shape: 'rectangle', // Internal Konva shape fallback
                            text: activeTool === 'balloon-thought' ? '...' : (activeTool === 'balloon-shout' ? 'AAAA!' : ''),
                            color: '#ffffff',
                            borderColor: '#000000',
                            borderWidth: activeTool === 'balloon-shout' ? 3 : 1,
                            fontSize: 14,
                            box_2d: [
                                Math.round(pos.y - h / 2),
                                Math.round(pos.x - w / 2),
                                Math.round(pos.y + h / 2),
                                Math.round(pos.x + w / 2)
                            ],
                            direction: 'UP',
                            tail_box_2d: [0, 0, 0, 0]
                        };

                        onBalloonAdd(newBalloon);
                        onSelect(newBalloon.id);
                        setActiveTool('select');
                    }
                }}
            >
                {/* BACKGROUND LAYER */}
                <Layer>
                    {/* 1. Base: Original Image (Always Rendered) */}
                    <BackgroundImage image={imgOriginal} />

                    {/* 2. Overlay: Clean Image (Rendered on top if active) */}
                    {showCleanOverlay && (
                        <BackgroundImage image={imgClean} />
                    )}
                </Layer>

                {/* PANELS LAYER */}
                {showPanels && (
                    <Layer>
                        {panels.map((panel) => (
                            <PanelShape
                                key={panel.id}
                                panel={panel}
                                isSelected={panel.id === selectedId}
                                onSelect={() => onSelect(panel.id)}
                                onUpdate={(id, attrs) => onUpdate(id, attrs as any)}
                            />
                        ))}
                    </Layer>
                )}

                {/* BALLOONS LAYER */}
                <Layer>
                    {balloons.map((balloon) => (
                        <BalloonShape
                            key={balloon.id}
                            balloon={balloon}
                            isSelected={balloon.id === selectedId}
                            // @ts-ignore
                            isEditing={editingId === balloon.id}
                            onSelect={() => onSelect(balloon.id)}
                            onChange={(newAttrs) => onUpdate(balloon.id, newAttrs)}
                            onEditRequest={() => handleEditRequest(balloon)}
                            // @ts-ignore
                            onEditingBlur={() => setEditingId(null)}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
});
