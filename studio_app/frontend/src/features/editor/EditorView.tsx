import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { useEditorLogic } from '../../hooks/useEditorLogic';
import { Balloon } from '../../types';
import { EditorCanvas } from './canvas/EditorCanvas';
import { useEditorStore } from './store';

// --- NEW COMPONENTS & UTILS ---
import { useVectorization } from './hooks/useVectorization';
import { EditorSidebar } from './components/EditorSidebar';
import { VectorizeMenu } from './components/menus/VectorizeMenu';
import { TranslateMenu } from './components/menus/TranslateMenu';
import { AnimateMenu } from './components/menus/AnimateMenu';
import { RightSidebar } from './components/RightSidebar';
import { PanelPreviewModal } from './components/modals/PanelPreviewModal';
import { EditorHeader, EditorMode } from './components/layout/EditorHeader';
import { generatePanelPreviews } from './utils/panelUtils';

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
    const { balloons, addBalloon, updateBalloon, removeBalloon, panels, setPanels, removePanel } = useEditorStore();

    // --- STATE ---
    const [activeTool, setActiveTool] = useState<any>('select');
    const [activeMode, setActiveMode] = useState<EditorMode>('vectorize');

    // Toggles
    const [showMasks, setShowMasks] = useState(true);
    const [showBalloons, setShowBalloons] = useState(true);
    const [showText, setShowText] = useState(true);
    // isOriginalImage removed to fix lint error
    // const [isOriginalImage, setIsOriginalImage] = useState(false); 

    // Panel & Preview State
    const [showPanelsLayer, setShowPanelsLayer] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);

    // --- REFS ---
    const stageRef = useRef<Konva.Stage>(null);

    // --- DERIVED ---
    const displaySrc = cleanUrl || imageUrl;
    const visibleBalloons = balloons.filter(b => {
        if (b.type === 'mask') return showMasks;
        if (b.type === 'balloon') return showBalloons;
        return true;
    });

    const editor = useEditorLogic(fileId, initialBalloons, imageUrl);

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
                activeMode={activeMode}
                setActiveMode={setActiveMode}
                onBack={onBack}
                onSave={() => console.log("Save clicked")}
                onClose={() => window.location.href = '/'}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* 2. LEFT SIDEBAR */}
                <aside className="w-80 border-r border-zinc-800 bg-zinc-900 flex flex-col z-10">
                    {activeMode === 'vectorize' && (
                        <VectorizeMenu
                            workflowStep={vectorization.workflowStep}
                            isProcessing={vectorization.isProcessing}
                            // localCleanUrl removed
                            onCreateMask={vectorization.handleCreateMask}
                            onConfirmMask={vectorization.handleConfirmMask}
                            onDetectBalloon={vectorization.detectBalloon}
                            onDetectText={vectorization.detectText}
                            onCleanImage={vectorization.handleCleanImage}
                            showMasks={showMasks} setShowMasks={setShowMasks}
                            showBalloons={showBalloons} setShowBalloons={setShowBalloons}
                            showText={showText} setShowText={setShowText}
                            // isOriginalImage removed
                            canDetectBalloons={vectorization.canDetectBalloons}
                            canDetectText={vectorization.canDetectText}
                            canDetectPanels={vectorization.canDetectPanels}
                            hasBalloons={vectorization.hasBalloons}
                            hasText={vectorization.hasText}
                            hasPanels={vectorization.hasPanels}
                            onDetectPanels={vectorization.detectPanels}
                            onSeparatePanels={handleSeparatePanels} // <--- CONNECTED HERE
                            showPanelsLayer={showPanelsLayer} setShowPanelsLayer={setShowPanelsLayer}
                            isPanelsConfirmed={true}
                            onConfirmPanels={() => { }}
                            previewImages={previewImages}
                            onOpenPanelGallery={() => setShowPreview(true)}
                        />
                    )}

                    {activeMode === 'edit' && (
                        <EditorSidebar
                            editProps={{
                                selectedId: editor.selectedBubbleId,
                                balloons: balloons,
                                onDelete: (id: string) => {
                                    if (id?.startsWith('panel')) removePanel(id);
                                    else removeBalloon(id);
                                },
                                balloon: balloons.find(b => b.id === editor.selectedBubbleId)
                            }}
                            activeTool={activeTool}
                            setActiveTool={setActiveTool}
                        />
                    )}

                    {/* NEW MODULAR MENUS */}
                    {activeMode === 'translate' && <TranslateMenu />}
                    {activeMode === 'animate' && <AnimateMenu />}
                </aside>

                {/* 3. CANVAS AREA */}
                <main className="flex-1 relative bg-[#121214] overflow-hidden flex items-center justify-center min-w-0">
                    <EditorCanvas
                        ref={stageRef}
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

                {/* 4. RIGHT SIDEBAR */}
                <aside className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col z-10 shrink-0 transition-all">
                    {activeMode === 'edit' && (
                        <div className="h-full overflow-y-auto">
                            <RightSidebar
                                width={300}
                                activeTool={activeTool}
                                setActiveTool={(t) => setActiveTool(t)}
                            />
                        </div>
                    )}
                </aside>
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
