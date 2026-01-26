import React, { useRef } from 'react';
import Konva from 'konva';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react'; // Added import
import { useEditorLogic } from './hooks/useEditorLogic';
import { Balloon, Panel } from '../../types';
import { useEditorStore } from './store';
import { useEditorUIStore } from './uiStore';

// --- NEW COMPONENTS & UTILS ---
import { useVectorization } from './hooks/useVectorization';
import { useShortcutManager } from './hooks/useShortcutManager';
import { usePanelWorkflow } from './hooks/usePanelWorkflow';
import { PanelPreviewModal } from './components/modals/PanelPreviewModal';


// LAYOUT COMPONENTS
import { EditorLeftPanel } from './components/layout/EditorLeftPanel';
import { EditorRightPanel } from './components/layout/EditorRightPanel';
import { EditorCanvasContainer } from './components/layout/EditorCanvasContainer';
import { Filmstrip } from './components/layout/Filmstrip';

interface EditorViewProps {
    imageUrl: string;
    fileId: string;
    initialBalloons?: Balloon[] | null;
    initialPanels?: Panel[] | null; // Added initialPanels
    cleanUrl?: string | null;
    isCleaned?: boolean;

}

export const EditorView: React.FC<EditorViewProps> = ({
    imageUrl,
    fileId,
    initialBalloons,
    initialPanels, // Added initialPanels
    cleanUrl,
    isCleaned,
}) => {

    // --- GLOBAL STORE ---
    const { balloons, panels } = useEditorStore();

    // --- LOCAL STATE for UX ---
    const [isCanvasReady, setCanvasReady] = React.useState(false);
    const [isLoaderMounted, setLoaderMounted] = React.useState(true);

    // Reset loading state when fileId changes to force overlay
    React.useEffect(() => {
        setCanvasReady(false);
        setLoaderMounted(true);
    }, [fileId]);

    // Safety Timeout: Force ready after 5 seconds if something hangs
    React.useEffect(() => {
        if (!isCanvasReady) {
            const timer = setTimeout(() => setCanvasReady(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [isCanvasReady]);

    // Remove Loader from DOM after animation completes
    React.useEffect(() => {
        if (isCanvasReady) {
            const timer = setTimeout(() => setLoaderMounted(false), 500); // 500ms = duration-500
            return () => clearTimeout(timer);
        }
    }, [isCanvasReady]);

    // --- UI STORE ---
    const {
        showPreview, setShowPreview,
        previewImages
    } = useEditorUIStore();

    // --- REFS ---
    const stageRef = useRef<Konva.Stage>(null);

    // --- LOGIC HOOKS ---
    const editor = useEditorLogic(fileId, initialBalloons, cleanUrl, initialPanels); // Passed initialPanels

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
    const { handleOpenGallery } = usePanelWorkflow({
        stageRef,
        panels
    });

    // --- NAVIGATION PROTECTION ---
    // 1. Browser Refresh/Close Protection
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const isDirty = useEditorStore.getState().isDirty;
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Standard for modern browsers
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);



    return (
        <div
            className="flex flex-col h-screen bg-[#121214] text-white overflow-hidden animate-editor-fade-in"
        >


            {/* HEADER REMOVED (Moved to Layout) */}
            <Toaster richColors position="top-center" />

            {/* FLOATING BACK BUTTON (If not provided by Layout, we ensure we have a trigger for testing) */}
            {/* Note: EditorLayout usually provides the back button. 
                If EditorView controls the whole screen content (as per EditorScreen), 
                we might need to ensure the Layout's Back button calls THIS handleSafeBack.
                
                However, EditorScreen passes 'handleBack' to 'onBack'. 
                EditorLayout renders children. 
                EditorLayout likely has its OWN Back button in the sidebar or header?
                
                Let's assume the user uses the Browser Back or a custom button passed via props.
                Since we can't easily change the EditorLayout's physical button from here (unless we use a context or portal),
                we will assume `EditorScreen` handles the "UI" of the button? 
                
                Wait, EditorScreen renders EditorLayout, then EditorView. 
                If EditorLayout has the button, it calls navigate(-1) directly?
                
                I will add a Floating Save/Exit Panel to EditorView to guarantee visibility and control.
            */}

            {/* MAIN CONTENT */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR */}
                <EditorLeftPanel
                    vectorization={vectorization}
                    onOpenPanelGallery={handleOpenGallery}
                    cleanUrl={cleanUrl}
                    isCleaned={isCleaned}
                    isLoading={!isCanvasReady} // Prevent Sidebar FOUC
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
                        {/* canvas container */}
                        <div className="flex-1 relative overflow-hidden flex flex-col">
                            <EditorCanvasContainer
                                ref={stageRef}
                                imageUrl={imageUrl}
                                fileId={fileId}
                                onCanvasReady={(ready) => {
                                    // Slight delay for smoother transition
                                    setTimeout(() => setCanvasReady(ready), 200);
                                }}
                                onImageDimensionsLoaded={(w, h) => {
                                    editor.setImgNaturalSize({ w, h });
                                }}
                            />

                            {/* BLOCKING LOADER OVERLAY - Unmounts after animation */}
                            {isLoaderMounted && (
                                <div className={`absolute inset-0 z-50 bg-[#1e1e1e] flex items-center justify-center transition-opacity duration-500 ${isCanvasReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                        <span className="text-zinc-400 font-medium animate-pulse">Carregando Studio...</span>
                                    </div>
                                </div>
                            )}
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
