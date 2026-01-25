import { create } from 'zustand';
import { EditorMode } from './components/layout/EditorHeader';
import { EditorTool } from '../../types';

interface EditorUIState {
    // Modes & Tools
    activeTool: EditorTool;
    activeMode: EditorMode;

    // Visibility Toggles
    showMasks: boolean;
    showBalloons: boolean;
    showText: boolean;
    showPanelsLayer: boolean;

    // Preview Modal
    showPreview: boolean;
    previewImages: string[];

    // Actions
    setActiveTool: (tool: EditorTool) => void;
    setActiveMode: (mode: EditorMode) => void;
    setShowMasks: (show: boolean) => void;
    setShowBalloons: (show: boolean) => void;
    setShowText: (show: boolean) => void;
    setShowPanelsLayer: (show: boolean) => void;
    setShowPreview: (show: boolean) => void;
    setPreviewImages: (images: string[]) => void;

    // Focus Mode
    isFocusMode: boolean;
    setIsFocusMode: (v: boolean) => void;

    // --- NEW: CLEAN IMAGE STATE (Migrated from Data Store) ---
    cleanImageUrl: string | null;
    isOriginalVisible: boolean;
    setCleanImage: (url: string | null) => void;
    toggleVisibility: () => void;

    // Unified State
    selectedId: string | null;
    zoom: number;
    setSelectedId: (id: string | null) => void;
    setZoom: (zoom: number) => void;
}

export const useEditorUIStore = create<EditorUIState>((set) => ({
    // Initial State
    activeTool: 'select',
    activeMode: 'vectorize',
    showMasks: true,
    showBalloons: true,
    showText: true,
    showPanelsLayer: true,
    showPreview: false,
    previewImages: [],

    // Clean Image State
    cleanImageUrl: null,
    isOriginalVisible: false,

    // Setters
    setActiveTool: (tool) => set({ activeTool: tool }),
    setActiveMode: (mode) => set({ activeMode: mode }),
    setShowMasks: (show) => set({ showMasks: show }),
    setShowBalloons: (show) => set({ showBalloons: show }),
    setShowText: (show) => set({ showText: show }),
    setShowPanelsLayer: (show) => set({ showPanelsLayer: show }),
    setShowPreview: (show) => set({ showPreview: show }),
    setPreviewImages: (images) => set({ previewImages: images }),

    // Focus Mode
    isFocusMode: false,
    setIsFocusMode: (v) => set({ isFocusMode: v }),

    // Clean Image Actions
    setCleanImage: (url) => set({
        cleanImageUrl: url,
        isOriginalVisible: false // Auto-switch to clean view
    }),
    toggleVisibility: () => set((state) => ({
        isOriginalVisible: !state.isOriginalVisible
    })),

    // --- NEW: UNIFIED STATE (Migrated from Logic Hook) ---
    selectedId: null,
    zoom: 1,
    setSelectedId: (id) => set({ selectedId: id }),
    setZoom: (zoom) => set({ zoom: zoom }),
}));
