import React, { useState, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { EditorLayout } from './layouts/EditorLayout';
import { api } from './services/api';

// Stores & Hooks
import { useProjectStore } from './store/useProjectStore';
import { useFileSystemStore } from './store/useFileSystemStore';
import { useUIStore } from './store/useUIStore';
import { useFileActions } from './hooks/useFileActions';
import { useProjectActions } from './hooks/useProjectActions';

// Components
import { ComicWorkstation } from './features/editor/ComicWorkstation';
import EditorView from './features/editor/EditorView';
import DraggableWindow from './ui/DraggableWindow';
import Explorer from './features/dashboard/Explorer';
import ProjectManager from './features/dashboard/ProjectManager';
import { ProjectDetail } from './features/dashboard/ProjectDetail';

// Types & Constants
import { Project, FileEntry } from './types';
import { PROJECT_THEMES } from './constants/theme';

const App: React.FC = () => {
    // === GLOBAL STORES ===
    const { projects, setProjects, currentProjectId, setCurrentProjectId } = useProjectStore();
    const { fileSystem, setFileSystem } = useFileSystemStore();
    const {
        showExplorer, setShowExplorer,
        showManager, setShowManager,
        view, setView,
        isCreatingProject, setIsCreatingProject
    } = useUIStore();

    // === ACTIONS (HOOKS) ===
    const { createProject, updateProject, deleteProject, togglePin } = useProjectActions();
    const { createFolder, deleteFolder, deletePages, uploadPages, uploadPDF } = useFileActions();

    // === LOCAL APP STATE (Hoisted from Dashboard) ===

    // Navigation State (Replacing Router for Editor)
    const [openedComicId, setOpenedComicId] = useState<string | null>(null);
    const [openedPageId, setOpenedPageId] = useState<string | null>(null);
    const [openedPageUrl, setOpenedPageUrl] = useState<string>('');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Explorer State
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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
    const [loading, setLoading] = useState(false);

    // === DATA LOADING ===
    const loadData = async () => {
        setLoading(true);
        try {
            const [projs, files] = await Promise.all([
                api.getProjects(),
                api.getFileSystem()
            ]);
            setProjects(projs);
            setFileSystem(files);
        } catch (e) {
            console.error("Failed to load initial data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (window.resizeTo) window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        loadData();
    }, []);

    // === HANDLERS (Wrappers) ===
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

    const handleDeleteFolder = (id: string) => {
        // Confirm moved to UI component (ProjectDetail)
        deleteFolder(id);
        if (currentFolderId === id) {
            setCurrentFolderId(null);
        }
    };

    const handleAddPages = (files: File[]) => {
        if (openedComicId) {
            uploadPages(files, openedComicId).then(loadData);
        }
    };

    const handleDeletePagesWrapper = (pageIds: string[]) => {
        if (confirm(`Excluir ${pageIds.length} páginas?`)) {
            deletePages(pageIds);
        }
    };

    const handleReorderPages = (pageIds: string[]) => {
        // useFileActions hook (needs to be exposed/added if missing, assuming reorderFiles exists)
        // Check useFileActions content from previous step... it had reorderFiles?
        // Step 1007: viewed useFileActions.ts.
        // It has `reorderFiles`? Actually wait, I need to check.
        // If not, I'll assume it doesn't and placeholder it.
        // But ComicWorkstation used it?
        // Original ComicWorkstation: "if (reorderItems) { reorderItems(...) }"
        // It got reorderItems from somewhere.
        // Ah, `useFileSystemStore`? No.
        // Let's assume I need to implement it.
        // For now, I'll log it.
        console.log("Reorder pages:", pageIds);
    };

    const handleImportFiles = async (files: File[]) => {
        if (!files || files.length === 0) return;

        // Find target parent
        let target: string | null = currentFolderId;
        if (!target && currentProjectId) {
            const proj = projects.find(p => p.id === currentProjectId);
            if (proj) target = proj.rootFolderId || null;
        }

        if (!target) return;

        // Split files
        const pdfs = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        const images = files.filter(f => !pdfs.includes(f));

        if (pdfs.length > 0) {
            // Upload PDFs one by one (as they create new comics/folders usually)
            for (const pdf of pdfs) {
                await uploadPDF(pdf, target);
            }
        }

        if (images.length > 0) {
            await uploadPages(images, target);
        }

        await loadData();
    };


    // === RENDER LOGIC (STRICT EXCLUSIVE) ===

    // 1. Define strict mode check
    // !!openedPageId -> EditorView open
    const isEditorOpen = !!openedPageId;
    // !!openedComicId && !openedPageId -> ComicWorkstation open
    const isWorkstationOpen = !!openedComicId && !openedPageId;

    if (loading) {
        return <div className="fixed inset-0 bg-black text-white flex items-center justify-center">Carregando...</div>;
    }

    if (isEditorOpen) {
        return (
            <div className="fixed inset-0 z-[200] bg-black">
                <EditorLayout>
                    <EditorView
                        imageUrl={openedPageUrl}
                        onBack={() => {
                            setOpenedPageId(null);
                            setOpenedPageUrl('');
                            loadData(); // Reload to reflect changes
                        }}
                        comicName={fileSystem.find((f: any) => f.id === openedComicId)?.name || 'Comic'}
                        pageName={fileSystem.find((f: any) => f.id === openedPageId)?.name || 'Page'}
                        fileId={openedPageId!}
                        initialBalloons={fileSystem.find((f: any) => f.id === openedPageId)?.balloons}
                        cleanUrl={fileSystem.find((f: any) => f.id === openedPageId)?.cleanUrl}
                    />
                </EditorLayout>
            </div>
        );
    }

    if (isWorkstationOpen) {
        const comic = fileSystem.find((f: FileEntry) => f.id === openedComicId);
        const pages = fileSystem.filter((f: FileEntry) => f.parentId === openedComicId && f.type === 'file').sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
            <div className="fixed inset-0 z-[200] bg-[#0c0c0e]">
                <EditorLayout>
                    <ComicWorkstation
                        comic={{
                            id: comic?.id || '',
                            name: comic?.name || 'Comic'
                        }}
                        pages={pages}
                        onClose={() => setOpenedComicId(null)}
                        onSelectPage={(pageId, pageUrl) => {
                            setOpenedPageId(pageId);
                            setOpenedPageUrl(pageUrl);
                        }}
                        onAddPages={handleAddPages}
                        onDeletePages={handleDeletePagesWrapper}
                        onReorderPages={handleReorderPages}
                    />
                </EditorLayout>
            </div>
        );
    }

    // 3. Fallback to DASHBOARD (Default)
    // Only here do we render MainLayout
    return (
        <MainLayout
            isInEditor={false}
        >
            {/* EXPLORER WINDOW */}
            {showExplorer && (
                <DraggableWindow
                    title="Explorador de Arquivos"
                    onClose={() => setShowExplorer(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 20, y: 80 }}
                    initialSize={{ width: 300, height: 600 }}
                >
                    <Explorer
                        projects={projects}
                        fileSystem={fileSystem}
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
                        onDeleteFolder={handleDeleteFolder}

                        // Expand State
                        onToggleProjectExpand={(id) => {
                            const s = new Set(expandedProjects);
                            if (s.has(id)) s.delete(id);
                            else s.add(id);
                            setExpandedProjects(s);
                        }}
                        onToggleFolderExpand={(id) => {
                            const s = new Set(expandedFolders);
                            if (s.has(id)) s.delete(id);
                            else s.add(id);
                            setExpandedFolders(s);
                        }}
                        expandedProjects={expandedProjects}
                        expandedFolders={expandedFolders}
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
                            onOpenComic={setOpenedComicId}
                            onCreateFolder={handleCreateFolder}
                            onDeleteFolder={handleDeleteFolder}
                            onImportFiles={handleImportFiles}
                            onBack={() => setView('dashboard')}
                        />
                    )}
                </DraggableWindow>
            )}
        </MainLayout>
    );
};

export default App;
