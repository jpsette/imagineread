import React, { useRef } from 'react';
import Konva from 'konva';
import { Toaster } from 'sonner';
import { useEditorLogic } from '../../hooks/useEditorLogic';
import { Balloon } from '../../types';
import { useEditorStore } from './store';
import { useEditorUIStore } from './uiStore';

// --- NEW COMPONENTS & UTILS ---
import { useVectorization } from './hooks/useVectorization';
import { useShortcutManager } from './hooks/useShortcutManager';
import { usePanelWorkflow } from './hooks/usePanelWorkflow';
import { PanelPreviewModal } from './components/modals/PanelPreviewModal';
import { EditorHeader } from './components/layout/EditorHeader';

// LAYOUT COMPONENTS
import { EditorLeftPanel } from './components/layout/EditorLeftPanel';
import { EditorRightPanel } from './components/layout/EditorRightPanel';
import { EditorCanvasContainer } from './components/layout/EditorCanvasContainer';
import { Filmstrip } from './components/layout/Filmstrip';

interface EditorViewProps {
    imageUrl: string;
    fileId: string;
    initialBalloons?: Balloon[] | null;
    cleanUrl?: string | null;
    onBack?: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
    imageUrl,
    fileId,
    initialBalloons,
    cleanUrl,
    onBack = () => window.history.back()
}) => {

    // --- GLOBAL STORE ---
    const { balloons, removeBalloon, removePanel, panels } = useEditorStore();

    // --- UI STORE ---
    const {
        showPreview, setShowPreview,
        previewImages
    } = useEditorUIStore();

    // --- REFS ---
    const stageRef = useRef<Konva.Stage>(null);

    // --- LOGIC HOOKS ---
    const editor = useEditorLogic(fileId, initialBalloons, imageUrl, cleanUrl);

    // 1. Shortcuts (Handles Delete/Undo/Redo)
    useShortcutManager(editor);

    // 2. Vectorization (Data independent)
    const vectorization = useVectorization({
        imageUrl,
        fileId,
        imgNaturalSize: editor.imgNaturalSize,
        editor,
        cleanUrl,
        currentBalloons: balloons,
        currentPanels: panels
    });

    // 3. Panel Workflow (Separated logic)
    const { handleSeparatePanels } = usePanelWorkflow({
        stageRef,
        panels
    });

    return (
        <div
            className="flex flex-col h-screen bg-[#121214] text-white overflow-hidden"
            style={{ animation: 'editorFadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        >
            <style>{`
                @keyframes editorFadeIn {
                    from { opacity: 0; transform: scale(0.99); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>

            {/* HEADER */}
            <EditorHeader
                onBack={onBack}
                onSave={editor.saveChanges}
                onClose={() => window.location.href = '/'}
            />
            <Toaster richColors position="top-center" />

            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR */}
                <EditorLeftPanel
                    vectorization={vectorization}
                    editProps={{
                        selectedId: editor.selectedBubbleId,
                        balloons: balloons,
                        onDelete: (id: string) => {
                            if (id?.startsWith('panel')) removePanel(id);
                            else removeBalloon(id);
                        },
                        balloon: balloons.find(b => b.id === editor.selectedBubbleId)
                    }}
                    handleSeparatePanels={handleSeparatePanels}
                    previewImages={previewImages}
                    onOpenPanelGallery={() => setShowPreview(true)}
                />

                {/* CENTER CANVAS AREA - Animating ONLY this part */}
                {/* CENTER CANVAS AREA - STATIC BACKGROUND CONTAINER */}
                <div className="flex-1 relative flex flex-col min-w-0 bg-[#1e1e1e]"> {/* STABLE BACKGROUND */}

                    {/* DYNAMIC CONTENT - Remounts on file change */}
                    <div
                        // key={fileId} <-- REMOVING THIS IS CRITICAL
                        className="flex-1 relative overflow-hidden flex flex-col"
                    // style={{ animation: 'editorFadeIn 0.35s ease-out' }} <-- REMOVING ANIMATION
                    >
                        <div className="flex-1 relative overflow-hidden">
                            <EditorCanvasContainer
                                ref={stageRef}
                                editor={editor}
                                imageUrl={imageUrl}
                                cleanUrl={cleanUrl}
                            />
                        </div>
                        <Filmstrip fileId={fileId} />
                    </div>

                </div>

                {/* RIGHT SIDEBAR */}
                <EditorRightPanel />
            </div>

            {/* MODALS */}
            <PanelPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                images={previewImages}
            />
        </div>
    );
};

export default EditorView;
