import React, { useState, useEffect } from 'react';
import DraggableWindow from './ui/DraggableWindow';
import Explorer from './features/dashboard/Explorer';
import ProjectManager from './features/dashboard/ProjectManager';
import ProjectDetail from './features/dashboard/ProjectDetail';
import EditorView from './features/editor/EditorView';
import ComicWorkstation from './features/editor/ComicWorkstation';
import { api } from './services/api';
// electronBridge removed
import { Project, FileEntry } from './types';
import { MainLayout } from './layouts/MainLayout';
import { EditorLayout } from './layouts/EditorLayout';

// --- THEMES CONSTANT ---
const PROJECT_THEMES = [
    // ... (omitting lines for brevity in tool call, focusing on target content)
    // Actually I will do two separate replaces to avoid matching the large block of constants which I don't want to list.
    // Edit 1: Add import
    // Edit 2: Replace ComicWorkstation wrapper
    // Edit 3: Replace EditorView wrapper
    // Wait, I can do it in one go if I use multi_replace. Or just be smart about chunks.
    // I'll stick to replace_file_content but do it in chunks? No, replace_file_content is single contiguous.
    // I'll use separate calls or list a larger chunk if they are close. They are not close (import is at top).
    // I will use multi_replace_file_content.

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
    // === VISIBILITY STATE (MDI) ===
    const [showExplorer, setShowExplorer] = useState(true);
    const [showManager, setShowManager] = useState(true);

    // === CORE STATE ===
    const [projects, setProjects] = useState<Project[]>([]);
    const [view, setView] = useState<'dashboard' | 'project'>('dashboard');
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [openedComicId, setOpenedComicId] = useState<string | null>(null);
    const [openedPageId, setOpenedPageId] = useState<string | null>(null);
    const [openedPageUrl, setOpenedPageUrl] = useState<string>('');
    const [fileSystem, setFileSystem] = useState<FileEntry[]>([]);

    // === PROJECT MANAGER STATE ===
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
    const [isCreatingProject, setIsCreatingProject] = useState(false);
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
        console.log('🔍 DEBUG - Current Project:', currentProjectId);
    }, [projects, fileSystem, currentProjectId]);



    // === HANDLERS ===
    const handleUpdate = async (id: string, data: Partial<Project>) => {
        try {
            await api.updateProject(id, data);
            const newP = await api.getProjects();
            setProjects(newP);
            setEditingProject(null);
        } catch (e) {
            console.error("Failed to update project", e);
            alert("Erro ao atualizar projeto");
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        // Confirmation is now handled in the UI components (ProjectManager)

        try {
            await api.deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            if (currentProjectId === id) {
                setCurrentProjectId(null);
                setView('dashboard');
            }
        } catch (e) {
            console.error("Failed to delete project", e);
            alert("Erro ao deletar projeto");
        }
    };

    const handleCreate = async () => {
        if (!newItemName) return;
        try {
            const newP = await api.createProject({ name: newItemName, color: newItemColor });
            setProjects(prev => [...prev, newP]);
            setCurrentProjectId(newP.id);
            // setView('project'); // Don't auto-switch, let them stay in dashboard if created via menu, or switch.
            // Actually usually creation implies navigating to it.
            // But if we are in MDI, maybe we just show it.
            // Let's keep auto-switch for feedback.
            setView('project');
            setIsCreatingProject(false);
            setNewItemName('');
        } catch (e) {
            console.error("Failed to create project", e);
            alert("Erro ao criar projeto");
        }
    };

    const handleTogglePin = (id: string) => {
        const p = projects.find(x => x.id === id);
        if (p) handleUpdate(id, { isPinned: !p.isPinned });
    };

    // Page/File management handlers
    const handleDeletePages = (pageIds: string[]) => {
        if (confirm('Tem certeza que deseja excluir os itens selecionados?')) {
            setFileSystem(prev => prev.filter(f => !pageIds.includes(f.id)));
            console.warn("Deleted pages locally only - Backend implementation pending in original code");
        }
    };

    const handleDeleteFolder = (folderId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta pasta e todo seu conteúdo?')) {
            setFileSystem(prev => prev.filter(f => f.id !== folderId && f.parentId !== folderId));
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName) return;
        const targetParentId = currentFolderId || (currentProjectId ? projects.find(p => p.id === currentProjectId)?.rootFolderId : null);

        if (!targetParentId) {
            console.error("No target parent found for folder creation");
            return;
        }

        try {
            setLoading(true);
            const res = await api.createFolder({ name: newFolderName, parentId: targetParentId });

            // Optimistic update or fetch? Let's just optimistic for now or append to fileSystem
            // Since backend just returns id/name, we construct the object OR reload.
            // Let's reload to be safe and consistent with other patterns, OR construct manual entry.
            // Backend create_folder logic in Step 477 returns {status, id, name}.
            // It actually inserts into DB. So reloading filesystem is safest.
            await loadData();

            setIsCreatingFolder(false);
            setNewFolderName('');
            setNewFolderColor(PROJECT_THEMES[0].bg);
        } catch (e) {
            console.error(e);
            alert('Erro ao criar pasta');
        } finally {
            setLoading(false);
        }
    };


    const handleAddPages = async (files: File[]) => {
        const targetParentId = openedComicId || currentFolderId || (currentProjectId ? projects.find(p => p.id === currentProjectId)?.rootFolderId : null);

        if (!targetParentId) {
            console.error("No target parent ID found for upload");
            return;
        }

        setLoading(true);
        const uploadedPages: FileEntry[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const data = await api.uploadPage(file, targetParentId);
                uploadedPages.push({
                    id: data.id,
                    name: file.name,
                    type: 'file',
                    parentId: targetParentId,
                    url: data.url,
                    createdAt: new Date().toISOString(),
                    order: 9999 + i,
                    isPinned: false
                });
            } catch (e) {
                console.error(e);
                alert(`Erro ao enviar imagem ${file.name}`);
            }
        }

        if (uploadedPages.length > 0) {
            setFileSystem(prev => [...prev, ...uploadedPages]);
        }
        setLoading(false);
    };

    const handleUploadPDF = async (file: File) => {
        if (!file || file.type !== 'application/pdf') {
            alert('Por favor, selecione um arquivo PDF.');
            return;
        }

        const targetParentId = currentFolderId || (currentProjectId ? projects.find(p => p.id === currentProjectId)?.rootFolderId : null) || 'root';

        setLoading(true);
        try {
            const data = await api.uploadPDF(file, targetParentId);
            const comicId = `comic-${Date.now()}`;
            const newComic: FileEntry = {
                id: comicId,
                name: file.name.replace('.pdf', ''),
                type: 'comic',
                parentId: targetParentId,
                createdAt: new Date().toISOString(),
                isPinned: false,
                order: 0,
                url: ''
            };

            const newPages: FileEntry[] = data.pages.map((p, index) => ({
                id: p.id,
                name: p.name,
                type: 'file',
                parentId: comicId,
                url: p.url,
                createdAt: new Date().toISOString(),
                order: index,
                isPinned: false
            }));

            setFileSystem(prev => [...prev, newComic, ...newPages]);
            alert('Quadrinho importado com sucesso!');

        } catch (error) {
            console.error(error);
            alert('Erro ao importar PDF.');
        } finally {
            setLoading(false);
        }
    };

    const handleImportFiles = (files: File[]) => {
        const pdfs = files.filter(f => f.type === 'application/pdf');
        const images = files.filter(f => f.type.startsWith('image/'));

        pdfs.forEach(f => handleUploadPDF(f));
        if (images.length > 0) handleAddPages(images);
    };

    return (
        <MainLayout
            onCreateProject={() => {
                setShowManager(true); // Ensure manager is open
                setIsCreatingProject(true); // Trigger creation mode
                setView('dashboard'); // Switch to dashboard view
            }}
            showExplorer={showExplorer}
            onToggleExplorer={() => setShowExplorer(!showExplorer)}
            showManager={showManager}
            onToggleManager={() => setShowManager(!showManager)}
            isInEditor={!!openedPageId}
        >
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
                        onEditProject={(p) => handleUpdate(p.id, { name: p.name, color: p.color })}
                        onDeleteProject={handleDelete}
                        onPinProject={handleTogglePin}
                        onEditFolder={() => { }}
                        onDeleteFolder={handleDeleteFolder}
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
                            onCreateProject={handleCreate}
                            onSelectProject={(id) => {
                                setCurrentProjectId(id);
                                setView('project');
                            }}
                            onTogglePin={handleTogglePin}
                            onDeleteProject={handleDelete}
                            onUpdateProject={() => {
                                if (editingProject) {
                                    handleUpdate(editingProject.id, { name: editName, color: editColor });
                                }
                            }}
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
                            onCreateFolder={handleCreateFolder}
                            onUpdateFolder={() => { }}
                            onStartEditingFolder={() => { }}
                            onTogglePin={() => { }}
                            onImportFiles={handleImportFiles}
                            onDeletePages={handleDeletePages}
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
                            onSelectPage={(pageId, pageUrl) => {
                                setOpenedPageId(pageId);
                                setOpenedPageUrl(pageUrl);
                            }}
                            onAddPages={handleAddPages}
                            onDeletePages={handleDeletePages}
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
                            setOpenedPageUrl('');
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
