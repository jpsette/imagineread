import React, { useRef } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { Balloon, Panel, EditorTool } from '@shared/types';
import { useEditorUIStore } from '@features/editor/uiStore';

// HOOKS
import { useCanvasNavigation } from './hooks/useCanvasNavigation';
import { useCanvasTools } from './hooks/useCanvasTools';

// LAYERS
import { BackgroundLayer } from './layers/BackgroundLayer';
import { TilesLayer } from './layers/TilesLayer';
import { PanelsLayer } from './layers/PanelsLayer';
import { BalloonsLayer } from './layers/BalloonsLayer';


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
    onUpdate?: (id: string, attrs: Partial<Balloon> | Partial<Panel>) => void;
    onImageLoad?: (width: number, height: number) => void;
    onEditRequest?: (balloon: Balloon) => void;
    onBalloonAdd: (balloon: Balloon) => void;
    editingId?: string | null;
    setEditingId?: (id: string | null) => void;
    onCanvasReady?: (ready: boolean) => void; // New Prop
}

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
        vertexEditingEnabled,
        curveEditingEnabled,
        activeTool,
        setActiveTool,
        selectedId,
        selectedIds
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

    const { handleStageMouseDown, handleStageMouseUp, handleStageMouseMove, dragPreview } = useCanvasTools({
        activeTool,
        setActiveTool,
        onSelect: handleSelect,
        onBalloonAdd,
        setEditingId,
        imgOriginal
    });

    const handleEditRequestInternal = (balloon: Balloon) => {
        setEditingId(balloon.id);
        setActiveTool('select');
        onEditRequest(balloon);
    };


    // Logic: Should it be visible to the user? (Inverse of "Show Original")
    const isCleanVisible = !isOriginalVisible;

    // Logic: Active Tile ID (Original vs Clean)
    // If showing clean image: pass the full LOCAL path (for /tiles/local/ endpoint)
    // If showing original: pass fileId (Backend Strategy 1 - DB Lookup)
    // Note: cleanImageUrl is a media:// URL, we need to extract the actual file path
    const cleanFilePath = cleanImageUrl?.replace('media://', '/') || null;
    const activeTileId = isCleanVisible && cleanFilePath
        ? cleanFilePath
        : (fileId || imageUrl.replace('media://', '/'));

    // Cursor styling based on active tool
    const getCursorClass = () => {
        if (activeTool === 'text') {
            return 'cursor-text'; // I-beam cursor for text
        }
        if (activeTool.startsWith('balloon-')) {
            return 'cursor-crosshair'; // Crosshair for balloons
        }
        return 'cursor-default';
    };

    return (
        <div ref={containerRef} className={`w-full h-full bg-[#1e1e1e] overflow-hidden relative ${getCursorClass()}`}>
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
                onDragEnd={handleDragEnd}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable={activeTool === 'select' && !editingId}
                onMouseDown={handleStageMouseDown}
                onMouseUp={handleStageMouseUp}
                onMouseMove={handleStageMouseMove}
            >
                <BackgroundLayer
                    isCleanVisible={isCleanVisible}
                    imgClean={imgClean}
                    imgOriginal={imgOriginal}
                    isLoaded={statusOriginal === 'loaded'}
                />

                <TilesLayer
                    imgOriginal={imgOriginal}
                    activeTileId={activeTileId}
                    stageScale={scale}
                    stageX={position.x}
                    stageY={position.y}
                    stageWidth={dimensions.width}
                    stageHeight={dimensions.height}
                />

                {showPanels && (
                    <PanelsLayer
                        panels={panels}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                        onUpdate={(id, attrs) => onUpdate(id, attrs)}
                    />
                )}

                <BalloonsLayer
                    balloons={balloons}
                    selectedId={selectedId}
                    selectedIds={selectedIds}
                    editingId={editingId}
                    showMasks={showMasks}
                    showBalloons={showBalloons}
                    showText={showText}
                    vertexEditingEnabled={vertexEditingEnabled}
                    curveEditingEnabled={curveEditingEnabled}
                    onSelect={handleSelect}
                    onUpdate={onUpdate}
                    onEditRequest={handleEditRequestInternal}
                    setEditingId={setEditingId}
                />

                {/* Drag Preview Layer - Show rectangle while dragging */}
                {dragPreview && dragPreview.width > 5 && dragPreview.height > 5 && (
                    <Layer>
                        <Rect
                            x={dragPreview.x}
                            y={dragPreview.y}
                            width={dragPreview.width}
                            height={dragPreview.height}
                            stroke={activeTool === 'text' ? '#06b6d4' : '#3b82f6'}
                            strokeWidth={2 / scale}
                            dash={[6 / scale, 4 / scale]}
                            fill={activeTool === 'text' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(59, 130, 246, 0.1)'}
                            listening={false}
                        />
                    </Layer>
                )}
            </Stage>
        </div>
    );
});
