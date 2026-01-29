import React, { useRef } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { BalloonShape } from './BalloonShape';
import { PanelShape } from './PanelShape';
import { Balloon, Panel, EditorTool } from '../../../types';
// import { useEditorStore } from '../store'; // Unused
import { useEditorUIStore } from '../uiStore';

// HOOKS
import { useCanvasNavigation } from './hooks/useCanvasNavigation';
import { useCanvasTools } from './hooks/useCanvasTools';

import { TileGrid } from './tiles/components/TileGrid';


interface EditorCanvasProps {
    imageUrl: string;
    fileId?: string; // Added for DB-based Tile Lookup
    balloons?: Balloon[];
    panels?: Panel[];
    showPanels?: boolean;
    selectedId?: string | null;
    activeTool?: EditorTool;
    setActiveTool?: (tool: EditorTool) => void;
    onSelect?: (id: string | null) => void;
    onUpdate?: (id: string, attrs: Partial<Balloon>) => void;
    onImageLoad?: (width: number, height: number) => void;
    onEditRequest?: (balloon: Balloon) => void;
    onBalloonAdd: (balloon: Balloon) => void;
    editingId?: string | null;
    setEditingId?: (id: string | null) => void;
    onCanvasReady?: (ready: boolean) => void; // New Prop
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
    fileId,
    balloons = [],
    panels = [],
    showPanels = true,
    onSelect,
    onUpdate = () => { },
    onImageLoad,
    onEditRequest = () => console.log("Edit requested"),
    onBalloonAdd = () => { },
    editingId,
    setEditingId = () => { },
    onCanvasReady // Destructure new prop
}, stageRef) => {

    // Store Hooks will override these props eventually.
    // Local aliases for transition:
    const handleSelect = (id: string | null) => {
        useEditorUIStore.getState().setSelectedId(id);
        if (onSelect) onSelect(id);
    };

    const localRef = useRef<Konva.Stage>(null);
    React.useImperativeHandle(stageRef, () => localRef.current!);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- STORE STATE ---
    const cleanImageUrl = useEditorUIStore(state => state.cleanImageUrl);
    const isOriginalVisible = useEditorUIStore(state => state.isOriginalVisible);

    // UI Store for Global Toggles
    const {
        showBalloons,
        showText,
        showMasks,
        activeTool,
        setActiveTool,
        selectedId
    } = useEditorUIStore();

    // --- IMAGES (CORS ENABLED) ---
    // Standard useImage hook to ensure correct state synchronization in stable shell
    const [imgOriginal, statusOriginal] = useImage(imageUrl, 'anonymous');
    const [imgClean] = useImage(cleanImageUrl || '', 'anonymous');

    // --- LOADING STATE LOGIC ---
    React.useEffect(() => {
        // If image is loaded, notify parent
        if (statusOriginal === 'loaded' && onCanvasReady) {
            // Small timeout to allow Konva first paint
            const timer = setTimeout(() => {
                onCanvasReady(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [statusOriginal, onCanvasReady]);

    // --- HOOKS ---
    // --- RESIZE OBSERVER LOGIC ---
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

    React.useLayoutEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        // Initial sizing
        updateSize();

        const observer = new ResizeObserver(() => {
            // Wrap in requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
            window.requestAnimationFrame(updateSize);
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, []);

    // --- HOOKS ---
    const { scale, position, handleWheel, handleDragEnd } = useCanvasNavigation({
        stageRef: localRef,
        containerRef,
        imgOriginal,
        statusOriginal,
        onImageLoad,
        dimensions, // New Prop to prevent microscopic auto-fit
        fileId // PASSED FOR SAVE STABILITY
    });

    const { handleStageClick } = useCanvasTools({
        activeTool,
        setActiveTool,
        onSelect: handleSelect, // FIXED: Use stable wrapper instead of optional prop
        onBalloonAdd,
        setEditingId,
        imgOriginal
    });

    const handleEditRequest = (balloon: Balloon) => {
        setEditingId(balloon.id);
        setActiveTool('select');
        onEditRequest(balloon);
    };


    // Logic: Should it be visible to the user? (Inverse of "Show Original")
    const isCleanVisible = !isOriginalVisible;

    // Logic: Active Tile ID (Original vs Clean)
    // If showing clean image: pass filename (Backend Strategy 2)
    // If showing original: pass fileId (Backend Strategy 1 - DB Lookup)
    const activeTileId = isCleanVisible && cleanImageUrl
        ? cleanImageUrl.split('/').pop() || 'unknown'
        : (fileId || imageUrl.split('/').pop() || 'unknown');

    return (
        <div ref={containerRef} className="w-full h-full bg-[#1e1e1e] overflow-hidden relative">
            {/* LOCAL LOADER: Prevents "Black Screen" Flick during navigation */}
            {/* Fix: Z-Index reduced to 10 to sit BEHIND floating panels (z-40) but ABOVE canvas */}
            {statusOriginal === 'loading' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]">
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        {/* Using a simple CSS spinner or Lucide icon if available. 
                             Since we can't easily add new imports without checking, 
                             we'll use a Tailwind Spinner for maximum reliability. */}
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-zinc-500 text-xs font-medium">Carregando imagem...</span>
                    </div>
                </div>
            )}

            <Stage
                ref={localRef}
                // Crash Fix: Ensure dimensions are never 0 to avoid "drawImage(0,0)" error
                width={Math.max(1, dimensions.width)}
                height={Math.max(1, dimensions.height)}
                onWheel={handleWheel}
                onDragEnd={handleDragEnd} // FIXED: Sync state after drag
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable={activeTool === 'select' && !editingId}
                onMouseDown={handleStageClick}
            >
                {/* 1. BACKGROUND LAYER (Static) */}
                {/* Isolated in its own canvas to prevent flickering during Tile redraws */}
                <Layer listening={false}>
                    <BackgroundImage
                        name="base-image"
                        image={isCleanVisible ? (imgClean || imgOriginal) : imgOriginal} // Fallback to Original if Clean not loaded
                        visible={statusOriginal === 'loaded'} // Only show if fully loaded to prevent partial render
                    />
                </Layer>

                {/* 2. TILES LAYER (Dynamic) */}
                <Layer listening={false} perfectDrawEnabled={false}>
                    {/* DEEP ZOOM TILES */}
                    {imgOriginal && statusOriginal === 'loaded' && (
                        <TileGrid
                            imageId={activeTileId}
                            imageWidth={imgOriginal.naturalWidth}
                            imageHeight={imgOriginal.naturalHeight}
                            stageScale={scale}
                            stageX={position.x}
                            stageY={position.y}
                            stageWidth={dimensions.width}
                            stageHeight={dimensions.height}
                        // baseImage removed
                        />
                    )}
                </Layer>

                {/* 3. PANELS LAYER */}
                {showPanels && (
                    <Layer perfectDrawEnabled={false}>
                        {/* Z-INDEX LOGIC: Sort panels so selected one renders last (on top) */}
                        {[...panels]
                            .sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0))
                            .map((panel) => (
                                <PanelShape
                                    key={panel.id}
                                    panel={panel}
                                    isSelected={panel.id === selectedId}
                                    onSelect={() => handleSelect(panel.id)}
                                    onUpdate={(id, attrs) => onUpdate(id, attrs as any)}
                                />
                            ))}
                    </Layer>
                )}

                {/* 3. BALLOONS LAYER (With Logic for Masks vs Balloons) */}
                <Layer perfectDrawEnabled={false}>
                    {balloons.map((balloon) => {
                        // Logic: Is this a mask or a balloon?
                        const isMask = balloon.type === 'mask';
                        const shouldShowShape = isMask ? showMasks : showBalloons;

                        return (
                            <BalloonShape
                                key={balloon.id}
                                balloon={balloon}
                                isSelected={balloon.id === selectedId}
                                // @ts-ignore
                                isEditing={editingId === balloon.id}
                                // VISIBILITY PROPS
                                showBalloon={shouldShowShape}
                                showText={showText}
                                showMaskOverlay={showMasks} // LINK TO UI STORE

                                onSelect={() => handleSelect(balloon.id)}
                                onChange={(newAttrs) => onUpdate(balloon.id, newAttrs)}
                                onEditRequest={() => handleEditRequest(balloon)}
                                // @ts-ignore
                                onEditingBlur={() => setEditingId(null)}
                            />
                        );
                    })}
                </Layer>
            </Stage>
        </div>
    );
});
