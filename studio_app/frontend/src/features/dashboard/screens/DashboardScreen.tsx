import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../../layouts/MainLayout';
import DraggableWindow from '../../../ui/DraggableWindow';
import { LazyExplorer } from '../components/LazyExplorer/LazyExplorer';
import ProjectManager from '../ProjectManager';
import { ProjectDetail } from '../ProjectDetail';

// Stores & Hooks
import { useProjectStore } from '../../../store/useProjectStore';
import { useFileSystemStore } from '../../../store/useFileSystemStore';
import { useUIStore } from '../../../store/useUIStore';
import { useFileActions } from '../../../hooks/useFileActions';
import { useProjectActions } from '../../../hooks/useProjectActions';

// Types & Constants
import { Project, FileEntry } from '../../../types';
import { PROJECT_THEMES } from '../../../constants/theme';

export const DashboardScreen: React.FC = () => {
    const navigate = useNavigate();

    // === GLOBAL STORES ===
    const { projects, currentProjectId, setCurrentProjectId } = useProjectStore();
    const { fileSystem } = useFileSystemStore();
    const {
        showExplorer, setShowExplorer,
        showManager, setShowManager,
        view, setView,
        isCreatingProject, setIsCreatingProject
    } = useUIStore();

    // === ACTIONS (HOOKS) ===
    const { createProject, updateProject, deleteProject, togglePin } = useProjectActions();
    const { createFolder, deleteFolder, uploadPages, uploadPDF, renameItem } = useFileActions();

    // === LOCAL DASHBOARD STATE ===
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // === LAZY LOAD DATA ===
    // We try to load data for the current folder. 
    // The Explorer (Legacy) expects a full flattened fileSystem array.
    // To mix them, we stick to fileSystem store for now (fetched globally in App.tsx)
    // But for "Contents View" we should use this query.
    // However, Explorer component relies on the prop `fileSystem`.
    // Strategy: Phase 2 is infrastructure. We installed the pipes.
    // We continue using 'fileSystem' store which is eager-loaded until we rewrite Explorer to be async.
    // So for now we just import it to ensure it 'compiles' and is ready, but we don't force it yet 
    // to avoid breaking the recursive synchronous Explorer.

    // import { useFolderContents } from '../hooks/useFolderContents';
    // const { data: lazyFiles } = useFolderContents(currentFolderId);

    // Explorer State (LazyExplorer handles expansion locally mostly, but we keep projects for persistence if needed later)
    const [expandedProjects] = useState<Set<string>>(new Set());
    // const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); // Removed for Lazy Load

    // Project Manager State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[0].bg);

    // Editing Project State
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    // Project Detail State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(PROJECT_THEMES[1].bg);

    // === HANDLERS ===

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
        setEditingProject(null);
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

    const handleImportFiles = async (files: File[]) => {
        if (!files || files.length === 0) return;

        let target: string | null = currentFolderId;
        if (!target && currentProjectId) {
            const proj = projects.find(p => p.id === currentProjectId);
            if (proj) target = proj.rootFolderId || null;
        }

        if (!target) return;

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
                            setEditingProject(p);
                            setEditName(p.name);
                            setEditColor(p.color);
                            if (!showManager) setShowManager(true);
                        }}
                        onDeleteProject={handleDeleteWrapper}
                        onPinProject={togglePin}

                        onEditFolder={() => { /* Not implemented yet locally */ }}
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

                            editingProject={editingProject}
                            setEditingProject={setEditingProject}
                            editName={editName}
                            setEditName={setEditName}
                            editColor={editColor}
                            setEditColor={setEditColor}

                            // Handlers
                            onCreateProject={handleCreateWrapper}
                            onUpdateProject={handleUpdateWrapper}
                            onDeleteProject={handleDeleteWrapper}
                            onSelectProject={(id) => {
                                setCurrentProjectId(id);
                                setView('project');
                            }}
                            onTogglePin={togglePin}
                        />
                    ) : (
                        <ProjectDetail
                            project={projects.find((p: any) => p.id === currentProjectId) || null}
                            currentFolderId={currentFolderId}
                            fileSystem={fileSystem as any}
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
                            onRenameFolder={(id, newName, newColor) => renameItem(id, newName, newColor)}
                            onDeleteFolder={handleDeleteFolderWrapper}
                            onImportFiles={handleImportFiles}
                            onBack={() => setView('dashboard')}
                        />
                    )}
                </DraggableWindow>
            )}
        </MainLayout>
    );
};
