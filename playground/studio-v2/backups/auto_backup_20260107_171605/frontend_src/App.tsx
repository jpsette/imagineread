import React, { useState, useEffect } from 'react';
import DraggableWindow from './components/DraggableWindow';
import Explorer from './components/Explorer';
import ProjectManager from './components/ProjectManager';
import ProjectDetail from './components/ProjectDetail';
import EditorView from './components/EditorView';
import ComicWorkstation from './components/ComicWorkstation';

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
    const [projects, setProjects] = useState<any[]>([]);
    const [view, setView] = useState<'dashboard' | 'project'>('dashboard');
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [openedComicId, setOpenedComicId] = useState<string | null>(null);
    const [openedPageId, setOpenedPageId] = useState<string | null>(null);
    const [openedPageUrl, setOpenedPageUrl] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [fileSystem, setFileSystem] = useState<any[]>([]);

    // === PROJECT MANAGER STATE ===
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[0].bg);
    const [editingProject, setEditingProject] = useState<any | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    // === EXPLORER STATE ===
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // === PROJECT DETAIL STATE ===
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // === DATA LOADING ===
    useEffect(() => {
        const init = async () => {
            try {
                if (window.resizeTo) window.resizeTo(window.screen.availWidth, window.screen.availHeight);
                // @ts-ignore
                if (window.electron?.getProjects) {
                    // @ts-ignore
                    const data = await window.electron.getProjects();
                    if (data) {
                        const hydrated = data.map((p: any) => ({
                            ...p,
                            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                            lastModified: p.lastModified ? new Date(p.lastModified) : new Date()
                        }));
                        setProjects(hydrated);
                    }

                    // Load filesystem (folders + comics)
                    // @ts-ignore
                    const fsData = await window.electron.getFileSystem();
                    if (fsData) {
                        setFileSystem(fsData);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        init();
    }, []);

    // DEBUG: Log state changes
    useEffect(() => {
        console.log('🔍 DEBUG - Projects:', projects);
        console.log('🔍 DEBUG - FileSystem:', fileSystem);
        console.log('🔍 DEBUG - Current Project:', currentProjectId);
    }, [projects, fileSystem, currentProjectId]);

    // === HANDLERS ===
    const handleUpdate = async (id: any, data: any) => {
        // @ts-ignore
        await window.electron.updateProject(id, data);
        // @ts-ignore
        const newP = await window.electron.getProjects();
        if (newP) setProjects(newP);
        setEditingProject(null);
    };

    const handleDelete = async (id: any, e?: React.MouseEvent) => {
        e?.stopPropagation();
        // @ts-ignore
        await window.electron.deleteProject(id);
        setProjects(prev => prev.filter((p: any) => p.id !== id));
        if (currentProjectId === id) {
            setCurrentProjectId(null);
            setView('dashboard');
        }
    };

    const handleCreate = async () => {
        if (!newItemName) return;
        // @ts-ignore
        const newP = await window.electron.createProject({ name: newItemName, color: newItemColor });
        if (newP) {
            setProjects(prev => [...prev, newP]);
            setCurrentProjectId(newP.id);
            setView('project');
            setIsCreatingProject(false);
            setNewItemName('');
        }
    };

    const handleTogglePin = (id: string) => {
        const p = projects.find(x => x.id === id);
        if (p) handleUpdate(id, { isPinned: !p.isPinned });
    };

    // Page management handlers
    const handleDeletePages = (pageIds: string[]) => {
        setFileSystem(prev => prev.filter(f => !pageIds.includes(f.id)));
    };

    const handleAddPages = (files: File[]) => {
        if (!openedComicId) return;

        const newPages = files.map((file, i) => ({
            id: `page-${Date.now()}-${i}`,
            name: file.name,
            type: 'file' as const,
            parentId: openedComicId,
            url: URL.createObjectURL(file),
            createdAt: new Date().toISOString(),
            order: 9999 + i
        }));

        setFileSystem(prev => [...prev, ...newPages]);
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
                                fileSystem={fileSystem}
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
                                onDeleteFolder={() => { }}
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
                                        setOpenedPageId(null);
                                    }}
                                    onSelectPage={(pageId, pageUrl) => {
                                        setOpenedPageId(pageId);
                                        setOpenedPageUrl(pageUrl);
                                    }}
                                    onDeletePages={handleDeletePages}
                                    onAddPages={handleAddPages}
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
                                }}
                                comicName={fileSystem.find((f: any) => f.id === openedComicId)?.name || 'Comic'}
                                pageName={fileSystem.find((f: any) => f.id === openedPageId)?.name || 'Page'}
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
                            />
                        ) : (
                            <ProjectDetail
                                project={projects.find((p: any) => p.id === currentProjectId)}
                                currentFolderId={currentFolderId}
                                fileSystem={fileSystem}
                                onOpenItem={(node) => setCurrentFolderId(node.id)}
                                onOpenComic={setOpenedComicId}
                                onDeleteFolder={() => { }}
                                loading={false}
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
                            />
                        )}
                    </DraggableWindow>
                </div>
            </main>
        </div>
    );
};

export default App;
