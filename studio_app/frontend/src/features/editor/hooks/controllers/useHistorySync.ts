import { useCallback } from 'react';
import { useAppStore } from '../../../../store/useAppStore';
import { useEditorStore } from '../../store';

/**
 * Controller Hook for History Synchronization
 * Responsibilities:
 * - Coordinates history clearing between Global App Store (Legacy) and Editor Store (Zundo)
 * - Ensures no "Ghost History" persists when switching files
 * - Exposes history actions (Push) to keep consumers decoupled from AppStore
 */
export const useHistorySync = () => {
    const clearAppHistory = useAppStore(state => state.clearHistory);
    const pushToHistory = useAppStore(state => state.pushToHistory);

    const clearAllHistory = useCallback(() => {
        console.log("🧹 [HistorySync] Clearing all editor history (App + Zundo)");

        // 1. Clear Global History (Legacy / Navigation)
        clearAppHistory();

        // 2. Clear Local Editor History (Zundo)
        // Accessing temporal store directly via the Zundo API attached to the Zustand store
        useEditorStore.temporal.getState().clear();
    }, [clearAppHistory]);

    return {
        clearAllHistory,
        pushToHistory
    };
};
