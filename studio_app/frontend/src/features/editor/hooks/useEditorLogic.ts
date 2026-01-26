import { useState, useRef } from 'react';
import { Balloon, Panel } from '../../../types';
import { useEditorStore } from '../store';
import { useEditorUIStore } from '../uiStore';
import { useEditorStateSync } from './useEditorStateSync';
import { useEditorCommands } from './useEditorCommands';

export const useEditorLogic = (
    fileId: string,
    initialBalloons: Balloon[] | null | undefined,
    cleanUrl?: string | null,
    initialPanels?: Panel[] | null
) => {
    // --- GLOBAL STORE INTEGRATION ---
    const {
        balloons,
        setBalloons,
        panels,
        setPanels
    } = useEditorStore();

    // --- UI STORE INTEGRATION ---
    const {
        selectedId: selectedBubbleId,
        setSelectedId: setSelectedBubbleId,
        zoom,
        setZoom
    } = useEditorUIStore();

    // --- 1. STATE SYNC & HYDRATION ---
    useEditorStateSync({
        fileId,
        initialBalloons,
        initialPanels,
        cleanUrl
    });

    // --- 2. COMMANDS & ACTIONS ---
    const commands = useEditorCommands({ fileId });

    // --- INTERNAL REFS ---
    // Access latest state in callbacks without re-bind
    const balloonsRef = useRef<Balloon[]>(balloons);
    const balloonsState = useEditorStore(state => state.balloons); // reactive
    if (balloonsRef.current !== balloonsState) {
        balloonsRef.current = balloonsState;  // sync ref
    }

    // Internal State
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

    return {
        // State
        balloons,
        setBalloons,
        panels,
        setPanels,
        selectedBubbleId,
        setSelectedBubbleId,
        zoom,
        setZoom,
        imgNaturalSize,
        setImgNaturalSize,

        // Actions
        ...commands
    };
};
