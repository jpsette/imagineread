import { create } from 'zustand';
import { EditorTool, EditorMode } from '../../types';

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

    // --- CLEAN IMAGE STATE ---
    cleanImageUrl: string | null;
    isOriginalVisible: boolean;
    setCleanImage: (url: string | null) => void;
    toggleVisibility: () => void;

    // --- UNSAVED CHANGES MODAL STATE ---
    showUnsavedModal: boolean;
    pendingNavigationPath: string | null; // URL to navigate to after handling changes
    setShowUnsavedModal: (show: boolean) => void;
    setPendingNavigationPath: (path: string | null) => void;

    // --- UNIFIED STATE ---
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

    // Unsaved Changes Modal
    showUnsavedModal: false,
    pendingNavigationPath: null,

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

    // Modal Setters
    setShowUnsavedModal: (show) => set({ showUnsavedModal: show }),
    setPendingNavigationPath: (path) => set({ pendingNavigationPath: path }),

    // --- NEW: UNIFIED STATE (Migrated from Logic Hook) ---
    selectedId: null,
    zoom: 1,
    setSelectedId: (id) => set({ selectedId: id }),
    setZoom: (zoom) => set({ zoom: zoom }),
}));
