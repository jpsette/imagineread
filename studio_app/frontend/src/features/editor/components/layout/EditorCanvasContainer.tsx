import React, { forwardRef } from 'react';
import Konva from 'konva';
import { EditorCanvas } from '../../canvas/EditorCanvas';
import { useEditorStore } from '../../store';
import { useEditorUIStore } from '../../uiStore';

interface EditorCanvasContainerProps {
    imageUrl: string;
    onCanvasReady: (ready: boolean) => void;
    onImageDimensionsLoaded: (w: number, h: number) => void;
}

const EditorCanvasContainerBase = forwardRef<Konva.Stage, EditorCanvasContainerProps>(({
    imageUrl,
    onCanvasReady,
    onImageDimensionsLoaded
}, ref) => {
    // Stores
    const { balloons, addBalloon, updateBalloon, removeBalloon, panels, setPanels } = useEditorStore();

    // Optimizing Selectors to avoid re-render on 'zoom' or 'selectedId' changes which this component doesn't paint directly
    const activeTool = useEditorUIStore(s => s.activeTool);
    const setActiveTool = useEditorUIStore(s => s.setActiveTool);
    const showMasks = useEditorUIStore(s => s.showMasks);
    const showBalloons = useEditorUIStore(s => s.showBalloons);
    const showText = useEditorUIStore(s => s.showText);
    const showPanelsLayer = useEditorUIStore(s => s.showPanelsLayer);

    const handleImageLoad = React.useCallback((w: number, h: number) => {
        if (w && h) {
            onImageDimensionsLoaded(w, h);
        }
    }, [onImageDimensionsLoaded]);

    // FIXED: Always pass the original image as base. 
    // The EditorCanvas handles the Clean Image overlay internally via Store.
    const displaySrc = imageUrl;

    // Filter Balloons based on visibility settings
    const visibleBalloons = balloons.filter(b => {
        if (b.type === 'mask') return showMasks;
        if (b.type === 'balloon') return showBalloons;
        return true; // text usually inside balloon, but if we had robust layer logic...
    });

    return (
        <main className="flex-1 relative bg-transparent overflow-hidden min-w-0">
            <EditorCanvas
                ref={ref}
                imageUrl={displaySrc}
                balloons={visibleBalloons}
                panels={panels}
                showPanels={showPanelsLayer}
                onUpdate={(id, attrs) => {
                    if (panels.find(p => p.id === id)) {
                        const newPanels = panels.map(p => p.id === id ? { ...p, ...attrs } : p);
                        // @ts-ignore
                        setPanels(newPanels);
                    } else {
                        updateBalloon(id, attrs);
                    }
                }}
                onImageLoad={handleImageLoad}
                onBalloonAdd={addBalloon}
                editingId={null}
                setEditingId={() => { }}
                onCanvasReady={onCanvasReady}
            />
        </main>
    );
});

EditorCanvasContainerBase.displayName = 'EditorCanvasContainer';

export const EditorCanvasContainer = React.memo(EditorCanvasContainerBase);
