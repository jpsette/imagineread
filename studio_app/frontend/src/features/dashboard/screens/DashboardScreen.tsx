import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../../../layouts/MainLayout';
import DraggableWindow from '../../../ui/DraggableWindow';
import { LazyExplorer } from '../components/LazyExplorer/LazyExplorer';
import ProjectManager from '../ProjectManager';
import { ProjectDetail } from '../ProjectDetail';
import { RenameItemModal } from '../components/RenameItemModal';
import { api } from '../../../services/api';

// Stores & Hooks
import { useProjectStore } from '../../../store/useProjectStore';

import { useUIStore } from '../../../store/useUIStore';
import { useFileActions } from '../../../hooks/useFileActions';
import { useProjectActions } from '../../../hooks/useProjectActions';
import { useProjects } from '../hooks/useProjects'; // New Hook

// Types & Constants
import { Project, FileEntry } from '../../../types';
import { PROJECT_THEMES } from '../../../constants/theme';

export const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();

    // === GLOBAL STORES (Legacy - Keeping currentProjectId for selection state) ===
    const { currentProjectId, setCurrentProjectId } = useProjectStore();

    // === DATA FETCHING (React Query) ===
    const { data: projectsData } = useProjects();
    const projects = projectsData || [];

    // Fetch FULL FileSystem for Breadcrumbs & Navigation Context
    // We need the whole tree to reconstruct paths.
    const { data: fullFileSystem } = useQuery({
        queryKey: ['filesystem', 'full'],
        queryFn: () => api.getFileSystem(), // Fetches all files flat
        staleTime: 1000 * 60 * 5, // 5 min cache
    });

    const {
        showExplorer, setShowExplorer,
        showManager, setShowManager,
        view, setView,
        isCreatingProject, setIsCreatingProject
    } = useUIStore();

    // === ACTIONS (HOOKS) ===
    const { createProject, updateProject, deleteProject, togglePin: togglePinProject } = useProjectActions();
    const { createFolder, deleteFolder, uploadPages, uploadPDF, renameItem, togglePin } = useFileActions();

    // === LOCAL DASHBOARD STATE ===
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // === LAZY LOAD DATA ===




    // Explorer State (LazyExplorer handles expansion locally mostly, but we keep projects for persistence if needed later)
    const [expandedProjects] = useState<Set<string>>(new Set());


    // Rename Modal State
    const [itemToRename, setItemToRename] = useState<FileEntry | null>(null);

    // Project Manager State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[0].bg);

    // Project Detail State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(PROJECT_THEMES[1].bg);

    // === HANDLERS ===
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImportFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleImportFiles(Array.from(e.target.files));
        }
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    const handleCreateWrapper = async () => {
        if (!newItemName.trim()) return;
        const newProject = await createProject(newItemName, newItemColor);
        if (newProject) {
            setIsCreatingProject(false);
            setNewItemName('');
            setNewItemColor(PROJECT_THEMES[0].bg);
            setCurrentProjectId(newProject.id);
            setView('project');
        }
    };

    const handleUpdateWrapper = (id: string, updates: Partial<Project>) => {
        updateProject(id, updates);
        // setEditingProject(null); // Removed
    };

    const handleDeleteWrapper = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este projeto?")) {
            deleteProject(id);
            if (currentProjectId === id) {
                setCurrentProjectId(null);
                setView('dashboard');
            }
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !currentProjectId) return;
        // Determine parent: currentFolderId OR project root
        let parent: string | null = currentFolderId;
        if (!parent) {
            const proj = projects.find(p => p.id === currentProjectId);
            if (proj) parent = proj.rootFolderId || null;
        }

        if (parent) {
            await createFolder(newFolderName, parent, newFolderColor);
            setIsCreatingFolder(false);
            setNewFolderName('');
        }
    };

    const handleDeleteFolderWrapper = (id: string) => {
        deleteFolder(id);
        if (currentFolderId === id) {
            setCurrentFolderId(null);
        }
    };

    // Import Loading State
    const [isImporting, setIsImporting] = useState(false);

    const handleImportFiles = async (files: File[]) => {
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
    };

    return (
        <MainLayout isInEditor={false}>
            {/* EXPLORER WINDOW */}
            {showExplorer && (
                <DraggableWindow
                    title="Explorador de Arquivos (Lazy)"
                    onClose={() => setShowExplorer(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 20, y: 80 }}
                    initialSize={{ width: 300, height: 600 }}
                >
                    <LazyExplorer
                        projects={projects}
                        currentProjectId={currentProjectId}
                        currentFolderId={currentFolderId}
                        PROJECT_THEMES={PROJECT_THEMES}

                        // Actions
                        onSelectProject={(id) => {
                            setCurrentProjectId(id);
                            setCurrentFolderId(null);
                            setView('project');
                            if (!showManager) setShowManager(true);
                        }}
                        onSelectFolder={(id) => {
                            setCurrentFolderId(id);
                            setView('project');
                            if (!showManager) setShowManager(true);
                        }}
                        onEditProject={(p) => {
                            // Convert Project to FileEntry-like object for the modal
                            // This keeps the UI consistent (Lightweight Modal vs Full Manager)
                            setItemToRename({
                                ...p,
                                type: 'project',
                                parentId: null, // Projects are root
                                url: ''
                            } as FileEntry);
                        }}
                        onDeleteProject={handleDeleteWrapper}
                        onPinProject={togglePinProject}



                        onEditFolder={(folder) => {
                            setItemToRename(folder);
                        }}
                        onDeleteFolder={handleDeleteFolderWrapper}

                        // Expand State (We pass setExpandedProjects just to initial expand)
                        expandedProjects={expandedProjects}
                    />
                </DraggableWindow>
            )}

            {/* PROJECT MANAGER WINDOW */}
            {showManager && (
                <DraggableWindow
                    title={view === 'dashboard' ? 'Gerenciador de Projetos' : `Projeto: ${projects.find(p => p.id === currentProjectId)?.name || '...'}`}
                    onClose={() => setShowManager(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 340, y: 80 }}
                    initialSize={{ width: 960, height: 600 }}
                >
                    {view === 'dashboard' ? (
                        <ProjectManager
                            projects={projects}
                            PROJECT_THEMES={PROJECT_THEMES}

                            // Local State Props
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}

                            isCreatingProject={isCreatingProject}
                            setIsCreatingProject={setIsCreatingProject}
                            newItemName={newItemName}
                            setNewItemName={setNewItemName}
                            newItemColor={newItemColor}
                            setNewItemColor={setNewItemColor}

                            // Handlers
                            onCreateProject={handleCreateWrapper}
                            onUpdateProject={handleUpdateWrapper}
                            onDeleteProject={handleDeleteWrapper}
                            onSelectProject={(id) => {
                                setCurrentProjectId(id);
                                setCurrentFolderId(null); // Fix: Reset to root to avoid stale folder view
                                setView('project');
                            }}
                            onTogglePin={togglePinProject}

                            // Unified Editing
                            onEditProject={(p) => {
                                // Convert Project to FileEntry-like object for the modal
                                setItemToRename({
                                    ...p,
                                    type: 'project',
                                    parentId: null,
                                    url: ''
                                } as FileEntry);
                            }}
                        />
                    ) : (
                        <ProjectDetail
                            project={projects.find((p: any) => p.id === currentProjectId) || null}
                            currentFolderId={currentFolderId}
                            fileSystem={fullFileSystem || []}
                            searchTerm={searchTerm}
                            PROJECT_THEMES={PROJECT_THEMES}

                            // Controlled State Props
                            isCreatingFolder={isCreatingFolder}
                            setIsCreatingFolder={setIsCreatingFolder}
                            newFolderName={newFolderName}
                            setNewFolderName={setNewFolderName}
                            newFolderColor={newFolderColor}
                            setNewFolderColor={setNewFolderColor}

                            // Actions
                            onOpenItem={(node: FileEntry) => setCurrentFolderId(node.id)}
                            onOpenComic={(comicId) => navigate(`/comic/${comicId}`)}
                            onCreateFolder={handleCreateFolder}

                            onDeleteFolder={handleDeleteFolderWrapper}
                            onImportFiles={handleImportFiles}
                            onTogglePin={togglePin}
                            onBack={() => setView('dashboard')}
                            // Unified Editing
                            onEditItem={(item) => setItemToRename(item)}
                            isImporting={isImporting}
                        />
                    )}
                </DraggableWindow>
            )}
            {/* RENAME MODAL */}
            <RenameItemModal
                item={itemToRename}
                onClose={() => setItemToRename(null)}
                onRename={(id, name, color) => {
                    if (itemToRename && itemToRename.type === 'project') {
                        updateProject(id, { name, color });
                    } else {
                        renameItem(id, name, color);
                    }
                }}
                projectThemes={PROJECT_THEMES}
            />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={onFileChange}
                accept="image/*,application/pdf"
            />

            <input
                type="file"
                ref={folderInputRef}
                className="hidden"
                multiple
                // @ts-ignore - webkitdirectory is standard in Chrome/Electron but TS doesn't know
                webkitdirectory=""
                onChange={onFolderChange}
            />
        </MainLayout>
    );
};
