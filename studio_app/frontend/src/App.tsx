import React, { useState, useEffect } from 'react';
import DraggableWindow from './components/DraggableWindow';
import Explorer from './components/Explorer';
import ProjectManager from './components/ProjectManager';
import ProjectDetail from './components/ProjectDetail';
import EditorView from './components/EditorView';
import ComicWorkstation from './components/ComicWorkstation';
import { api } from './services/api';
import { electronBridge } from './services/electronBridge';
import { Project, FileEntry } from './types';

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
    // === CORE STATE ===
    const [projects, setProjects] = useState<Project[]>([]);
    const [view, setView] = useState<'dashboard' | 'project'>('dashboard');
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [openedComicId, setOpenedComicId] = useState<string | null>(null);
    const [openedPageId, setOpenedPageId] = useState<string | null>(null);
    const [openedPageUrl, setOpenedPageUrl] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

    // === HANDLERS ===
    const handleUpdate = async (id: string, data: Partial<Project>) => {
        try {
            await api.updateProject(id, data);

            // Optimistic update locally or re-fetch? Re-fetch ensures consistency.
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
        if (!confirm("Tem certeza que deseja excluir este projeto?")) return;

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
            // TODO: Implement API delete for files
            // For now just local state as before? The original code didn't see an API call for deleting pages?
            // "setFileSystem(prev => prev.filter..." was just local?
            // Yes, original code did NOT call backend for page deletion! 
            // We should stick to behavior but note this for future.
            setFileSystem(prev => prev.filter(f => !pageIds.includes(f.id)));
            console.warn("Deleted pages locally only - Backend implementation pending in original code");
        }
    };

    const handleDeleteFolder = (folderId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta pasta e todo seu conteúdo?')) {
            // Same as above, original code was local state only?? 
            // "window.electron.deleteProject" existed but files?
            // Assuming local for now to respect "Refactor" scope without adding features not present.
            setFileSystem(prev => prev.filter(f => f.id !== folderId && f.parentId !== folderId));
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
                    id: data.id, // Use Backend ID
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

        // CRITICAL: Determine parent folder
        const targetParentId = currentFolderId || (currentProjectId ? projects.find(p => p.id === currentProjectId)?.rootFolderId : null) || 'root';

        setLoading(true);
        try {
            const data = await api.uploadPDF(file, targetParentId);

            // Create Comic
            const comicId = `comic-${Date.now()}`;
            const newComic: FileEntry = {
                id: comicId,
                name: file.name.replace('.pdf', ''),
                type: 'comic',
                parentId: targetParentId, // Add to current folder or root
                createdAt: new Date().toISOString(),
                isPinned: false,
                order: 0,
                url: '' // Comic folder has no URL
            };

            // Create Pages
            // Backend returns { id, url, name } objects now
            const newPages: FileEntry[] = data.pages.map((p, index) => ({
                id: p.id, // Use ID from Backend
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
        <div className="w-screen h-screen bg-[#09090b] text-zinc-100 overflow-hidden flex flex-col">
            {/* === HEADER === */}
            <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-[#09090b] z-50 shrink-0 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-4 text-xs font-medium text-zinc-400">Imagine Read Studio</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-xs px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition"
                    >
                        Sidebar
                    </button>
                    <button
                        onClick={() => {
                            setView('dashboard');
                            setOpenedComicId(null);
                        }}
                        className="text-xs px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition"
                    >
                        Home
                    </button>
                </div>
            </div>

            {/* === MAIN CONTENT === */}
            <main className="flex-1 flex overflow-hidden p-2 gap-2 relative bg-[#0c0c0e]">
                {/* SIDEBAR */}
                {isSidebarOpen && (
                    <div className="w-[320px] h-full flex flex-col shrink-0">
                        <DraggableWindow
                            title="Explorador"
                            onClose={() => setIsSidebarOpen(false)}
                            minimize={false}
                            docked={true}
                            className="h-full border-r border-[#27272a]"
                        >
                            <Explorer
                                projects={projects}
                                fileSystem={fileSystem as any} // Temporary cast until Explorer allows FileEntry exact types
                                currentProjectId={currentProjectId}
                                currentFolderId={currentFolderId}
                                onSelectProject={(id) => {
                                    setCurrentProjectId(id);
                                    setCurrentFolderId(null);
                                    setView('project');
                                }}
                                onSelectFolder={(id) => {
                                    setCurrentFolderId(id);
                                    setView('project');
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
                    </div>
                )}

                {/* MAIN AREA */}
                <div className="flex-1 h-full relative flex flex-col min-w-0">
                    {/* COMIC WORKSTATION - Shows all pages of a comic */}
                    {openedComicId && !openedPageId && (() => {
                        const comic = fileSystem.find((f: any) => f.id === openedComicId);
                        const pages = fileSystem.filter((f: any) => f.parentId === openedComicId);

                        return (
                            <div className="absolute inset-0 z-50">
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
                            </div>
                        );
                    })()}

                    {/* PAGE EDITOR - Shows single page editor */}
                    {openedPageId && (
                        <div className="absolute inset-0 z-50 bg-black">
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
                        </div>
                    )}

                    {/* MAIN WINDOW */}
                    <DraggableWindow
                        title={
                            view === 'dashboard'
                                ? 'Gerenciador'
                                : `Projeto: ${projects.find(p => p.id === currentProjectId)?.name || '...'}`
                        }
                        onClose={() => { }}
                        minimize={false}
                        docked={true}
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
                                onUploadPDF={handleUploadPDF}
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
                                newItemName=""
                                setNewItemName={() => { }}
                                newItemColor=""
                                setNewItemColor={() => { }}
                                editingFolder={null}
                                setEditingFolder={() => { }}
                                editName=""
                                setEditName={() => { }}
                                editColor=""
                                setEditColor={() => { }}
                                PROJECT_THEMES={PROJECT_THEMES}
                                onCreateFolder={() => { }}
                                onUpdateFolder={() => { }}
                                onStartEditingFolder={() => { }}
                                onTogglePin={() => { }}
                                onImportFiles={handleImportFiles}
                                onDeletePages={handleDeletePages}
                            />
                        )}
                    </DraggableWindow>
                </div>
            </main>
        </div>
    );
};

export default App;
