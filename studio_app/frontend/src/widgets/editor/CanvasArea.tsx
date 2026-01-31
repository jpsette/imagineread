import React, { useEffect, useState } from 'react';
import Konva from 'konva';
import { Loader2 } from 'lucide-react';
import { EditorCanvasContainer } from '@widgets/editor/EditorCanvasContainer';
// Filmstrip moved to Layout
import { PanelPreviewModal } from '@features/editor/components/modals/PanelPreviewModal';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';
import { generatePanelPreviews } from '@features/editor/utils/panelUtils';

interface EditorCanvasAreaProps {
    fileId: string;
    imageUrl: string;
    editor: any;
    isCanvasReady: boolean;
    setCanvasReady: (ready: boolean) => void;
    stageRef: React.RefObject<Konva.Stage>;
}

export const EditorCanvasArea: React.FC<EditorCanvasAreaProps> = ({
    fileId,
    imageUrl,
    editor,
    isCanvasReady,
    setCanvasReady,
    stageRef
}) => {
    // --- UI STORE ---
    const {
        showPreview, setShowPreview,
        previewImages, setPreviewImages
    } = useEditorUIStore();

    // --- LOCAL STATE for UX ---
    // Loader logic moved here as it pertains to the Content Area
    const [isLoaderMounted, setLoaderMounted] = useState(true);

    // Reset loading state when fileId changes to force overlay
    useEffect(() => {
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

    // --- GALLERY REGENERATION ---
    const { panels } = useEditorStore();

    // This allows the Gallery Modal to request a re-render of previews 
    // with different visibility settings (e.g. Show/Hide Elements)
    // REFACTORED: Now toggles BOTH Balloons and Text
    const handleRegeneratePreviews = async (showElements: boolean) => {
        // 1. Update visibility in Store (Triggers Canvas Rerender)
        // We toggle BOTH balloons and text to match "Eye" behavior
        useEditorUIStore.getState().setShowBalloons(showElements);
        useEditorUIStore.getState().setShowText(showElements);

        // 2. Wait for React/Konva to update the DOM
        // We need a small delay to ensure the canvas has physically repainted
        setTimeout(() => {
            if (stageRef.current && panels) {
                console.log("♻️ Regenerating Gallery Previews (Elements: " + showElements + ")...");
                try {
                    const newImages = generatePanelPreviews(stageRef.current, panels);
                    setPreviewImages(newImages);
                } catch (e) {
                    console.error("Failed to regenerate previews", e);
                }
            }
        }, 300); // 300ms is usually safe for a visual update
    };

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
            </div>

            {/* MODALS */}
            <PanelPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                images={previewImages}
                onToggleElements={handleRegeneratePreviews}
            />
        </div>
    );
};
