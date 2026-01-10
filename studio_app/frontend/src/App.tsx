import React, { useState, useEffect } from 'react';
import DraggableWindow from './ui/DraggableWindow';
import Explorer from './features/dashboard/Explorer';
import ProjectManager from './features/dashboard/ProjectManager';
import ProjectDetail from './features/dashboard/ProjectDetail';
import EditorView from './features/editor/EditorView';
import ComicWorkstation from './features/editor/ComicWorkstation';
import { api } from './services/api';
// electronBridge removed
import { Project } from './types';
import { MainLayout } from './layouts/MainLayout';
import { EditorLayout } from './layouts/EditorLayout';
import { useUIStore } from './store/useUIStore';
import { useProjectStore } from './store/useProjectStore';
import { useFileSystemStore } from './store/useFileSystemStore';
import { useProjectActions } from './hooks/useProjectActions';
import { useFileActions } from './hooks/useFileActions';

// --- THEMES CONSTANT ---
const PROJECT_THEMES = [
    { bg: 'bg-blue-500', text: 'text-blue-400', lightText: 'text-blue-300' },
    { bg: 'bg-purple-500', text: 'text-purple-400', lightText: 'text-purple-300' },
    { bg: 'bg-pink-500', text: 'text-pink-400', lightText: 'text-pink-300' },
    { bg: 'bg-red-500', text: 'text-red-400', lightText: 'text-red-300' },
    { bg: 'bg-orange-500', text: 'text-orange-400', lightText: 'text-orange-300' },
    { bg: 'bg-amber-500', text: 'text-amber-400', lightText: 'text-amber-300' },
    { bg: 'bg-yellow-500', text: 'text-yellow-400', lightText: 'text-yellow-300' },
    { bg: 'bg-lime-500', text: 'text-lime-400', lightText: 'text-lime-300' },
    { bg: 'bg-green-500', text: 'text-green-400', lightText: 'text-green-300' },
    { bg: 'bg-emerald-500', text: 'text-emerald-400', lightText: 'text-emerald-300' },
    { bg: 'bg-teal-500', text: 'text-teal-400', lightText: 'text-teal-300' },
    { bg: 'bg-cyan-500', text: 'text-cyan-400', lightText: 'text-cyan-300' },
    { bg: 'bg-sky-500', text: 'text-sky-400', lightText: 'text-sky-300' },
    { bg: 'bg-indigo-500', text: 'text-indigo-400', lightText: 'text-indigo-300' },
    { bg: 'bg-violet-500', text: 'text-violet-400', lightText: 'text-violet-300' },
    { bg: 'bg-fuchsia-500', text: 'text-fuchsia-400', lightText: 'text-fuchsia-300' },
];

const App: React.FC = () => {
    // === UI STATE (Zustand) ===
    const {
        showExplorer, setShowExplorer,
        showManager, setShowManager,
        view, setView,
        isCreatingProject, setIsCreatingProject
    } = useUIStore();

    // === DATA STATE (Zustand) ===
    const {
        projects, setProjects,
        currentProjectId, setCurrentProjectId
    } = useProjectStore();

    const {
        fileSystem, setFileSystem,
        currentFolderId, setCurrentFolderId,
        openedComicId, setOpenedComicId,
        openedPageId, setOpenedPageId
    } = useFileSystemStore();

    // === ACTIONS (Hooks) ===
    const { createProject, updateProject, deleteProject, togglePin } = useProjectActions();
    const { createFolder, deleteFolder, deletePages, uploadPages, uploadPDF } = useFileActions();

    // Derived state for openedPageUrl (to avoid duplicating state)
    const openedPageUrl = openedPageId
        ? fileSystem.find(f => f.id === openedPageId)?.url || ''
        : '';

    // === PROJECT MANAGER STATE ===
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[0].bg);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    // === EXPLORER STATE ===
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // === PROJECT DETAIL STATE ===
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(PROJECT_THEMES[0].bg);

    // === DATA LOADING ===
    const [loading, setLoading] = useState(false);

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

    // DEBUG: Log state changes
    useEffect(() => {
        console.log('🔍 DEBUG - Projects:', projects);
        console.log('🔍 DEBUG - FileSystem:', fileSystem);
        console.log('🔍 DEBUG - Current Project:', currentProjectId);
    }, [projects, fileSystem, currentProjectId]);


    // === GLUE HANDLERS (Connect UI state to Actions) ===

    const handleWrapperCreateProject = async () => {
        if (!newItemName) return;
        await createProject(newItemName, newItemColor);
        setNewItemName('');
    };

    const handleWrapperUpdateProject = async () => {
        if (editingProject) {
            await updateProject(editingProject.id, { name: editName, color: editColor });
            setEditingProject(null);
        }
    };

    const handleWrapperCreateFolder = async () => {
        if (!newFolderName) return;

        const targetParentId = currentFolderId || (currentProjectId ? projects.find(p => p.id === currentProjectId)?.rootFolderId : null);
        if (!targetParentId) {
            console.error("No target parent found for folder creation");
            return;
        }

        setLoading(true);
        try {
            await createFolder(newFolderName, targetParentId);
            setIsCreatingFolder(false);
            setNewFolderName('');
            setNewFolderColor(PROJECT_THEMES[0].bg);
        } catch (e) {
            // Error handling done in hook
        } finally {
            setLoading(false);
        }
    };

    const handleWrapperAddPages = async (files: File[]) => {
        const targetParentId = openedComicId || currentFolderId || (currentProjectId ? projects.find(p => p.id === currentProjectId)?.rootFolderId : null);
        if (!targetParentId) {
            console.error("No target parent ID found for upload");
            return;
        }

        setLoading(true);
        await uploadPages(files, targetParentId);
        setLoading(false);
    };

    const handleWrapperUploadPDF = async (file: File) => {
        const targetParentId = currentFolderId || (currentProjectId ? projects.find(p => p.id === currentProjectId)?.rootFolderId : null) || 'root';

        setLoading(true);
        await uploadPDF(file, targetParentId);
        setLoading(false);
    };

    // Import files combines both
    const handleImportFiles = (files: File[]) => {
        const pdfs = files.filter(f => f.type === 'application/pdf');
        const images = files.filter(f => f.type.startsWith('image/'));

        pdfs.forEach(f => handleWrapperUploadPDF(f));
        if (images.length > 0) handleWrapperAddPages(images);
    };


    return (
        <MainLayout isInEditor={!!openedPageId}>
            {/* 1. EXPLORER (FLOATING WINDOW) */}
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
                        fileSystem={fileSystem as any}
                        currentProjectId={currentProjectId}
                        currentFolderId={currentFolderId}
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
                        onEditProject={(p) => updateProject(p.id, { name: p.name, color: p.color })}
                        onDeleteProject={(id, e) => {
                            e?.stopPropagation();
                            deleteProject(id);
                        }}
                        onPinProject={togglePin}
                        onEditFolder={() => { }}
                        onDeleteFolder={(id, e) => {
                            e?.stopPropagation();
                            if (confirm('Tem certeza que deseja excluir esta pasta e todo seu conteúdo?')) {
                                deleteFolder(id);
                            }
                        }}
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
                        PROJECT_THEMES={PROJECT_THEMES}
                    />
                </DraggableWindow>
            )}

            {/* 2. PROJECT MANAGER (FLOATING WINDOW) */}
            {showManager && (
                <DraggableWindow
                    title={
                        view === 'dashboard'
                            ? 'Gerenciador de Projetos'
                            : `Projeto: ${projects.find(p => p.id === currentProjectId)?.name || 'Carregando...'}`
                    }
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
                            onCreateProject={handleWrapperCreateProject}
                            onSelectProject={(id) => {
                                setCurrentProjectId(id);
                                setView('project');
                            }}
                            onTogglePin={togglePin}
                            onDeleteProject={(id, e) => {
                                e?.stopPropagation();
                                deleteProject(id);
                            }}
                            onUpdateProject={handleWrapperUpdateProject}
                            editingProject={editingProject}
                            setEditingProject={setEditingProject}
                            editName={editName}
                            setEditName={setEditName}
                            editColor={editColor}
                            setEditColor={setEditColor}
                            PROJECT_THEMES={PROJECT_THEMES}
                        />
                    ) : (
                        <ProjectDetail
                            project={projects.find((p: any) => p.id === currentProjectId) || null}
                            currentFolderId={currentFolderId}
                            fileSystem={fileSystem}
                            onOpenItem={(node) => setCurrentFolderId(node.id)}
                            onOpenComic={setOpenedComicId}
                            onDeleteFolder={() => { }}
                            loading={loading}
                            error={null}
                            searchTerm=""
                            sortOrder="az"
                            isCreatingFolder={isCreatingFolder}
                            setIsCreatingFolder={setIsCreatingFolder}
                            newItemName={newFolderName}
                            setNewItemName={setNewFolderName}
                            newItemColor={newFolderColor}
                            setNewItemColor={setNewFolderColor}
                            editingFolder={null}
                            setEditingFolder={() => { }}
                            editName=""
                            setEditName={() => { }}
                            editColor=""
                            setEditColor={() => { }}
                            PROJECT_THEMES={PROJECT_THEMES}
                            onCreateFolder={handleWrapperCreateFolder}
                            onUpdateFolder={() => { }}
                            onStartEditingFolder={() => { }}
                            onTogglePin={() => { }}
                            onImportFiles={handleImportFiles}
                            onDeletePages={(ids) => {
                                if (confirm('Tem certeza que deseja excluir os itens selecionados?')) {
                                    deletePages(ids);
                                }
                            }}
                            onBack={() => {
                                if (currentFolderId) {
                                    // Check if we are at the root folder of the current project
                                    const currentProject = projects.find((p: any) => p.id === currentProjectId);
                                    if (currentProject && currentFolderId === currentProject.rootFolderId) {
                                        setView('dashboard');
                                        return;
                                    }

                                    const current = fileSystem.find((f: any) => f.id === currentFolderId);
                                    // If parent is null, we are at root (logically), so exit
                                    if (!current?.parentId) {
                                        setView('dashboard');
                                    } else {
                                        setCurrentFolderId(current.parentId);
                                    }
                                } else {
                                    setView('dashboard');
                                }
                            }}
                            onRefresh={loadData}
                        />
                    )}
                </DraggableWindow>
            )}

            {/* 3. COMIC WORKSTATION (FULLSCREEN / MODAL) */}
            {/* Keep this as a modal/fullscreen overlay for now, but wrapped in EditorLayout */}
            {openedComicId && !openedPageId && (() => {
                const comic = fileSystem.find((f: any) => f.id === openedComicId);
                const pages = fileSystem.filter((f: any) => f.parentId === openedComicId);

                return (
                    <EditorLayout className="z-[200]">
                        <ComicWorkstation
                            comic={{
                                id: comic?.id || '',
                                name: comic?.name || 'Comic'
                            }}
                            pages={pages}
                            onClose={() => {
                                setOpenedComicId(null);
                            }}
                            onSelectPage={(pageId) => {
                                setOpenedPageId(pageId);
                            }}
                            onAddPages={handleWrapperAddPages}
                            onDeletePages={(ids) => {
                                if (confirm('Tem certeza que deseja excluir os itens selecionados?')) {
                                    deletePages(ids);
                                }
                            }}
                        />
                    </EditorLayout>
                );
            })()}

            {/* 4. EDITOR VIEW (FULLSCREEN / MODAL) */}
            {openedPageId && (
                <EditorLayout className="bg-black z-[200]">
                    <EditorView
                        imageUrl={openedPageUrl}
                        onBack={() => {
                            setOpenedPageId(null);
                            loadData();
                        }}
                        comicName={fileSystem.find((f: any) => f.id === openedComicId)?.name || 'Comic'}
                        pageName={fileSystem.find((f: any) => f.id === openedPageId)?.name || 'Page'}
                        fileId={openedPageId}
                        initialBalloons={fileSystem.find((f: any) => f.id === openedPageId)?.balloons}
                        cleanUrl={fileSystem.find((f: any) => f.id === openedPageId)?.cleanUrl}
                    />
                </EditorLayout>
            )}
        </MainLayout>
    );
};

export default App;
