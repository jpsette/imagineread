/**
 * useDashboardHandlers
 * 
 * Custom hook to encapsulate all dashboard action handlers.
 * Extracted from DashboardScreen for better separation of concerns.
 */

import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Project, FileEntry } from '@shared/types';
import { useProjectStore } from '@app/store/useProjectStore';
import { useUIStore } from '@app/store/useUIStore';
import { useFileActions } from '@shared/hooks/useFileActions';
import { useProjectActions } from '@shared/hooks/useProjectActions';
import { PROJECT_THEMES } from '../../../constants/theme';

interface UseDashboardHandlersOptions {
    projects: Project[];
    currentFolderId: string | null;
    setCurrentFolderId: (id: string | null) => void;
}

export function useDashboardHandlers({
    projects,
    currentFolderId,
    setCurrentFolderId
}: UseDashboardHandlersOptions) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Stores
    const { currentProjectId, setCurrentProjectId } = useProjectStore();
    const { setView, setIsCreatingProject } = useUIStore();

    // Actions from hooks
    const { createProject, updateProject, deleteProject, togglePin: togglePinProject } = useProjectActions();
    const { createFolder, deleteFolder, uploadPages, uploadPDF, renameItem, togglePin, importComicLocal } = useFileActions();

    // Local state
    const [isImporting, setIsImporting] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[0].bg);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // File input handlers
    const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImportFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const onFolderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImportFiles(Array.from(e.target.files));
        }
        if (folderInputRef.current) folderInputRef.current.value = '';
    }, []);

    // Project CRUD
    const handleCreateProject = useCallback(async (mode: 'cloud' | 'local' = 'cloud', path?: string) => {
        if (!newItemName.trim()) return;

        const newProject = await createProject(newItemName, newItemColor, mode, path);

        if (newProject) {
            setIsCreatingProject(false);
            setNewItemName('');
            setNewItemColor(PROJECT_THEMES[0].bg);
            setCurrentProjectId(newProject.id);
            setCurrentFolderId(null);
            setView('project');
        }
    }, [newItemName, newItemColor, createProject, setIsCreatingProject, setCurrentProjectId, setCurrentFolderId, setView]);

    const handleUpdateProject = useCallback((id: string, updates: Partial<Project>) => {
        updateProject(id, updates);
    }, [updateProject]);

    const handleDeleteProject = useCallback((id: string) => {
        if (confirm("Tem certeza que deseja excluir este projeto?")) {
            deleteProject(id);
            if (currentProjectId === id) {
                setCurrentProjectId(null);
                setView('dashboard');
            }
        }
    }, [deleteProject, currentProjectId, setCurrentProjectId, setView]);

    // Folder handlers
    const handleDeleteFolder = useCallback((id: string) => {
        deleteFolder(id);
        if (currentFolderId === id) {
            setCurrentFolderId(null);
        }
    }, [deleteFolder, currentFolderId, setCurrentFolderId]);

    const handleCreateFolder = useCallback(async (name: string, color: string) => {
        let parent: string | null = currentFolderId;
        if (!parent) {
            const proj = projects.find(p => p.id === currentProjectId);
            if (proj) parent = proj.localPath || proj.rootFolderId || null;
        }

        if (parent) {
            await createFolder(name, parent, color);
            return true;
        }
        return false;
    }, [currentFolderId, currentProjectId, projects, createFolder]);

    // Import handlers
    const handleImportFiles = useCallback(async (files: File[]) => {
        if (!files || files.length === 0) return;

        let target: string | null = currentFolderId;
        if (!target && currentProjectId) {
            const proj = projects.find(p => p.id === currentProjectId);
            if (proj) target = proj.rootFolderId || null;
        }

        if (!target) return;

        setIsImporting(true);
        try {
            const pdfs = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
            const images = files.filter(f => !pdfs.includes(f));

            if (pdfs.length > 0) {
                for (const pdf of pdfs) {
                    await uploadPDF(pdf, target);
                }
            }

            if (images.length > 0) {
                await uploadPages(images, target);
            }
        } finally {
            setIsImporting(false);
        }
    }, [currentFolderId, currentProjectId, projects, uploadPDF, uploadPages]);

    const handleImportFilesLocal = useCallback(async () => {
        const currentProject = projects.find(p => p.id === currentProjectId);
        if (!currentProject?.localPath) return;

        const targetPath = currentFolderId || currentProject.localPath;

        try {
            const success = await importComicLocal(targetPath, () => setIsImporting(true));

            if (success) {
                queryClient.invalidateQueries({ queryKey: ['filesystem', currentFolderId] });
                queryClient.invalidateQueries({ queryKey: ['filesystem', targetPath] });
                alert('Quadrinho importado com sucesso!');
            }
        } finally {
            setIsImporting(false);
        }
    }, [projects, currentProjectId, currentFolderId, importComicLocal, queryClient]);

    // Navigation
    const handleOpenComic = useCallback((comicId: string) => {
        const encodedId = encodeURIComponent(comicId);
        navigate(`/comic/${encodedId}`);
    }, [navigate]);

    const handleSelectProject = useCallback((id: string) => {
        setCurrentProjectId(id);
        setCurrentFolderId(null);
        setView('project');
    }, [setCurrentProjectId, setCurrentFolderId, setView]);

    const handleOpenItem = useCallback((node: FileEntry) => {
        setCurrentFolderId(node.id);
    }, [setCurrentFolderId]);

    const handleBack = useCallback(() => {
        setView('dashboard');
    }, [setView]);

    return {
        // State
        isImporting,
        newItemName,
        setNewItemName,
        newItemColor,
        setNewItemColor,

        // Refs
        fileInputRef,
        folderInputRef,

        // File input handlers
        onFileChange,
        onFolderChange,

        // Project handlers
        handleCreateProject,
        handleUpdateProject,
        handleDeleteProject,
        togglePinProject,

        // Folder handlers
        handleDeleteFolder,
        handleCreateFolder,

        // Import handlers
        handleImportFiles,
        handleImportFilesLocal,

        // Navigation
        handleOpenComic,
        handleSelectProject,
        handleOpenItem,
        handleBack,

        // Passthrough actions
        renameItem,
        togglePin
    };
}
