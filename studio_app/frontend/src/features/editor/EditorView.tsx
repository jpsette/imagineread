
import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom'; // REMOVED: using window.location for robust reset
import { useEditorLogic } from '../../hooks/useEditorLogic';
import { Balloon } from '../../types';
import { EditorCanvas } from './canvas/EditorCanvas';
import { useEditorStore } from './store';
import Konva from 'konva';

import { Save, ArrowLeft, X } from 'lucide-react';

// New Imports
import { useVectorization } from './hooks/useVectorization';
import { EditorSidebar } from './components/EditorSidebar';
import { VectorizeMenu } from './components/menus/VectorizeMenu';
import { RightSidebar } from './components/RightSidebar';
import { PanelPreviewModal } from './components/modals/PanelPreviewModal'; // IMPORT MODAL

// --- TYPES ---
type EditorMode = 'vectorize' | 'edit' | 'translate' | 'animate';

interface EditorViewProps {
    imageUrl: string;
    fileId: string;
    initialBalloons?: Balloon[] | null;
    cleanUrl?: string | null;
    onBack?: () => void;
    comicName?: string;
    pageName?: string;
}

export const EditorView: React.FC<EditorViewProps> = ({
    imageUrl,
    fileId,
    initialBalloons,
    cleanUrl,
    onBack = () => window.history.back()
}) => {
    // const navigate = useNavigate(); // REMOVED

    // --- GLOBAL STORE ---
    const { balloons, addBalloon, updateBalloon, removeBalloon, panels, setPanels, removePanel } = useEditorStore();

    // --- STATE ---
    const [activeTool, setActiveTool] = useState<any>('select');
    const [activeMode, setActiveMode] = useState<EditorMode>('vectorize');

    // Visibility Toggles

    // Visibility Toggles
    const [showMasks, setShowMasks] = useState(true);
    const [showBalloons, setShowBalloons] = useState(true);
    const [showText, setShowText] = useState(true);
    const [isOriginalImage, setIsOriginalImage] = useState(false);

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

    // --- CORE LOGIC (For Coordinate Scaling & Selection) ---
    const editor = useEditorLogic(fileId, initialBalloons, imageUrl);
    // const { setSelectedBubbleId } = editor;

    // --- VECTORIZATION LOGIC ---
    const vectorization = useVectorization({
        imageUrl,
        fileId,
        imgNaturalSize: editor.imgNaturalSize,
        editor,
        cleanUrl,
        currentBalloons: balloons,
        currentPanels: panels
    });

    // Handle Separation (Snapshotting)
    const handleSeparatePanels = async () => {
        if (!panels.length || !stageRef.current) return;

        // Simple logic: Use current stage to extract images
        // Ideally we use original image but looking at Task #15 it was implemented.
        // Re-implementing basic version:
        // const stage = stageRef.current;
        // const layer = stage.findOne('Layer'); 
        // We can just iterate panels and crop from the loaded image URL or stage.
        // For now, let's just log or set dummy to verify UI works.
        console.log("Separating panels...");
        // TODO: Implement actual cropping
        setPreviewImages([]);
        setShowPreview(true);
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
                        editor.setSelectedBubbleId(null); // Clear selection
                    }
                }
            }

            // UNDO / REDO
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                const { undo, redo } = useEditorStore.temporal.getState();

                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor.selectedBubbleId, balloons, removeBalloon, editor, removePanel]);

    return (
        <div className="flex flex-col h-screen bg-[#121214] text-white overflow-hidden">

            {/* --- HEADER (Full Width) --- */}
            {/* Added z-50 to ensure it's on top and relative */}
            <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900 shrink-0 z-50 relative">

                {/* LEFT: Back Button */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                        <ArrowLeft size={16} />
                        <span>Voltar</span>
                    </button>
                </div>

                {/* CENTER: Navigation Tabs */}
                {/* Apply no-drag to nav container to allow clicking tabs */}
                <nav
                    className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                >
                    {['Vetorizar', 'Editar', 'Traduzir', 'Animar'].map((tab) => {
                        const key = tab === 'Vetorizar' ? 'vectorize' : tab === 'Editar' ? 'edit' : tab === 'Traduzir' ? 'translate' : 'animate';
                        const isActive = activeMode === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveMode(key as any)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${isActive
                                    ? 'bg-zinc-800 text-blue-400 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </nav>

                {/* RIGHT: Actions */}
                <div className="flex items-center gap-3">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                        style={{ WebkitAppRegion: 'no-drag' } as any}
                    >
                        <Save size={16} />
                        <span>Salvar</span>
                    </button>
                    <button
                        onClick={() => {
                            console.log("❌ Close Button Clicked! Force reloading to clear state...");
                            // FIX: App.tsx uses state for visibility, so navigate() doesn't work.
                            // We force a reload/redirect to root to ensure clean exit.
                            window.location.href = '/';
                        }}
                        className="text-zinc-500 hover:text-white p-2 transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-800"
                        title="Fechar Editor"
                        style={{ WebkitAppRegion: 'no-drag', cursor: 'pointer' } as any}
                    >
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <div className="flex flex-1 overflow-hidden">

                {/* CONDITIONAL SIDEBARS BASED ON ACTIVE TAB */}
                <aside className="w-80 border-r border-zinc-800 bg-zinc-900 flex flex-col z-10">
                    {activeMode === 'vectorize' && (
                        <VectorizeMenu
                            // State
                            workflowStep={vectorization.workflowStep}
                            isProcessing={vectorization.isProcessing}
                            localCleanUrl={vectorization.localCleanUrl}

                            // Actions
                            onCreateMask={vectorization.handleCreateMask}
                            onConfirmMask={vectorization.handleConfirmMask}
                            onDetectBalloon={vectorization.detectBalloon}
                            onDetectText={vectorization.detectText}
                            onCleanImage={vectorization.handleCleanImage}

                            // Toggles
                            showMasks={showMasks} setShowMasks={setShowMasks}
                            showBalloons={showBalloons} setShowBalloons={setShowBalloons}
                            showText={showText} setShowText={setShowText}
                            isOriginalImage={isOriginalImage} setIsOriginalImage={setIsOriginalImage}

                            // Flags
                            canDetectBalloons={vectorization.canDetectBalloons}
                            canDetectText={vectorization.canDetectText}
                            canDetectPanels={vectorization.canDetectPanels}
                            hasBalloons={vectorization.hasBalloons}
                            hasText={vectorization.hasText}
                            hasPanels={vectorization.hasPanels}

                            onDetectPanels={vectorization.detectPanels}

                            // Panel Separation
                            onSeparatePanels={handleSeparatePanels}
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
                    {activeMode === 'translate' && (
                        <div className="p-4 text-zinc-500 font-medium text-sm text-center mt-10">
                            Menu de Tradução
                        </div>
                    )}
                    {activeMode === 'animate' && (
                        <div className="p-4 text-zinc-500 font-medium text-sm text-center mt-10">
                            Menu de Animação
                        </div>
                    )}
                    {/* Add placeholders for Translate/Animate if needed */}
                </aside>

                {/* CANVAS AREA */}
                <main className="flex-1 relative bg-[#121214] overflow-hidden flex items-center justify-center min-w-0">
                    <EditorCanvas
                        ref={stageRef}
                        imageUrl={displaySrc}
                        balloons={visibleBalloons}
                        panels={panels}
                        showPanels={showPanelsLayer} // Pass visibility
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

                {/* 3. RIGHT SIDEBAR (Dynamic) */}
                <aside className="w-80 border-l border-zinc-800 bg-zinc-900 flex flex-col z-10 shrink-0 transition-all">

                    {/* CASE 1: VECTORIZE TAB (Placeholder for future Panel options) */}
                    {activeMode === 'vectorize' && (
                        <div className="p-4 text-zinc-600 text-sm text-center mt-10">
                            {/* Empty for now, as requested */}
                        </div>
                    )}

                    {/* CASE 2: EDIT TAB ( The Actual Properties Panel ) */}
                    {activeMode === 'edit' && (
                        <div className="h-full overflow-y-auto">
                            <RightSidebar
                                width={300} // Prop maintained but ignored in style
                                activeTool={activeTool}
                                setActiveTool={(t) => setActiveTool(t)}
                            />
                        </div>
                    )}

                    {/* CASE 3: TRANSLATE TAB */}
                    {activeMode === 'translate' && (
                        <div className="p-4 text-zinc-600 text-sm text-center mt-10">
                            {/* Empty for now */}
                        </div>
                    )}

                    {/* CASE 4: ANIMATE TAB */}
                    {activeMode === 'animate' && (
                        <div className="p-4 text-zinc-600 text-sm text-center mt-10">
                            {/* Empty for now */}
                        </div>
                    )}

                </aside>
            </div>

            {/* PANEL PREVIEW MODAL */}
            <PanelPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                images={previewImages}
            />
        </div>
    );
};

export default EditorView;
