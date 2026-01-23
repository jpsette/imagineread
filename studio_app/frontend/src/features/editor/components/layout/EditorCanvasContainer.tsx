import React, { forwardRef } from 'react';
import Konva from 'konva';
import { EditorCanvas } from '../../canvas/EditorCanvas';
import { useEditorStore } from '../../store';
import { useEditorUIStore } from '../../uiStore';

interface EditorCanvasContainerProps {
    editor: any; // The editor logic hook return
    imageUrl: string;
}

const EditorCanvasContainerBase = forwardRef<Konva.Stage, EditorCanvasContainerProps>(({
    editor,
    imageUrl,
}, ref) => {
    // Stores
    const { balloons, addBalloon, updateBalloon, removeBalloon, panels, setPanels } = useEditorStore();
    const { activeTool, setActiveTool, showMasks, showBalloons, showText, showPanelsLayer } = useEditorUIStore();

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
        <main className="flex-1 relative bg-transparent overflow-hidden flex items-center justify-center min-w-0">
            <EditorCanvas
                ref={ref}
                imageUrl={displaySrc}
                balloons={visibleBalloons}
                panels={panels}
                showPanels={showPanelsLayer}
                selectedId={editor.selectedBubbleId}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                onSelect={(id) => editor.setSelectedBubbleId(id)}
                onUpdate={(id, attrs) => {
                    if (panels.find(p => p.id === id)) {
                        const newPanels = panels.map(p => p.id === id ? { ...p, ...attrs } : p);
                        // @ts-ignore
                        setPanels(newPanels);
                    } else {
                        updateBalloon(id, attrs);
                    }
                }}
                onImageLoad={(w, h) => editor.setImgNaturalSize({ w, h })}
                onBalloonAdd={addBalloon}
                editingId={null}
                setEditingId={() => { }}
            />
        </main>
    );
});

EditorCanvasContainerBase.displayName = 'EditorCanvasContainer';

export const EditorCanvasContainer = React.memo(EditorCanvasContainerBase);
