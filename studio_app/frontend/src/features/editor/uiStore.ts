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

    // Setters
    setActiveTool: (tool) => set({ activeTool: tool }),
    setActiveMode: (mode) => set({ activeMode: mode }),
    setShowMasks: (show) => set({ showMasks: show }),
    setShowBalloons: (show) => set({ showBalloons: show }),
    setShowText: (show) => set({ showText: show }),
    setShowPanelsLayer: (show) => set({ showPanelsLayer: show }),
    setShowPreview: (show) => set({ showPreview: show }),
    setPreviewImages: (images) => set({ previewImages: images }),
}));
