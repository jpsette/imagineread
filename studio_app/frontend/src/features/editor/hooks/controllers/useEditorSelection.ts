import { useState, useCallback } from 'react';
import { Balloon } from '../../../../../types';

/**
 * Controller Hook for Editor Selection
 * Responsibilities:
 * - Manages the `selectedBubbleId` state
 * - Provides helpers to get the currently selected object
 * - Handles selection clearing
 */
export const useEditorSelection = (balloons: Balloon[]) => {
    const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

    const selectItem = useCallback((id: string | null) => {
        setSelectedBubbleId(id);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedBubbleId(null);
    }, []);

    const getSelectedBubble = useCallback(() => {
        return balloons.find(b => b.id === selectedBubbleId);
    }, [balloons, selectedBubbleId]);

    return {
        selectedBubbleId,
        selectItem,
        setSelectedBubbleId, // Kept for compatibility if needed, but selectItem is preferred
        clearSelection,
        getSelectedBubble
    };
};
