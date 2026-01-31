import { create } from 'zustand';
import { FileEntry } from '@shared/types';

interface FileSystemState {
    // STATE
    /** Flat list of all files and folders in the simulated file system */
    fileSystem: FileEntry[];
    /** ID of the currently open folder (for explorer view) */
    currentFolderId: string | null;
    /** ID of the currently open comic (for dashboard/details view) */
    openedComicId: string | null;
    /** ID of the currently open page (for editor/reader view) */
    openedPageId: string | null;

    // ACTIONS
    /** Replace the entire file system entries */
    setFileSystem: (entries: FileEntry[]) => void;
    /** Add a new file or folder entry */
    addEntry: (entry: FileEntry) => void;
    /** Remove an entry by ID */
    removeEntry: (id: string) => void;
    /** Update a specific entry by ID */
    updateEntry: (id: string, updates: Partial<FileEntry>) => void;
    /** Set the current folder being viewed */
    setCurrentFolderId: (id: string | null) => void;
    /** Set the currently opened comic */
    setOpenedComicId: (id: string | null) => void;
    /** Set the currently opened page */
    setOpenedPageId: (id: string | null) => void;

    // COMPUTED / HELPERS
    /** Get all direct children of a specific folder (or root if null) */
    getChildren: (folderId: string | null) => FileEntry[];
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
    // Initial State
    fileSystem: [],
    currentFolderId: null,
    openedComicId: null,
    openedPageId: null,

    // Actions implementation
    setFileSystem: (fileSystem) => set({ fileSystem }),

    addEntry: (entry) => set((state) => ({
        fileSystem: [...state.fileSystem, entry]
    })),

    removeEntry: (id) => set((state) => ({
        fileSystem: state.fileSystem.filter((entry) => entry.id !== id)
    })),

    updateEntry: (id, updates) => set((state) => ({
        fileSystem: state.fileSystem.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
        )
    })),

    setCurrentFolderId: (currentFolderId) => set({ currentFolderId }),
    setOpenedComicId: (openedComicId) => set({ openedComicId }),
    setOpenedPageId: (openedPageId) => set({ openedPageId }),

    // Helper implementation
    getChildren: (folderId) => {
        const { fileSystem } = get();
        return fileSystem.filter((entry) => entry.parentId === folderId);
    }
}));
