import React, { forwardRef } from 'react';
import Konva from 'konva';
import { EditorCanvas } from '@features/editor/canvas/EditorCanvas';
import { useEditorStore } from '@features/editor/store';
import { useEditorUIStore } from '@features/editor/uiStore';
import { commandManager } from '@features/editor/commands/CommandManager';
import { UpdatePanelCommand } from '@features/editor/commands/panelCommands';
import { UpdateBalloonCommand } from '@features/editor/commands/balloonCommands';

interface EditorCanvasContainerProps {
    imageUrl: string;
    fileId?: string;
    onCanvasReady: (ready: boolean) => void;
    onImageDimensionsLoaded: (w: number, h: number) => void;
}

const EditorCanvasContainerBase = forwardRef<Konva.Stage, EditorCanvasContainerProps>(({
    imageUrl,
    fileId,
    onCanvasReady,
    onImageDimensionsLoaded
}, ref) => {
    // Stores
    const { balloons, addBalloonUndoable, panels } = useEditorStore();

    // Optimizing Selectors
    const showMasks = useEditorUIStore(s => s.showMasks);
    const showBalloons = useEditorUIStore(s => s.showBalloons);
    const showPanelsLayer = useEditorUIStore(s => s.showPanelsLayer);

    // Local Editing State
    const [editingId, setEditingId] = React.useState<string | null>(null);

    const handleImageLoad = React.useCallback((w: number, h: number) => {
        if (w && h) {
            onImageDimensionsLoaded(w, h);
        }
    }, [onImageDimensionsLoaded]);

    const displaySrc = imageUrl;

    // Filter Balloons
    const visibleBalloons = balloons.filter(b => {
        if (b.type === 'mask') return showMasks;
        if (b.type === 'balloon') return showBalloons;
        return true;
    });

    return (
        <main className="flex-1 relative bg-transparent overflow-hidden min-w-0">
            <EditorCanvas
                ref={ref}
                imageUrl={displaySrc}
                fileId={fileId}
                balloons={visibleBalloons}
                panels={panels}
                showPanels={showPanelsLayer}
                onUpdate={(id, attrs) => {
                    if (panels.find(p => p.id === id)) {
                        // Use Command Pattern for Panels
                        commandManager.execute(new UpdatePanelCommand(id, attrs as any));
                    } else {
                        // Use Command Pattern for Balloons
                        commandManager.execute(new UpdateBalloonCommand(id, attrs as any));
                    }
                }}
                onImageLoad={handleImageLoad}
                onBalloonAdd={addBalloonUndoable}
                editingId={editingId}
                setEditingId={setEditingId}
                onCanvasReady={onCanvasReady}
            />
        </main>
    );
});

EditorCanvasContainerBase.displayName = 'EditorCanvasContainer';

export const EditorCanvasContainer = React.memo(EditorCanvasContainerBase);
