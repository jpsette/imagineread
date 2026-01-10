import React, { useRef, useState, useEffect } from 'react'
import { ZoomIn, ZoomOut, Hand } from 'lucide-react'
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
    const canvasRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Workspace State
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceMode>('vectorize');

    // Canvas State
    const [pan, setPan] = useState({ x: 0, y: 0 });

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


    // Manual Non-Passive Wheel Listener for Zoom
    useEffect(() => {
        const container = canvasRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                editor.setZoom(z => Math.max(0.1, Math.min(4, z + delta)));
            } else {
                // If not zooming, maybe pan?
                // Standard behavior: wheel scrolls vertical, shift+wheel scrolls horizontal
                // But since we use manual pan state, we might want to map wheel to pan?
                // For now sticking to explicit pan via click-drag as requested.
            }
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, [editor.setZoom]);


    // Persistence State
    const isRestored = useRef(false);

    // Load View State on Mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('imagine_editor_view');
            if (saved) {
                const { zoom: savedZoom, pan: savedPan } = JSON.parse(saved);
                if (typeof savedZoom === 'number' && savedPan) {
                    editor.setZoom(savedZoom);
                    setPan(savedPan);
                    isRestored.current = true;
                }
            }
        } catch (e) {
            console.error("Failed to load view state", e);
        }
    }, [editor.setZoom]); // Depend on setZoom stable

    // Save View State (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('imagine_editor_view', JSON.stringify({
                zoom: editor.zoom,
                pan
            }));
        }, 500);
        return () => clearTimeout(timer);
    }, [editor.zoom, pan]);


    // Handle Workspace Switch
    const handleWorkspaceChange = (mode: WorkspaceMode) => {
        setActiveWorkspace(mode);
        if (mode === 'editorial') {
            setWindows(prev => ({ ...prev, style: true }));
        }
    };

    // Effective Image Logic
    useEffect(() => {
        if (editor.cleanImageUrl || cleanUrl) {
            setViewMode('clean');
        }
    }, [editor.cleanImageUrl, cleanUrl]);

    useEffect(() => {
        if (editor.maskPreviewUrl) {
            setViewMode('mask');
            setHideBalloons(true);
        }
    }, [editor.maskPreviewUrl]);

    // Determine Display Image Source
    let displaySrc = imageUrl;
    if (viewMode === 'clean' && (editor.cleanImageUrl || cleanUrl)) {
        displaySrc = editor.cleanImageUrl || cleanUrl as string;
    }
    else if (viewMode === 'mask' && editor.maskPreviewUrl) {
        displaySrc = editor.maskPreviewUrl;
    }

    // Auto-open style panel
    useEffect(() => {
        if (editor.selectedBubbleId && activeWorkspace === 'editorial') {
            if (!windows.style && !windows.text && !windows.shape) {
                setWindows(prev => ({ ...prev, style: true }));
            }
        }
    }, [editor.selectedBubbleId, activeWorkspace]);

    const hasDetections = (editor.yoloDetections && editor.yoloDetections.length > 0) || (editor.balloons && editor.balloons.length > 0);

    // --- PAN HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        // Allow pan with: Middle Mouse (button 1) OR Spacebar OR just click background (button 0) IF not on a balloon (handled by stopPropagation)
        // If clicking background (button 0), we clear selection too.
        if (e.button === 0 || e.button === 1) {
            isPanning.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };

            if (e.button === 0) {
                editor.setSelectedBubbleId(null);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning.current) {
            const deltaX = e.clientX - lastMousePos.current.x;
            const deltaY = e.clientY - lastMousePos.current.y;

            setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        isPanning.current = false;
    };

    return (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-gray-200">

            {/* 1. TOP BAR */}
            <div className="bg-[#141416]">
                <EditorTopBar
                    activeWorkspace={activeWorkspace}
                    setActiveWorkspace={handleWorkspaceChange}
                    comicName={comicName}
                    pageName={pageName}
                    onBack={onBack}
                    actions={{
                        onAddBalloon: editor.handleAddBalloon,
                        onDetect: editor.handleYOLOAnalyze,
                        onImport: editor.handleImportBalloons,
                        onOCR: editor.handleOCR,
                        onClean: editor.handleCleanPage,
                        isAnalyzingYOLO: editor.analyzingYOLO,
                        isReadingOCR: editor.readingOCR,
                        isCleaning: editor.isCleaning,
                        hasDetections: hasDetections,
                        hasBalloons: (editor.balloons && editor.balloons.length > 0),
                        hasText: editor.balloons.some(b => b.text && b.text.trim().length > 0),
                        isClean: !!editor.cleanImageUrl || !!editor.maskPreviewUrl || !!cleanUrl,
                        showClean: false,
                        setShowClean: () => { }
                    }}
                />

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

                {/* VIEW MODE SWITCHER */}
                <ViewModeSwitcher
                    mode={viewMode}
                    setMode={setViewMode}
                    hasClean={!!(editor.cleanImageUrl || cleanUrl)}
                    hasMask={!!editor.maskPreviewUrl}
                />

                {/* 3. MAIN CANVAS (PANNING CONTAINER) */}
                <div
                    ref={canvasRef}
                    className="flex-1 bg-[#09090b] overflow-hidden relative cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                        backgroundImage: 'radial-gradient(#ffffff0a 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    {/* TRANSFORMED CONTENT LAYER */}
                    <div
                        ref={containerRef}
                        className="absolute top-0 left-0 bg-white shadow-2xl ring-1 ring-white/10"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${editor.zoom})`,
                            transformOrigin: 'top left', // Important for predictable pan/zoom sync
                            transition: isPanning.current ? 'none' : 'transform 0.1s ease-out'
                        }}
                    >
                        {/* Image */}
                        <img
                            src={displaySrc}
                            alt="Comic Page"
                            className="block select-none"
                            draggable={false}
                            onLoad={(e) => {
                                // Smart Fit Logic
                                const w = e.currentTarget.naturalWidth;
                                const h = e.currentTarget.naturalHeight;
                                editor.setImgNaturalSize({ w, h });

                                // Only run Smart Fit if NOT restored from persistence
                                if (!isRestored.current && canvasRef.current) {
                                    const cw = canvasRef.current.clientWidth;
                                    const ch = canvasRef.current.clientHeight;

                                    // Calculate fit zoom (95% of available space)
                                    const scaleX = (cw - 80) / w; // 40px padding/side
                                    const scaleY = (ch - 80) / h;
                                    const fitZoom = Math.min(scaleX, scaleY, 1.0) * 0.95;

                                    editor.setZoom(fitZoom);

                                    // Center it
                                    setPan({
                                        x: (cw - w * fitZoom) / 2,
                                        y: (ch - h * fitZoom) / 2
                                    });
                                }
                            }}
                            style={{
                                pointerEvents: 'none',
                                width: 'auto',
                                height: 'auto',
                                objectFit: 'contain'
                            }}
                        />

                        {/* Balloons Layer */}
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
                                onUpdate={(id, updates) => editor.updateBubble(id, updates, true)}
                                onCommit={(label) => editor.commitHistory(label)}
                                hidden={hideBalloons}
                            />
                        ))}
                    </div>
                </div>

                {/* 4. MODULAR WINDOWS (UI LAYER - NOT TRANSFORMED) */}
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
                <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-[#18181b] border border-[#27272a] p-1.5 rounded-lg shadow-xl z-40 backdrop-blur-sm">
                    <button
                        onClick={() => editor.setZoom(Math.max(0.1, editor.zoom - 0.1))}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                    >
                        <ZoomOut size={16} />
                    </button>

                    <div className="relative group mx-1">
                        <input
                            type="text"
                            className="w-12 bg-transparent text-center text-xs font-mono text-zinc-300 focus:text-white outline-none border-b border-transparent focus:border-blue-500 transition-colors"
                            value={Math.round(editor.zoom * 100)}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) editor.setZoom(val / 100);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowUp') editor.setZoom(editor.zoom + 0.05);
                                if (e.key === 'ArrowDown') editor.setZoom(editor.zoom - 0.05);
                            }}
                        />
                        <span className="absolute right-0 top-0 text-[10px] text-zinc-600 pointer-events-none">%</span>
                    </div>

                    <button
                        onClick={() => editor.setZoom(Math.min(4, editor.zoom + 0.1))}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                    >
                        <ZoomIn size={16} />
                    </button>

                    {/* Reset View Button */}
                    <button
                        onClick={() => {
                            // Manual Reset OVERRIDES persistence
                            localStorage.removeItem('imagine_editor_view');
                            isRestored.current = false; // logic reset

                            if (editor.imgNaturalSize.w > 0 && canvasRef.current) {
                                const w = editor.imgNaturalSize.w;
                                const h = editor.imgNaturalSize.h;
                                const cw = canvasRef.current.clientWidth;
                                const ch = canvasRef.current.clientHeight;

                                const scaleX = (cw - 80) / w;
                                const scaleY = (ch - 80) / h;
                                const fitZoom = Math.min(scaleX, scaleY, 1.0) * 0.95;

                                editor.setZoom(fitZoom);
                                setPan({
                                    x: (cw - w * fitZoom) / 2,
                                    y: (ch - h * fitZoom) / 2
                                });
                            } else {
                                editor.setZoom(1);
                            }
                        }}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors ml-1 border-l border-white/10 text-zinc-400 hover:text-white"
                        title="Resetar e Ajustar à Tela"
                    >
                        <Hand size={16} />
                    </button>

                </div>
            </div>
        </div>
    );
};

export default EditorView;
