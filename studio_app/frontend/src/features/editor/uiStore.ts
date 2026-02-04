import { create } from 'zustand';
import { EditorTool, EditorMode } from '@shared/types';

interface EditorUIState {
    // Modes & Tools
    activeTool: EditorTool;
    activeMode: EditorMode;

    // Visibility Toggles
    showMasks: boolean;
    showBalloons: boolean;
    showText: boolean;
    showPanelsLayer: boolean;
    vertexEditingEnabled: boolean; // Controls vertex editing mode for balloons
    curveEditingEnabled: boolean; // Controls curve editing mode for balloons

    // Preview Modal
    showPreview: boolean;
    previewImages: string[];

    // Actions
    setActiveTool: (tool: EditorTool) => void;
    setActiveMode: (mode: EditorMode) => void;
    setShowMasks: (show: boolean) => void;
    setShowBalloons: (show: boolean) => void;
    setShowText: (show: boolean) => void;
    toggleBalloons: () => void;
    toggleText: () => void;
    toggleMasks: () => void;
    setShowPanelsLayer: (show: boolean) => void;
    setVertexEditingEnabled: (enabled: boolean) => void;
    toggleVertexEditing: () => void;
    setCurveEditingEnabled: (enabled: boolean) => void;
    toggleCurveEditing: () => void;
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
    selectedIds: string[];
    zoom: number;
    setSelectedId: (id: string | null) => void;
    setSelectedIds: (ids: string[]) => void;
    setZoom: (zoom: number) => void;

    // Text List Panel
    showTextListPanel: boolean;
    setShowTextListPanel: (show: boolean) => void;
}

export const useEditorUIStore = create<EditorUIState>((set) => ({
    // Initial State
    activeTool: 'select',
    activeMode: 'vectorize',
    showMasks: false,
    showBalloons: true,
    showText: true,
    showPanelsLayer: true,
    vertexEditingEnabled: false,
    curveEditingEnabled: false,
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
    toggleBalloons: () => set((state) => ({ showBalloons: !state.showBalloons })),
    toggleText: () => set((state) => ({ showText: !state.showText })),
    toggleMasks: () => set((state) => ({ showMasks: !state.showMasks })),
    setShowPanelsLayer: (show) => set({ showPanelsLayer: show }),
    setVertexEditingEnabled: (enabled) => set({ vertexEditingEnabled: enabled }),
    toggleVertexEditing: () => set((state) => ({ vertexEditingEnabled: !state.vertexEditingEnabled })),
    setCurveEditingEnabled: (enabled) => set({ curveEditingEnabled: enabled }),
    toggleCurveEditing: () => set((state) => ({ curveEditingEnabled: !state.curveEditingEnabled })),
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
    selectedIds: [],
    zoom: 1,
    setSelectedId: (id) => set({ selectedId: id, selectedIds: id ? [id] : [] }),
    setSelectedIds: (ids) => set({ selectedIds: ids, selectedId: ids.length === 1 ? ids[0] : null }),
    setZoom: (zoom) => set({ zoom: zoom }),

    // Text List Panel
    showTextListPanel: false,
    setShowTextListPanel: (show) => set({ showTextListPanel: show }),
}));
