import { useEffect } from 'react';
import { useEditorStore } from '../store';
import { useEditorUIStore } from '../uiStore';
import { commandManager } from '../commands/CommandManager';
import { Balloon, Panel } from '../../../types';

interface UseEditorStateSyncProps {
    fileId: string;
    initialBalloons?: Balloon[] | null;
    initialPanels?: Panel[] | null;
    cleanUrl?: string | null;
}

export const useEditorStateSync = ({
    fileId,
    initialBalloons,
    initialPanels,
    cleanUrl
}: UseEditorStateSyncProps) => {

    const {
        setCleanImage,
        setZoom,
        setSelectedId,
        setPreviewImages
    } = useEditorUIStore();

    // STRICT RESET: When fileId changes, cleanup. 
    // This MUST ONLY happen when navigating to a NEW file.
    useEffect(() => {
        if (!fileId) return;

        console.log("♻️ [StateSync] New File Detected -> Resetting State:", fileId);

        // 1. Clear History
        commandManager.clear();

        // 2. Clear Selection
        setSelectedId(null);

        // 3. Reset Zoom
        setZoom(1);

        // 3.1 CLEAR PREVIEWS (UI Store)
        setPreviewImages([]);

    }, [fileId, setSelectedId, setZoom, setPreviewImages]);

    // HYDRATION: When data arrives/updates, sync to store.
    useEffect(() => {
        // 4. Hydrate Logic (Balloons)
        if (initialBalloons && Array.isArray(initialBalloons)) {
            useEditorStore.getState().setBalloons(initialBalloons);
        } else if (fileId && !initialBalloons) {
            // Note: If initialBalloons is undefined, we assume empty?
            // "Hydrate" implies Source of Truth from Parent.
            // Only clear if we are sure (empty array passed or strictly missing but file loaded)
            useEditorStore.getState().setBalloons([]);
        }

        // 5. Hydrate Logic (Panels)
        if (initialPanels && Array.isArray(initialPanels)) {
            useEditorStore.getState().setPanels(initialPanels);
        } else if (fileId && !initialPanels) {
            useEditorStore.getState().setPanels([]);
        }

        // 6. Hydrate Clean Image (or clear it)
        if (cleanUrl) {
            setCleanImage(cleanUrl);
        } else {
            setCleanImage(null);
        }

        // 7. RESET DIRTY/SAVED FLAG (Based on Content)
        setTimeout(() => {
            const store = useEditorStore.getState();
            // Important: We reset IsDirty to false because we just loaded from DB/API
            store.setIsDirty(false);

            const hasContent =
                (initialBalloons && initialBalloons.length > 0) ||
                (initialPanels && initialPanels.length > 0) ||
                !!cleanUrl;
            store.setIsSaved(!!hasContent);
        }, 0);

    }, [initialBalloons, initialPanels, cleanUrl, setCleanImage, fileId]);
};
