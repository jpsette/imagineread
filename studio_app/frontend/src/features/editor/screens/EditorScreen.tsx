import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Konva from 'konva';
import { Toaster } from 'sonner';

// LAYOUTS & COMPONENTS
import { EditorLayout } from '../../../layouts/EditorLayout';
import { EditorLeftPanel } from '../components/layout/EditorLeftPanel';
import { EditorRightPanel } from '../components/layout/EditorRightPanel';
import { Filmstrip } from '../components/layout/Filmstrip';
import { EditorCanvasArea } from '../components/EditorCanvasArea';

// HOOKS & STORES
import { useFileItem } from '../../dashboard/hooks/useFileItem';
import { useTabPersistence } from '../../tabs/hooks/useTabPersistence';
import { useEditorLogic } from '../hooks/useEditorLogic';
import { useEditorStore } from '../store';
// import { useEditorUIStore } from '../uiStore';
import { useVectorization } from '../hooks/useVectorization';
import { useShortcutManager } from '../hooks/useShortcutManager';
import { usePanelWorkflow } from '../hooks/usePanelWorkflow';

export const EditorScreen: React.FC = () => {
    // --- ROUTER PARAMS ---
    const { fileId } = useParams<{ fileId: string }>();
    const navigate = useNavigate();

    // --- DATA FETCHING ---
    // GAPLESS NAVIGATION: keepPreviousData ensures we don't flash to loading state on ID change
    const { data: file, isLoading, isFetching } = useFileItem(fileId || null, { keepPreviousData: true });

    // MANUAL PERSISTENCE: Fallback cache
    const [cachedFile, setCachedFile] = useState<any>(null);
    useEffect(() => { if (file) setCachedFile(file); }, [file]);

    // Active File Resolution
    const activeFile = file || cachedFile;
    const hasData = !!activeFile;

    // --- TAB PERSISTENCE ---
    useTabPersistence(fileId || 'unknown', activeFile?.name || 'Loading...', 'page');

    // --- GLOBAL STORES ---
    const { balloons, panels } = useEditorStore();

    // --- COMPONENT REFS ---
    const stageRef = useRef<Konva.Stage>(null);
    const [isCanvasReady, setCanvasReady] = useState(false);

    // --- SAFE VALUES FOR HOOKS ---
    // Even if loading, we maintain hooks with stable/empty values to prevent crashes
    // This allows the "Shell" (Sidebars) to remain mounted even if content is missing
    const safeFileId = activeFile?.id || fileId || '';
    const safeImageUrl = activeFile?.url || '';
    const safeCleanUrl = activeFile?.cleanUrl || undefined;

    // --- LOGIC HOOKS ---
    const editor = useEditorLogic(
        safeFileId,
        activeFile?.balloons || undefined,
        safeCleanUrl,
        activeFile?.panels || undefined
    );

    useShortcutManager(editor);

    const vectorization = useVectorization({
        imageUrl: safeImageUrl,
        fileId: safeFileId,
        imgNaturalSize: editor.imgNaturalSize,
        editor,
        cleanUrl: safeCleanUrl,
        currentBalloons: balloons,
        currentPanels: panels,
        isFetching // Fix: Pass fetching state to block stale auto-advance
    });

    const { handleOpenGallery } = usePanelWorkflow({
        stageRef,
        panels
    });

    // --- NAVIGATION PROTECTION ---
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const isDirty = useEditorStore.getState().isDirty;
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // --- RENDER CONTENT DECISION ---
    const renderCenterContent = () => {
        // 1. Initial Load (No Data, No Cache)
        if (isLoading && !hasData) {
            return (
                <div className="flex-1 flex items-center justify-center text-white bg-[#1e1e1e]">
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-zinc-500 text-sm">Carregando editor...</span>
                    </div>
                </div>
            );
        }

        // 2. Error State (Done loading, no data)
        if (!isLoading && !hasData) {
            return (
                <div className="flex-1 flex items-center justify-center text-white bg-[#1e1e1e]">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-zinc-400">Arquivo não encontrado.</span>
                        <button onClick={() => navigate('/')} className="text-blue-500 hover:underline text-sm">
                            Voltar para Home
                        </button>
                    </div>
                </div>
            );
        }

        // 3. Success State (Data Available)
        return (
            <EditorCanvasArea
                fileId={safeFileId}
                imageUrl={safeImageUrl}
                editor={editor}
                isCanvasReady={isCanvasReady}
                setCanvasReady={setCanvasReady}
                stageRef={stageRef}
            />
        );
    };


    // --- UNCONDITIONAL RENDER ---
    // EditorLayout is ALWAYS rendered to maintain Sidebars active
    return (
        <div className="fixed inset-0 z-[200] bg-black">
            <Toaster richColors position="top-center" />

            <EditorLayout
                // SIDEBARS: Rendered regardless of loading state
                leftPanel={
                    <EditorLeftPanel
                        vectorization={vectorization}
                        onOpenPanelGallery={handleOpenGallery}
                        cleanUrl={safeCleanUrl}
                        isCleaned={activeFile ? activeFile.isCleaned : false}
                        isLoading={isLoading && !hasData} // Optional: Dim sidebar if truly loading
                        isFetching={isFetching} // Fix: Notify sidebar of background updates
                    />
                }
                rightPanel={
                    <EditorRightPanel />
                }
                bottomPanel={
                    <Filmstrip
                        fileId={safeFileId}
                        parentId={activeFile?.parentId}
                    />
                }
            >
                {/* CENTER CONTENT: Handles Logic States (Load/Error/Canvas) */}
                {renderCenterContent()}

                {/* BACKGROUND SPINNER (For Gapless Transitions) */}
                {isFetching && hasData && (
                    <div className="absolute top-4 right-4 z-[300] pointer-events-none">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shadow-glow-blue"></div>
                    </div>
                )}
            </EditorLayout>
        </div>
    );
};
