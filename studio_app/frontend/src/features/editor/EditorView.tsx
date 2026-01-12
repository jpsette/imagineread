
import React, { useState, useEffect } from 'react';
import { useEditorLogic } from '../../hooks/useEditorLogic';
import { Balloon } from '../../types';
import { EditorCanvas } from './canvas/EditorCanvas';
import { api } from '../../services/api';
import { useEditorStore } from './store';
import { useAppStore } from '../../store/useAppStore';
import { Save, Check } from 'lucide-react';

// New Imports
import { useVectorization } from './hooks/useVectorization';
import { EditorSidebar } from './components/EditorSidebar';

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
    // --- GLOBAL STORE ---
    const { balloons, setBalloons } = useEditorStore();

    // --- CORE LOGIC (For Coordinate Scaling & Selection) ---
    const editor = useEditorLogic(fileId, initialBalloons, imageUrl);
    const { imgNaturalSize } = editor;

    // --- LOCAL STATE (Layout & Nav) ---
    const [activeMode, setActiveMode] = useState<EditorMode>('vectorize');
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isResizing, setIsResizing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // --- FEATURE HOOKS ---
    const vectorization = useVectorization({
        imageUrl,
        fileId,
        imgNaturalSize,
        editor,
        cleanUrl
    });

    // --- VISUAL TOGGLES (Owned by Orchestrator for Canvas logic) ---
    const [showMasks, setShowMasks] = useState(true);
    const [showBalloons, setShowBalloons] = useState(true);
    const [showText, setShowText] = useState(true);
    const [isOriginalImage, setIsOriginalImage] = useState(true);

    // --- INITIALIZATION ---
    useEffect(() => {
        // Reset state on page load
        vectorization.setWorkflowStep('idle');
        vectorization.setLocalCleanUrl(cleanUrl || null);
        setIsOriginalImage(true);
        setShowMasks(true);
        setShowBalloons(true);
        setShowText(true);

        // CRITICAL: Reset balloons store for the new file.
        setBalloons(initialBalloons || []);
    }, [fileId, imageUrl, cleanUrl, initialBalloons]);

    // --- RESIZING LOGIC ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = Math.max(250, Math.min(450, e.clientX));
            setSidebarWidth(newWidth);
        };
        const handleMouseUp = () => { setIsResizing(false); };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
        } else {
            document.body.style.cursor = 'default';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (editor.selectedBubbleId) editor.handleDeleteBalloon();
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                const { undo } = useAppStore.getState();
                const prevState = undo(balloons);
                if (prevState) setBalloons(prevState);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor.selectedBubbleId, balloons, setBalloons]);

    // --- SAVE LOGIC ---
    const handleSave = async () => {
        if (saveStatus === 'saving') return;
        setSaveStatus('saving');
        try {
            await api.updateFileBalloons(fileId, balloons);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            console.error("Erro ao salvar:", e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    // --- VIEW LOGIC ---
    // Use localCleanUrl from Hook if not original
    const displaySrc = isOriginalImage ? imageUrl : (vectorization.localCleanUrl || imageUrl);

    const visibleBalloons = React.useMemo(() => {
        let filtered = balloons;
        if (!showMasks) filtered = filtered.filter(b => b.type !== 'mask');
        if (!showBalloons) filtered = filtered.filter(b => b.type !== 'balloon');
        if (!showText) filtered = filtered.map(b => ({ ...b, text: '' }));

        return [...filtered].sort((a, b) => {
            if (a.type === 'mask' && b.type !== 'mask') return 1;
            if (a.type !== 'mask' && b.type === 'mask') return -1;
            return 0;
        });
    }, [balloons, showMasks, showBalloons, showText]);

    // --- PROPS FOR MENUS ---
    const vectorizeProps = {
        workflowStep: vectorization.workflowStep,
        isProcessing: vectorization.isProcessing,
        localCleanUrl: vectorization.localCleanUrl,
        onCreateMask: vectorization.handleCreateMask,
        onConfirmMask: vectorization.handleConfirmMask,
        onDetectBalloon: () => {
            vectorization.handleDetectBalloon();
            setShowMasks(false); // UI Side Effect
        },
        onDetectText: vectorization.handleDetectText,
        onCleanImage: () => vectorization.handleCleanImage(() => setIsOriginalImage(false)), // Auto-switch on success

        // Toggles
        showMasks, setShowMasks,
        showBalloons, setShowBalloons,
        showText, setShowText,
        isOriginalImage, setIsOriginalImage,
        balloons // Pass data for button disabled states
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] overflow-hidden text-sans">

            {/* HEADER */}
            <header className="relative h-12 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4 z-50 shrink-0">
                <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                    ← Voltar
                </button>

                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6 h-full">
                    {[
                        { id: 'vectorize', label: 'Vetorizar' },
                        { id: 'edit', label: 'Editar' },
                        { id: 'translate', label: 'Traduzir' },
                        { id: 'animate', label: 'Animar' }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setActiveMode(mode.id as EditorMode)}
                            className={`h-full px-2 text-sm font-medium transition-all relative ${activeMode === mode.id
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {mode.label}
                            {activeMode === mode.id && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-w-[140px] justify-center
                            ${saveStatus === 'idle' ? 'bg-[#007AFF] hover:bg-[#0062cc] text-white' : ''}
                            ${saveStatus === 'saving' ? 'bg-gray-700 text-gray-400 cursor-wait' : ''}
                            ${saveStatus === 'saved' ? 'bg-emerald-600 text-white' : ''}
                            ${saveStatus === 'error' ? 'bg-red-600 text-white' : ''}
                        `}
                    >
                        {saveStatus === 'idle' && <><Save size={16} /> Salvar Alterações</>}
                        {saveStatus === 'saving' && <><span className="animate-spin">⏳</span> Salvando...</>}
                        {saveStatus === 'saved' && <><Check size={16} /> Salvo</>}
                        {saveStatus === 'error' && <>Erro ao Salvar</>}
                    </button>
                    <button onClick={onBack} className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-[#333]">
                        ✕
                    </button>
                </div>
            </header>

            {/* MAIN AREA */}
            <div className="flex-1 relative w-full h-full bg-[#1e1e1e] overflow-hidden">
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <EditorCanvas
                        imageUrl={displaySrc}
                        balloons={visibleBalloons}
                        selectedId={editor.selectedBubbleId}
                        onSelect={(id) => editor.setSelectedBubbleId(id)}
                        onUpdate={(id, attrs) => {
                            const next = balloons.map(b => b.id === id ? { ...b, ...attrs } : b);
                            setBalloons(next);
                        }}
                        onImageLoad={(w, h) => editor.setImgNaturalSize({ w, h })}
                    />
                </div>

                <EditorSidebar
                    activeMode={activeMode}
                    sidebarWidth={sidebarWidth}
                    setIsResizing={setIsResizing}
                    vectorizeProps={vectorizeProps}
                />
            </div>
        </div>
    );
};

export default EditorView;
