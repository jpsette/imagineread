import React, { useRef, useState, useEffect } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useEditorLogic } from '../../hooks/useEditorLogic';
import { VectorBubble } from './VectorBubble';
import { Balloon } from '../../types';
import { EditorTopBar, WorkspaceMode } from './EditorTopBar';
import { EditorialToolbar } from './EditorialToolbar';
import { StylePanel, TextPanel, ShapePanel } from './InspectorPanels';
import { HistoryPanel } from './HistoryPanel';
import { DraggableWindow } from '../../ui/DraggableWindow';
import { useAppStore } from '../../store/useAppStore';
import { ViewModeSwitcher, ViewMode } from './ViewModeSwitcher';

interface EditorViewProps {
    imageUrl: string
    fileId: string
    initialBalloons?: Balloon[] | null
    cleanUrl?: string | null
    onBack: () => void
    comicName?: string
    pageName?: string
}

const EditorView: React.FC<EditorViewProps> = ({ imageUrl, fileId, initialBalloons, cleanUrl, onBack, comicName, pageName }) => {
    // Refs for layout
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);

    // Workspace State
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMode>('vectorize');

    // View Mode State
    const [viewMode, setViewMode] = useState<ViewMode>(cleanUrl ? 'clean' : 'original');
    const [hideBalloons, setHideBalloons] = useState(false);

    // Window State
    const [windows, setWindows] = useState({
        history: false,
        style: true,
        text: false,
        shape: false
    });

    const toggleWindow = (key: keyof typeof windows) => {
        setWindows(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Logic Hook
    const editor = useEditorLogic(fileId, initialBalloons, imageUrl);

    // Store Hooks for History
    const {
        undo,
        redo,
        historyPast,
        historyFuture
    } = useAppStore();

    // Initial Scroll Center
    useEffect(() => {
        if (scrollContainerRef.current && editor.imgNaturalSize.w > 0) {
            const container = scrollContainerRef.current;
            const centerX = (container.scrollWidth - container.clientWidth) / 2;
            const centerY = (container.scrollHeight - container.clientHeight) / 2;
            container.scrollLeft = centerX;
            container.scrollTop = centerY;
        }
    }, [editor.imgNaturalSize]);

    // Manual Non-Passive Wheel Listener (Fixes "Unable to preventDefault")
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                editor.setZoom(z => Math.max(0.1, Math.min(4, z + delta)));
            }
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, [editor.setZoom]);


    // Handle Workspace Switch
    const handleWorkspaceChange = (mode: WorkspaceMode) => {
        setActiveWorkspace(mode);
        // Reset windows logic on switch? optional. 
        if (mode === 'editorial') {
            setWindows(prev => ({ ...prev, style: true }));
        }
    };

    // Effective Image Logic
    // Auto-switch logic
    useEffect(() => {
        if (editor.cleanImageUrl || cleanUrl) {
            setViewMode('clean');
        }
    }, [editor.cleanImageUrl, cleanUrl]);

    useEffect(() => {
        if (editor.maskPreviewUrl) {
            setViewMode('mask');
            setHideBalloons(true); // Auto-hide balloons when viewing mask for clarity
        }
    }, [editor.maskPreviewUrl]);

    // Determine Display Image Source
    let displaySrc = imageUrl; // Default
    if (viewMode === 'clean' && (editor.cleanImageUrl || cleanUrl)) {
        displaySrc = editor.cleanImageUrl || cleanUrl as string;
    }
    else if (viewMode === 'mask' && editor.maskPreviewUrl) {
        displaySrc = editor.maskPreviewUrl;
    }

    // Auto-open style panel when balloon selected (if in editorial)
    useEffect(() => {
        if (editor.selectedBubbleId && activeWorkspace === 'editorial') {
            // Ensure at least one panel is open? 
            if (!windows.style && !windows.text && !windows.shape) {
                setWindows(prev => ({ ...prev, style: true }));
            }
        }
    }, [editor.selectedBubbleId, activeWorkspace]);

    const hasDetections = (editor.yoloDetections && editor.yoloDetections.length > 0) || (editor.balloons && editor.balloons.length > 0);

    return (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-gray-200">

            {/* 1. TOP BAR (Dynamic) */}
            <div className="bg-[#141416]">
                <EditorTopBar
                    activeWorkspace={activeWorkspace}
                    setActiveWorkspace={handleWorkspaceChange}
                    comicName={comicName}
                    pageName={pageName}
                    onBack={onBack}

                    // Vectorize Actions
                    actions={{
                        onAddBalloon: editor.handleAddBalloon,
                        onDetect: editor.handleYOLOAnalyze,
                        onImport: editor.handleImportBalloons,
                        onOCR: editor.handleOCR,
                        onClean: editor.handleCleanPage,
                        isAnalyzingYOLO: editor.analyzingYOLO,
                        isReadingOCR: editor.readingOCR,
                        isCleaning: editor.isCleaning,

                        // Status Flags
                        hasDetections: hasDetections,
                        hasBalloons: (editor.balloons && editor.balloons.length > 0),
                        hasText: editor.balloons.some(b => b.text && b.text.trim().length > 0),
                        isClean: !!editor.cleanImageUrl || !!editor.maskPreviewUrl || !!cleanUrl,

                        // Legacy / Placeholder
                        showClean: false,
                        setShowClean: () => { }
                    }}
                />

                {/* 2. EDITORIAL TOOLBAR (Replaces Sub-bar for Editorial) */}
                {activeWorkspace === 'editorial' && (
                    <EditorialToolbar
                        onUndo={() => {
                            const restored = undo(editor.balloons);
                            if (restored) editor.setBalloons(restored);
                        }}
                        onRedo={() => {
                            const restored = redo(editor.balloons);
                            if (restored) editor.setBalloons(restored);
                        }}
                        canUndo={historyPast.length > 0}
                        canRedo={historyFuture.length > 0}
                        isHidden={hideBalloons}
                        onToggleHidden={() => setHideBalloons(!hideBalloons)}
                        windowsState={windows}
                        toggleWindow={toggleWindow}
                    />
                )}
            </div>

            <div className="flex-1 overflow-hidden flex relative">

                {/* VIEW MODE SWITCHER (Absolute) */}
                <ViewModeSwitcher
                    mode={viewMode}
                    setMode={setViewMode}
                    hasClean={!!(editor.cleanImageUrl || cleanUrl)}
                    hasMask={!!editor.maskPreviewUrl}
                />

                {/* 3. MAIN CANVAS */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 bg-[#09090b] overflow-auto relative flex justify-center items-center"
                    style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
                    onMouseDown={(e) => {
                        if (e.button === 0) {
                            isPanning.current = true;
                            editor.setSelectedBubbleId(null);
                        }
                    }}
                    onMouseUp={() => isPanning.current = false}
                    onMouseLeave={() => isPanning.current = false}
                    onMouseMove={(e) => {
                        if (isPanning.current && e.buttons === 1) {
                            e.preventDefault();
                            e.currentTarget.scrollLeft -= e.movementX;
                            e.currentTarget.scrollTop -= e.movementY;
                        }
                    }}
                >
                    <div
                        ref={containerRef}
                        className="relative bg-white shadow-2xl ring-1 ring-white/10"
                        style={{
                            transform: `scale(${editor.zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.1s ease-out'
                        }}
                    >
                        <img
                            src={displaySrc}
                            alt="Comic Page"
                            className="block select-none"
                            draggable={false}
                            onLoad={(e) => editor.setImgNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                            style={{ pointerEvents: 'none', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }}
                        />

                        {editor.balloons.map((bubble) => (
                            <VectorBubble
                                key={bubble.id}
                                balloon={bubble}
                                containerRef={containerRef}
                                isSelected={editor.selectedBubbleId === bubble.id}
                                onSelect={(id) => {
                                    editor.setSelectedBubbleId(id);
                                    if (activeWorkspace !== 'editorial') {
                                        setActiveWorkspace('editorial');
                                    }
                                }}
                                // Use transient update (skipHistory=true) for live dragging
                                onUpdate={(id, updates) => editor.updateBubble(id, updates, true)}
                                // Commit only when interaction ends
                                onCommit={(label) => editor.commitHistory(label)}
                                hidden={hideBalloons}
                            />
                        ))}
                    </div>
                </div>

                {/* 4. MODULAR WINDOWS */}

                {windows.history && (
                    <DraggableWindow
                        title="Histórico"
                        initialPosition={{ x: 20, y: 120 }}
                        initialSize={{ width: 240, height: 300 }}
                        onClose={() => toggleWindow('history')}
                    >
                        <HistoryPanel
                            currentBalloons={editor.balloons}
                            onRestore={editor.setBalloons}
                            onClose={() => toggleWindow('history')}
                        />
                    </DraggableWindow>
                )}

                {windows.style && (
                    <DraggableWindow
                        title="Estilo"
                        initialPosition={{ x: window.innerWidth - 320, y: 120 }}
                        initialSize={{ width: 280, height: 400 }}
                        onClose={() => toggleWindow('style')}
                    >
                        <StylePanel
                            balloon={editor.getSelectedBubble() || null}
                            onUpdate={editor.updateBubble}
                            onDelete={editor.handleDeleteBalloon}
                            onDuplicate={() => alert('Duplicar: Em breve')}
                        />
                    </DraggableWindow>
                )}

                {windows.text && (
                    <DraggableWindow
                        title="Texto"
                        initialPosition={{ x: window.innerWidth - 620, y: 120 }}
                        initialSize={{ width: 280, height: 350 }}
                        onClose={() => toggleWindow('text')}
                    >
                        <TextPanel
                            balloon={editor.getSelectedBubble() || null}
                            onUpdate={editor.updateBubble}
                        />
                    </DraggableWindow>
                )}

                {windows.shape && (
                    <DraggableWindow
                        title="Forma"
                        initialPosition={{ x: window.innerWidth - 320, y: 540 }}
                        initialSize={{ width: 280, height: 300 }}
                        onClose={() => toggleWindow('shape')}
                    >
                        <ShapePanel
                            balloon={editor.getSelectedBubble() || null}
                            onUpdate={editor.updateBubble}
                        />
                    </DraggableWindow>
                )}


                {/* ZOOM CONTROLS */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-[#18181b] border border-[#27272a] p-1.5 rounded-lg shadow-xl z-40">
                    <button onClick={() => editor.setZoom(Math.max(0.1, editor.zoom - 0.25))} className="p-2 rounded-md hover:bg-white/10 transition-colors"><ZoomOut size={16} /></button>
                    <span className="text-xs font-mono w-12 text-center text-gray-400">{Math.round(editor.zoom * 100)}%</span>
                    <button onClick={() => editor.setZoom(Math.min(4, editor.zoom + 0.25))} className="p-2 rounded-md hover:bg-white/10 transition-colors"><ZoomIn size={16} /></button>
                </div>

            </div>
        </div>
    );
};

export default EditorView;
