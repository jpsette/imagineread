import React, { useRef } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { BalloonShape } from './BalloonShape';
import { PanelShape } from './PanelShape';
import { Balloon, Panel } from '../../../types';
import { useEditorStore } from '../store';

// HOOKS
import { useCanvasNavigation } from './hooks/useCanvasNavigation';
import { useCanvasTools } from './hooks/useCanvasTools';

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

// Background Component - Updated to accept 'visible' prop
const BackgroundImage = ({
    image,
    name,
    visible = true
}: {
    image: HTMLImageElement | undefined,
    name: string,
    visible?: boolean
}) => {
    if (!image) return null;
    return (
        <KonvaImage
            name={name}
            image={image}
            visible={visible} // Control visibility without unmounting
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

    // --- IMAGES (CORS ENABLED) ---
    const [imgOriginal, statusOriginal] = useImage(imageUrl, 'anonymous');
    const [imgClean] = useImage(cleanImageUrl || undefined, 'anonymous');

    // --- HOOKS ---
    const { scale, position, handleWheel } = useCanvasNavigation({
        stageRef: localRef,
        containerRef,
        imgOriginal,
        statusOriginal,
        onImageLoad
    });

    const { handleStageClick } = useCanvasTools({
        activeTool,
        setActiveTool,
        onSelect,
        onBalloonAdd,
        setEditingId,
        imgOriginal
    });

    const handleEditRequest = (balloon: Balloon) => {
        setEditingId(balloon.id);
        setActiveTool('select');
        onEditRequest(balloon);
    };

    // Logic: Does the clean image data exist?
    const hasCleanImage = !!(cleanImageUrl && imgClean);
    // Logic: Should it be visible to the user? (Inverse of "Show Original")
    const isCleanVisible = !isOriginalVisible;

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
                onMouseDown={handleStageClick}
            >
                {/* 1. BACKGROUND LAYER */}
                <Layer>
                    {/* Base Image (Always rendered, always visible underneath) */}
                    <BackgroundImage name="base-image" image={imgOriginal} />

                    {/* Clean Image Overlay (Always rendered if exists, visibility toggled) */}
                    {hasCleanImage && (
                        <BackgroundImage
                            name="clean-image"
                            image={imgClean}
                            visible={isCleanVisible}
                        />
                    )}
                </Layer>

                {/* 2. PANELS LAYER */}
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

                {/* 3. BALLOONS LAYER */}
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
