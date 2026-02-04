/**
 * useModalState
 * 
 * Custom hook to manage modal state for the Dashboard.
 * Centralizes modal visibility and related state.
 */

import { useState, useCallback } from 'react';
import { FileEntry, Project } from '@shared/types';

interface UseModalStateReturn {
    // Rename Modal
    itemToRename: FileEntry | null;
    setItemToRename: (item: FileEntry | null) => void;
    openRenameModal: (item: FileEntry | Project, isProject?: boolean) => void;
    closeRenameModal: () => void;

    // Create Folder/Library Modal
    isCreatingFolder: boolean;
    setIsCreatingFolder: (value: boolean) => void;
    openCreateFolderModal: () => void;
    closeCreateFolderModal: () => void;
}

export function useModalState(): UseModalStateReturn {
    // Rename Modal State
    const [itemToRename, setItemToRename] = useState<FileEntry | null>(null);

    // Create Folder Modal State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // Rename Modal Actions
    const openRenameModal = useCallback((item: FileEntry | Project, isProject = false) => {
        if (isProject) {
            // Convert Project to FileEntry-like object for the modal
            setItemToRename({
                ...item,
                type: 'project',
                parentId: null,
                url: ''
            } as FileEntry);
        } else {
            setItemToRename(item as FileEntry);
        }
    }, []);

    const closeRenameModal = useCallback(() => {
        setItemToRename(null);
    }, []);

    // Create Folder Modal Actions
    const openCreateFolderModal = useCallback(() => {
        setIsCreatingFolder(true);
    }, []);

    const closeCreateFolderModal = useCallback(() => {
        setIsCreatingFolder(false);
    }, []);

    return {
        // Rename Modal
        itemToRename,
        setItemToRename,
        openRenameModal,
        closeRenameModal,

        // Create Folder Modal
        isCreatingFolder,
        setIsCreatingFolder,
        openCreateFolderModal,
        closeCreateFolderModal
    };
}
