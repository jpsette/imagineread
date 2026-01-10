import { create } from 'zustand';
import { Project, FileEntry } from '../types';
import { api } from '../services/api';

type ViewMode = 'dashboard' | 'project' | 'editor';

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
    isLoading: false,
    backendStatus: 'ready',

    // Actions implementation
    setProjects: (projects) => set({ projects }),
    setFileSystem: (fileSystem) => set({ fileSystem }),

    setView: (view) => {
        console.log('Store: Changing view to', view);
        set({ view });
    },

    openProject: (id) => {
        console.log('Store: Opening project', id);
        set({
            currentProjectId: id,
            view: 'project',
            currentFolderId: null,
            showManager: true // Ensure manager is visible
        });
    },

    closeProject: () => {
        console.log('Store: Closing project');
        set({
            currentProjectId: null,
            view: 'dashboard',
            currentFolderId: null
        });
    },

    openFolder: (id) => {
        console.log('Store: Opening folder', id);
        set({
            currentFolderId: id,
            view: 'project',
            showManager: true
        });
    },

    openComic: (id) => {
        console.log('Store: Opening comic', id);
        set({ openedComicId: id });
    },

    openPage: (id, url) => {
        console.log('Store: Opening page', id);
        set({
            openedPageId: id,
            openedPageUrl: url || null
        });
    },

    toggleExplorer: () => set((state) => ({ showExplorer: !state.showExplorer })),
    toggleManager: () => set((state) => ({ showManager: !state.showManager })),

    setLoading: (isLoading) => set({ isLoading }),
    setStatus: (backendStatus) => set({ backendStatus }),

    loadInitialData: async () => {
        const { setLoading, setStatus, setProjects, setFileSystem } = get();
        console.log('Store: Loading initial data...');
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
            console.log('Store: Data loaded', { projects: projs.length, fileSystem: files.length });
        } catch (e) {
            console.error('Store: Failed to load data', e);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    }
}));
