import React, { useEffect, useRef } from 'react';
import Konva from 'konva';
import { Toaster } from 'sonner';
import { useEditorLogic } from '../../hooks/useEditorLogic';
import { Balloon } from '../../types';
import { useEditorStore } from './store';
import { useEditorUIStore } from './uiStore';

// --- NEW COMPONENTS & UTILS ---
import { useVectorization } from './hooks/useVectorization';
import { useShortcutManager } from './hooks/useShortcutManager'; // NEW
import { PanelPreviewModal } from './components/modals/PanelPreviewModal';
import { EditorHeader } from './components/layout/EditorHeader';
import { generatePanelPreviews } from './utils/panelUtils';

// LAYOUT COMPONENTS
import { EditorLeftPanel } from './components/layout/EditorLeftPanel';
import { EditorRightPanel } from './components/layout/EditorRightPanel';
import { EditorCanvasContainer } from './components/layout/EditorCanvasContainer';
import { Filmstrip } from './components/layout/Filmstrip'; // NEW

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

    // --- STATE ---
    // --- UI STORE (Layout & Modals) ---
    const {
        showPreview, setShowPreview,
        previewImages, setPreviewImages
    } = useEditorUIStore();

    // --- REFS ---
    const stageRef = useRef<Konva.Stage>(null);

    // --- DERIVED ---
    const editor = useEditorLogic(fileId, initialBalloons, imageUrl);

    // --- HOOKS ---
    useShortcutManager(); // SHORTCUTS MANAGER

    const vectorization = useVectorization({
        imageUrl,
        fileId,
        imgNaturalSize: editor.imgNaturalSize,
        editor,
        cleanUrl,
        currentBalloons: balloons,
        currentPanels: panels
    });

    // --- HANDLERS ---

    // THE FIX: Use the utility to crop images from the stage
    const handleSeparatePanels = async () => {
        console.log("🎬 Initiating Panel Separation...");

        // Call the utility function we created in Step 1
        const croppedImages = generatePanelPreviews(stageRef.current, panels);

        if (croppedImages.length > 0) {
            console.log(`✅ Success! ${croppedImages.length} panels cropped.`);
            setPreviewImages(croppedImages);
            setShowPreview(true);
        } else {
            console.warn("⚠️ No panels were cropped. Check stage ref or panel data.");
        }
    };

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;

            // DELETE
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (editor.selectedBubbleId) {
                    if (editor.selectedBubbleId.startsWith('panel')) {
                        removePanel(editor.selectedBubbleId);
                        editor.setSelectedBubbleId(null);
                    } else {
                        removeBalloon(editor.selectedBubbleId);
                        editor.setSelectedBubbleId(null);
                    }
                }
            }
            // UNDO / REDO
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                const { undo, redo } = useEditorStore.temporal.getState();
                e.shiftKey ? redo() : undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor.selectedBubbleId, balloons, removeBalloon, editor, removePanel]);

    return (
        <div className="flex flex-col h-screen bg-[#121214] text-white overflow-hidden">

            {/* 1. REFACTORED HEADER */}
            <EditorHeader
                onBack={onBack}
                onSave={editor.saveChanges}
                onClose={() => window.location.href = '/'}
            />
            <Toaster richColors position="top-center" />

            <div className="flex flex-1 overflow-hidden">
                {/* 2. LEFT SIDEBAR (Smart Container) */}
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



                {/* CENTER CANVAS AREA */}
                <div className="flex-1 relative flex flex-col min-w-0 bg-[#1e1e1e]">
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

                {/* 4. RIGHT SIDEBAR (Smart Container) */}
                <EditorRightPanel />
            </div>

            {/* MODAL FOR PREVIEWS */}
            <PanelPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                images={previewImages}
            />
        </div>
    );
};

export default EditorView;
