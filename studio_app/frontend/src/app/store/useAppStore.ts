import { create } from 'zustand';
import { Project, FileEntry, Balloon } from '@shared/types';
import { api } from '@shared/api/api';

type ViewMode = 'dashboard' | 'project' | 'editor';

export interface HistoryItem {
    label: string;
    state: Balloon[];
}

interface AppState {
    // Data
    projects: Project[];
    fileSystem: FileEntry[];

    // Navigation / transform
    view: ViewMode;
    currentProjectId: string | null;
    currentFolderId: string | null;
    openedComicId: string | null;
    openedPageId: string | null;
    openedPageUrl: string | null;

    // UI State (MDI)
    showExplorer: boolean;
    showManager: boolean;
    showHistory: boolean;

    // HISTORY STATE
    historyPast: HistoryItem[];
    historyFuture: HistoryItem[];

    // System
    isLoading: boolean;
    backendStatus: 'ready' | 'loading' | 'error' | 'saving';

    // Actions
    setProjects: (projects: Project[]) => void;
    setFileSystem: (files: FileEntry[]) => void;

    // Navigation Actions
    setView: (view: ViewMode) => void;
    openProject: (id: string) => void;
    closeProject: () => void;
    openFolder: (id: string | null) => void;
    openComic: (id: string | null) => void;
    openPage: (id: string | null, url?: string) => void;

    // UI Actions
    toggleExplorer: () => void;
    toggleManager: () => void;
    toggleHistory: () => void;

    // HISTORY ACTIONS
    pushToHistory: (label: string, state: Balloon[]) => void;
    undo: (currentState: Balloon[]) => Balloon[] | null;
    redo: (currentState: Balloon[]) => Balloon[] | null;
    jumpToHistory: (index: number, currentState: Balloon[]) => Balloon[] | null;
    clearHistory: () => void;

    // System Actions
    setLoading: (loading: boolean) => void;
    setStatus: (status: 'ready' | 'loading' | 'error' | 'saving') => void;
    loadInitialData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial State
    projects: [],
    fileSystem: [],
    view: 'dashboard',
    currentProjectId: null,
    currentFolderId: null,
    openedComicId: null,
    openedPageId: null,
    openedPageUrl: null,
    showExplorer: true,
    showManager: true,
    showHistory: false,
    isLoading: false,
    backendStatus: 'ready',

    // History Initial State
    historyPast: [],
    historyFuture: [],

    // Actions implementation
    setProjects: (projects) => set({ projects }),
    setFileSystem: (fileSystem) => set({ fileSystem }),

    setView: (view) => {
        set({ view });
    },

    openProject: (id) => {
        set({
            currentProjectId: id,
            view: 'project',
            currentFolderId: null,
            showManager: true // Ensure manager is visible
        });
    },

    closeProject: () => {
        set({
            currentProjectId: null,
            view: 'dashboard',
            currentFolderId: null
        });
    },

    openFolder: (id) => {
        set({
            currentFolderId: id,
            view: 'project',
            showManager: true
        });
    },

    openComic: (id) => {
        set({ openedComicId: id });
    },

    openPage: (id, url) => {
        set({
            openedPageId: id,
            openedPageUrl: url || null
        });
    },

    toggleExplorer: () => set((state) => ({ showExplorer: !state.showExplorer })),
    toggleManager: () => set((state) => ({ showManager: !state.showManager })),
    toggleHistory: () => set((state) => ({ showHistory: !state.showHistory })),

    // --- HISTORY LOGIC ---

    pushToHistory: (label, state) => {
        set(prev => {
            const newPast = [...prev.historyPast, { label, state: JSON.parse(JSON.stringify(state)) }];
            // Limit to 50
            if (newPast.length > 50) newPast.shift();

            return {
                historyPast: newPast,
                historyFuture: [] // Clear future on new action
            };
        });
    },

    undo: (currentState) => {
        const { historyPast, historyFuture } = get();
        if (historyPast.length === 0) return null;

        const previousItem = historyPast[historyPast.length - 1]; // State we want to restore
        const newPast = historyPast.slice(0, -1);

        // Save 'current' to Future so we can Redo
        // We need a label for the current state... let's infer or use a generic "Redo Action"
        const currentLabel = previousItem.label; // Reuse label? Or... 
        // Actually, normally 'Future' stores the 'Undo' of the undo.

        set({
            historyPast: newPast,
            historyFuture: [{ label: currentLabel, state: currentState }, ...historyFuture]
        });

        return previousItem.state;
    },

    redo: (currentState) => {
        const { historyPast, historyFuture } = get();
        if (historyFuture.length === 0) return null;

        const nextItem = historyFuture[0]; // The state we want to restore
        const newFuture = historyFuture.slice(1);

        set({
            historyPast: [...historyPast, { label: nextItem.label, state: currentState }], // Save current to past
            historyFuture: newFuture
        });

        return nextItem.state;
    },

    jumpToHistory: (index, currentState) => {
        const { historyPast, historyFuture } = get();
        if (index < 0 || index >= historyPast.length) return null;

        // Target state to restore
        const targetItem = historyPast[index];

        // Items from Past that will move to Future (everything AFTER target)
        // e.g. Past: [A, B, C]. Target: A (index 0). itemsToFuture: [B, C].
        const itemsToFuture = historyPast.slice(index + 1);

        // New Future: [ ...itemsToFuture, Current, ...oldFuture ]
        // We need to preserve order so Redo works sequentially (A -> B -> C -> D).
        // If we are at D (current). Jump to A.
        // We want Future to be [B, C, D].
        // So Redo -> B. Redo -> C. Redo -> D.
        // itemsToFuture is [B, C]. 
        // currentState is D.

        const newFuture = [
            ...itemsToFuture,
            { label: 'Redo Action', state: currentState },
            ...historyFuture
        ];

        set({
            historyPast: historyPast.slice(0, index),
            historyFuture: newFuture
        });

        return targetItem.state;
    },

    clearHistory: () => set({ historyPast: [], historyFuture: [] }),

    setLoading: (isLoading) => set({ isLoading }),
    setStatus: (backendStatus) => set({ backendStatus }),

    loadInitialData: async () => {
        const { setLoading, setStatus, setProjects, setFileSystem } = get();
        setLoading(true);
        setStatus('loading');
        try {
            const [projs, files] = await Promise.all([
                api.getProjects(),
                api.getFileSystem()
            ]);
            setProjects(projs);
            setFileSystem(files);
            setStatus('ready');
        } catch (e) {
            console.error('Store: Failed to load data', e);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }
}));
