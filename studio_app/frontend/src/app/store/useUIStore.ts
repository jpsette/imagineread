import { create } from 'zustand';

interface UIState {
    // STATE
    /** Whether the file explorer sidebar is visible */
    showExplorer: boolean;
    /** Whether the manager sidebar/panel is visible */
    showManager: boolean;
    /** Whether the dictionary window is visible */
    showDictionary: boolean;
    /** Current main view mode */
    view: 'dashboard' | 'project';
    /** Whether the project creation modal/mode is active */
    isCreatingProject: boolean;

    // ACTIONS
    /** Toggle or set explorer visibility */
    setShowExplorer: (show: boolean) => void;
    /** Toggle or set manager visibility */
    setShowManager: (show: boolean) => void;
    /** Toggle or set dictionary visibility */
    setShowDictionary: (show: boolean) => void;
    /** Change the main view */
    setView: (view: 'dashboard' | 'project') => void;
    /** Set project creation mode state */
    setIsCreatingProject: (isCreating: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    // Initial State
    showExplorer: true,
    showManager: true,
    showDictionary: false,
    view: 'dashboard',
    isCreatingProject: false,

    // Actions implementation
    setShowExplorer: (showExplorer) => set({ showExplorer }),
    setShowManager: (showManager) => set({ showManager }),
    setShowDictionary: (showDictionary) => set({ showDictionary }),
    setView: (view) => set({ view }),
    setIsCreatingProject: (isCreatingProject) => set({ isCreatingProject })
}));
