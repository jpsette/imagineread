import React, { useEffect, useState } from 'react';
import Konva from 'konva';
import { Loader2 } from 'lucide-react';
import { EditorCanvasContainer } from './layout/EditorCanvasContainer';
// Filmstrip moved to Layout
import { PanelPreviewModal } from './modals/PanelPreviewModal';
import { useEditorUIStore } from '../uiStore';

interface EditorCanvasAreaProps {
    fileId: string;
    // parentId removed - not needed here anymore
    imageUrl: string;
    editor: any;
    isCanvasReady: boolean;
    setCanvasReady: (ready: boolean) => void;
    stageRef: React.RefObject<Konva.Stage>;
}

export const EditorCanvasArea: React.FC<EditorCanvasAreaProps> = ({
    fileId,
    // parentId,
    imageUrl,
    editor,
    isCanvasReady,
    setCanvasReady,
    stageRef
}) => {
    // --- UI STORE ---
    const {
        showPreview, setShowPreview,
        previewImages
    } = useEditorUIStore();

    // --- LOCAL STATE for UX ---
    // Loader logic moved here as it pertains to the Content Area
    const [isLoaderMounted, setLoaderMounted] = useState(true);

    // Reset loading state when fileId changes to force overlay
    useEffect(() => {
        // REMOVED: setLoaderMounted(true) -> Prevents full screen flash
        // We only reset canvas ready to allow the internal image fade-in logic to work if needed,
        // but we DON'T show the blocking loader anymore for navigation.
        setCanvasReady(false);
    }, [fileId, setCanvasReady]);

    // Safety Timeout
    useEffect(() => {
        if (!isCanvasReady) {
            const timer = setTimeout(() => setCanvasReady(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [isCanvasReady, setCanvasReady]);

    // Remove Loader from DOM after animation completes
    useEffect(() => {
        if (isCanvasReady) {
            const timer = setTimeout(() => setLoaderMounted(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isCanvasReady]);

    return (
        <div className="flex-1 relative flex flex-col min-w-0 bg-[#1e1e1e]">
            {/* DYNAMIC CONTENT - Remounts on file change */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
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

                {/* Filmstrip Moved to Layout Level */}
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
