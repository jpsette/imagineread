import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../editor/store';
import { useTabStore } from '../stores/useTabStore';
import { useLocation } from 'react-router-dom';

export const useTabPersistence = (fileId: string | null, title: string, type: 'comic' | 'page' = 'page') => {
    const location = useLocation();
    const { hibernateTab, openTab, getTab } = useTabStore();

    // Track if we are in the initial mount to prevent overwriting hydration
    const isHydratedRef = useRef(false);

    // 1. REGISTER TAB ON MOUNT
    useEffect(() => {
        if (!fileId) return;

        // Register or Activate Tab
        openTab({
            id: fileId,
            title,
            type,
            path: location.pathname
        });

        // 2. HYDRATION (Restore State)
        const tab = fileId ? getTab(fileId) : undefined;
        if (tab?.hibernatedState) {
            console.log(`[Tabs] Hydrating ${fileId} from memory...`);
            useEditorStore.setState(tab.hibernatedState);
            isHydratedRef.current = true;
        } else {
            // New load or Clean slate?
            // If it's a fresh load, we usually rely on the API.
            // But we should ensure we don't carry over dirt from previous tab if it wasn't cleaned properly.
            // Since `useEditorStore` is a singleton, we MUST clear it if we don't have hydration data,
            // otherwise Tab B will show Tab A's content until API finishes fetching.
            if (!isHydratedRef.current) {
                // DO NOT RESET STORE HERE.
                // Resetting here causes a flash of empty content (Balloons=[]) while transitioning.
                // Handover: 'useEditorStateSync' in EditorScreen will handle setting the new data
                // when it is actually loaded. Until then, we keep the previous store state
                // (or 'keepPreviousData' logic in UI) to allow gapless transitions.
                console.log(`[Tabs] Fresh load for ${fileId}. Waiting for data sync...`);
            }
        }

        return () => {
            // 3. DEHYDRATION (Save State on Unmount)
            const currentState = useEditorStore.getState();

            if (currentState.isDirty) {
                console.log(`[Tabs] Hibernating ${fileId} to memory (Dirty)...`);
                hibernateTab(fileId, {
                    balloons: currentState.balloons,
                    panels: currentState.panels,
                    isDirty: currentState.isDirty,
                    isSaved: currentState.isSaved
                });
            } else {
                console.log(`[Tabs] Clearing hibernation for ${fileId} (Clean)...`);
                // Clear state so next load is fresh from API
                hibernateTab(fileId, undefined);
            }
        };
    }, [fileId]); // Re-run if ID changes (different file)

    // Sync Title (if changed externally)
    useEffect(() => {
        if (fileId) {
            useTabStore.getState().updateTabTitle(fileId, title);
        }
    }, [title, fileId]);
};
