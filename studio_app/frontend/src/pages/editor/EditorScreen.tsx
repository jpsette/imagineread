import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Konva from 'konva';
import { Toaster } from 'sonner';

// LAYOUTS & COMPONENTS
import { EditorLayout } from '../../layouts/EditorLayout';
import { EditorLeftPanel } from '@widgets/editor/EditorLeftPanel';
import { EditorRightPanel } from '@widgets/editor/EditorRightPanel';
import { Filmstrip } from '@widgets/editor/Filmstrip';
import { EditorCanvasArea } from '@widgets/editor/CanvasArea';

// HOOKS & STORES
import { useFileItem } from '@shared/hooks/useFileItem';
import { useTabPersistence } from '@features/tabs/hooks/useTabPersistence';
import { useEditorLogic } from '@features/editor/hooks/useEditorLogic';
import { useEditorStore } from '@features/editor/store';
// import { useEditorUIStore } from '@features/editor/uiStore';
import { useVectorization } from '@features/editor/hooks/useVectorization';
import { useShortcutManager } from '@features/editor/hooks/useShortcutManager';
import { usePanelWorkflow } from '@features/editor/hooks/usePanelWorkflow';

export const EditorScreen: React.FC = () => {
    // --- ROUTER PARAMS ---
    const { fileId: rawFileId } = useParams<{ fileId: string }>();
    const navigate = useNavigate();

    // Decode URL-encoded path (for local files with slashes)
    const fileId = rawFileId ? decodeURIComponent(rawFileId) : null;

    // Detect if this is a LOCAL file (path starts with /)
    const isLocalFile = fileId?.startsWith('/') || false;


    // --- LOCAL FILE DATA LOADING ---
    // State to hold loaded balloons/panels from project.irproject
    const [loadedLocalData, setLoadedLocalData] = useState<{
        balloons: any[];
        panels: any[];
        cleanUrl?: string;
    } | null>(null);

    // Load saved data from local project file when opening a local file
    useEffect(() => {
        if (!isLocalFile || !fileId) {
            setLoadedLocalData(null);
            return;
        }

        const loadLocalData = async () => {
            if (!window.electron?.local?.readFile) return;

            // Derive basePath: parent of .origin folder
            const parts = fileId.split('/');
            const originIndex = parts.findIndex(p => p === '.origin');
            const basePath = originIndex > 0
                ? parts.slice(0, originIndex).join('/')
                : parts.slice(0, -2).join('/');

            // Derive pageId from filename
            const pageId = fileId.split('/').pop()?.replace(/\.[^.]+$/, '') || '';

            console.log('📂 [EditorScreen] Loading local data for:', pageId, 'from:', basePath);

            // Try comic.json first, then project.irproject, then parent
            const pathsToTry = [
                `${basePath}/comic.json`,
                `${basePath}/project.irproject`,
                `${basePath.split('/').slice(0, -1).join('/')}/project.irproject`
            ];

            for (const filePath of pathsToTry) {
                const result = await window.electron.local.readFile(filePath);
                if (result.success && result.content) {
                    try {
                        const data = JSON.parse(result.content);
                        const pages = data.pages || [];

                        // Find the matching page
                        const page = pages.find((p: any) =>
                            p.id === pageId ||
                            p.originPath?.includes(pageId) ||
                            p.filename === pageId
                        );

                        if (page) {
                            console.log('✅ [EditorScreen] Found saved data for page:', pageId);
                            setLoadedLocalData({
                                balloons: page.balloons || [],
                                panels: page.panels || [],
                                cleanUrl: page.cleanedPath
                                    ? `media://${basePath}/${page.cleanedPath}`
                                    : undefined
                            });
                            return;
                        }
                    } catch (e) {
                        console.warn('Failed to parse:', filePath, e);
                    }
                }
            }

            // No saved data found
            console.log('📄 [EditorScreen] No saved data found for:', pageId);
            setLoadedLocalData({ balloons: [], panels: [] });
        };

        loadLocalData();
    }, [fileId, isLocalFile]);

    // For local files, create a synthetic file object with loaded data
    const localFile = React.useMemo(() => {
        if (!isLocalFile || !fileId) return null;
        const name = fileId.split('/').pop() || 'Page';
        // Get parent directory path (e.g., /path/to/assets from /path/to/assets/page_001.jpg)
        const parentPath = fileId.substring(0, fileId.lastIndexOf('/'));
        return {
            id: fileId,
            name: name,
            type: 'file' as const,
            url: `media://${fileId}`, // media:// + absolute path
            parentId: parentPath, // Parent directory for Filmstrip to load siblings
            isLocal: true,
            isCleaned: !!loadedLocalData?.cleanUrl,
            cleanUrl: loadedLocalData?.cleanUrl,
            balloons: loadedLocalData?.balloons || [],
            panels: loadedLocalData?.panels || []
        };
    }, [fileId, isLocalFile, loadedLocalData]);

    // --- DATA FETCHING ---
    // GAPLESS NAVIGATION: keepPreviousData ensures we don't flash to loading state on ID change
    // Only fetch from API if NOT a local file
    const { data: cloudFile, isLoading, isFetching } = useFileItem(
        isLocalFile ? null : fileId,
        { keepPreviousData: true }
    );

    // Use local file or cloud file
    const file = isLocalFile ? localFile : cloudFile;

    // MANUAL PERSISTENCE: Fallback cache
    const [cachedFile, setCachedFile] = useState<any>(null);
    useEffect(() => { if (file) setCachedFile(file); }, [file]);

    // Active File Resolution
    const activeFile = file || cachedFile;
    const hasData = !!activeFile;

    // For local files, skip loading state
    const effectiveIsLoading = isLocalFile ? false : isLoading;

    // --- TAB PERSISTENCE ---
    useTabPersistence(fileId || null, activeFile?.name || 'Loading...', 'page');

    // --- GLOBAL STORES ---
    const { balloons, panels } = useEditorStore();

    // --- COMPONENT REFS ---
    const stageRef = useRef<Konva.Stage>(null);
    const [isCanvasReady, setCanvasReady] = useState(false);

    // --- SAFE VALUES FOR HOOKS ---
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

    // Center page / fit-to-view function
    const handleCenterPage = React.useCallback(() => {
        if (!stageRef.current || !editor.imgNaturalSize) return;

        const stage = stageRef.current;
        const container = stage.container();
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        const { w: imgWidth, h: imgHeight } = editor.imgNaturalSize;

        // Calculate scale to fit image in view with some padding
        const padding = 40;
        const scaleX = (containerWidth - padding * 2) / imgWidth;
        const scaleY = (containerHeight - padding * 2) / imgHeight;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 100%

        // Center the image
        const newX = (containerWidth - imgWidth * newScale) / 2;
        const newY = (containerHeight - imgHeight * newScale) / 2;

        stage.scale({ x: newScale, y: newScale });
        stage.position({ x: newX, y: newY });
        stage.batchDraw();
    }, [editor.imgNaturalSize]);

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
        if (effectiveIsLoading && !hasData) {
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
        if (!effectiveIsLoading && !hasData) {
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
                        onCenterPage={handleCenterPage}
                        cleanUrl={safeCleanUrl}
                        isCleaned={activeFile ? activeFile.isCleaned : false}
                        isLoading={effectiveIsLoading && !hasData} // Optional: Dim sidebar if truly loading
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
