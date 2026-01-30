import { useState, useRef, useEffect } from 'react'
import EditorView from './components/EditorView'
import { DraggableWindow } from './components/DraggableWindow'
import { Folder, ChevronRight, ChevronDown, Plus, Upload, LayoutGrid, Pencil, Trash2, Check, Pin, Search, ArrowDownAZ, ArrowUpZA, Play, Edit3, X } from 'lucide-react'
import { API_ENDPOINTS } from './config'

const PROJECT_THEMES = [
    { bg: "bg-red-500", text: "text-red-500", lightText: "text-red-300" },
    { bg: "bg-orange-500", text: "text-orange-500", lightText: "text-orange-300" },
    { bg: "bg-amber-500", text: "text-amber-500", lightText: "text-amber-300" },
    { bg: "bg-yellow-500", text: "text-yellow-500", lightText: "text-yellow-300" },
    { bg: "bg-lime-500", text: "text-lime-500", lightText: "text-lime-300" },
    { bg: "bg-green-500", text: "text-green-500", lightText: "text-green-300" },
    { bg: "bg-emerald-500", text: "text-emerald-500", lightText: "text-emerald-300" },
    { bg: "bg-teal-500", text: "text-teal-500", lightText: "text-teal-300" },
    { bg: "bg-cyan-500", text: "text-cyan-500", lightText: "text-cyan-300" },
    { bg: "bg-sky-500", text: "text-sky-500", lightText: "text-sky-300" },
    { bg: "bg-blue-500", text: "text-blue-500", lightText: "text-blue-300" },
    { bg: "bg-indigo-500", text: "text-indigo-500", lightText: "text-indigo-300" },
    { bg: "bg-violet-500", text: "text-violet-500", lightText: "text-violet-300" },
    { bg: "bg-purple-500", text: "text-purple-500", lightText: "text-purple-300" },
    { bg: "bg-fuchsia-500", text: "text-fuchsia-500", lightText: "text-fuchsia-300" },
    { bg: "bg-pink-500", text: "text-pink-500", lightText: "text-pink-300" }
];

// --- Types for File System ---
interface FileNode {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'comic';
    parentId: string | null; // null if in project root
    url?: string; // Only for files
    color?: string; // Optional for folders
    createdAt?: Date; // Added for sorting/display
    isPinned?: boolean;
    order?: number; // Added for custom ordering
}

interface Project {
    id: string;
    name: string;
    rootFolderId: string;
    createdAt: Date;
    color: string; // Tailwind class
    isPinned?: boolean;
}

interface UploadResponse {
    status: string
    page_count: number
    pages: string[]
}

function App() {
    // --- Global State ---
    // Persist in backend (data.json)
    const [projects, setProjects] = useState<Project[]>([]);
    const [fileSystem, setFileSystem] = useState<FileNode[]>([]); // Flat list showing hierarchy via parentId
    const [isLoaded, setIsLoaded] = useState(false);

    // Maximize window on mount
    useEffect(() => {
        try {
            window.moveTo(0, 0);
            window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        } catch (error) {
            console.error('Failed to maximize window:', error);
        }
    }, []);

    // Load Data on Mount
    useEffect(() => {
        fetch(API_ENDPOINTS.STORE)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    // Rehydrate Dates
                    const loadedProjects = data.data.projects.map((p: any) => ({
                        ...p,
                        createdAt: new Date(p.createdAt)
                    }));

                    const loadedFiles = (data.data.fileSystem || []).map((f: any) => ({
                        ...f,
                        createdAt: f.createdAt ? new Date(f.createdAt) : undefined
                    }));

                    setProjects(loadedProjects);
                    setFileSystem(loadedFiles);
                }
                setIsLoaded(true);
            })
            .catch(err => {
                console.error("Failed to load data:", err);
                setIsLoaded(true);
            });
    }, []);

    // Save Data on Change
    useEffect(() => {
        if (!isLoaded) return;

        const saveData = setTimeout(() => {
            fetch(API_ENDPOINTS.STORE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        projects,
                        fileSystem
                    }
                })
            }).catch(e => console.error("Save failed", e));
        }, 500); // Debounce 500ms

        return () => clearTimeout(saveData);
    }, [projects, fileSystem, isLoaded]);


    // --- Navigation State ---
    const [view, setView] = useState<'dashboard' | 'project' | 'editor'>('dashboard');
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // If null, we are at project root

    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // --- Search & Sort State ---
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');

    // --- Creator State (No more prompt) ---
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[10].bg); // Default Blue

    // --- Edit State ---
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editingFolder, setEditingFolder] = useState<FileNode | null>(null);
    const [editName, setEditName] = useState("");
    const [editColor, setEditColor] = useState("");

    // Window Management
    const [focusedWindow, setFocusedWindow] = useState<'sidebar' | 'main' | 'workstation' | 'editor'>('main');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMainOpen, setIsMainOpen] = useState(true);
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [workspaceLayout, setWorkspaceLayout] = useState<'focus' | 'studio' | 'command'>('command'); // Default Command
    const bringToFront = (window: 'sidebar' | 'main' | 'workstation' | 'editor') => setFocusedWindow(window);

    // --- Editor/Reader State ---
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [openedComicId, setOpenedComicId] = useState<string | null>(null);
    const [editingPageId, setEditingPageId] = useState<string | null>(null);

    // --- Upload State ---
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // --- Helpers ---
    const getCurrentProject = () => projects.find(p => p.id === currentProjectId);

    const getCurrentItems = () => {
        if (!currentProjectId) return [];
        // Root of project = items where parentId is rootFolderId OR parentId is null (if we treated project as root)
        // Let's settle: Project has a unique "rootFolderId" that acts as the entry point.
        const rootId = projects.find(p => p.id === currentProjectId)?.rootFolderId;
        const targetParent = currentFolderId || rootId;
        return fileSystem.filter(item => item.parentId === targetParent);
    };

    const getBreadcrumbs = () => {
        if (!currentProjectId) return [];
        const project = getCurrentProject();
        if (!project) return [];

        const crumbs = [{ id: project.rootFolderId, name: project.name, isRoot: true }];

        // Trace back from currentFolderId to root
        let traceId = currentFolderId;
        const path = [];
        while (traceId && traceId !== project.rootFolderId) {
            const folder = fileSystem.find(f => f.id === traceId);
            if (folder) {
                path.unshift({ id: folder.id, name: folder.name, isRoot: false });
                traceId = folder.parentId;
            } else {
                break;
            }
        }
        return [...crumbs, ...path];
    };

    // --- Actions ---

    // 1. Create Project
    const handleCreateProject = () => {
        if (!newItemName.trim()) {
            setIsCreatingProject(false);
            return;
        }

        const newRootId = `folder-${Date.now()}-root`;
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: newItemName,
            rootFolderId: newRootId,
            createdAt: new Date(),
            color: newItemColor
        };

        setProjects(prev => [...prev, newProject]);
        setNewItemName("");
        setIsCreatingProject(false);
    };

    const startEditingProject = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingProject(project);
        setEditName(project.name);
        setEditColor(project.color);
    };

    const handleUpdateProject = () => {
        if (!editingProject || !editName.trim()) {
            setEditingProject(null);
            return;
        }

        setProjects(prev => prev.map(p =>
            p.id === editingProject.id
                ? { ...p, name: editName, color: editColor }
                : p
        ));
        setEditingProject(null);
    };

    const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir este projeto?")) {
            setProjects(prev => prev.filter(p => p.id !== projectId));
            if (currentProjectId === projectId) {
                setCurrentProjectId(null);
                setView('dashboard');
            }
        }
    };

    // 2. Create Folder
    const handleCreateFolder = () => {
        if (!currentProjectId || !newItemName.trim()) {
            setIsCreatingFolder(false);
            return;
        }

        const project = getCurrentProject();
        const parent = currentFolderId || project?.rootFolderId;

        const newFolder: FileNode = {
            id: `folder-${Date.now()}`,
            name: newItemName,
            type: 'folder',
            parentId: parent || '',
            color: newItemColor,
            createdAt: new Date()
        };

        setFileSystem(prev => [...prev, newFolder]);
        setNewItemName("");
        setIsCreatingFolder(false);
    };

    const startEditingFolder = (folder: FileNode, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingFolder(folder);
        setEditName(folder.name);
        setEditColor(folder.color || PROJECT_THEMES[10].bg); // Default blue if no color
    };

    const handleUpdateFolder = () => {
        if (!editingFolder || !editName.trim()) {
            setEditingFolder(null);
            return;
        }

        setFileSystem(prev => prev.map(item =>
            item.id === editingFolder.id
                ? { ...item, name: editName, color: editColor }
                : item
        ));
        setEditingFolder(null);
    };

    const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Tem certeza que deseja excluir esta biblioteca?")) {
            setFileSystem(prev => prev.filter(f => f.id !== folderId));
        }
    };

    // 3. Open Logic
    const openItem = (item: FileNode) => {
        if (item.type === 'folder') {
            setCurrentFolderId(item.id);
        } else if (item.type === 'file' && item.url) {
            setSelectedImageUrl(item.url);
            setView('editor');
        }
    };

    const handleBreadcrumbClick = (crumbId: string, isRoot: boolean) => {
        const project = getCurrentProject();
        if (isRoot || crumbId === project?.rootFolderId) {
            setCurrentFolderId(null);
        } else {
            setCurrentFolderId(crumbId);
        }
    };


    // 4. Upload Logic (Preserved but adapted)
    const handleFileUpload = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Por favor, selecione um arquivo PDF.')
            return
        }

        if (!currentProjectId) return;

        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(API_ENDPOINTS.UPLOAD_PDF, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error(`Erro no servidor: ${response.statusText}`)
            }

            const data: UploadResponse = await response.json()

            // Add files to current folder
            const project = getCurrentProject();
            const parent = currentFolderId || project?.rootFolderId;

            // Create Comic Node (Parent)
            const comicId = `comic-${Date.now()}`;
            const newComic: FileNode = {
                id: comicId,
                name: file.name.replace('.pdf', ''),
                type: 'comic',
                parentId: parent || '',
                createdAt: new Date(),
                isPinned: false
            };

            // Create Page Nodes (Children)
            const newPages: FileNode[] = data.pages.map((url, index) => ({
                id: `page-${Date.now()}-${index}`,
                name: `Página ${index + 1}`,
                type: 'file',
                parentId: comicId, // Link to Comic
                url: url,
                createdAt: new Date()
            }));

            setFileSystem(prev => [...prev, newComic, ...newPages]);

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Falha ao processar o PDF.')
        } finally {
            setLoading(false)
        }
    }


    // --- Layout Logic ---
    const getLayoutConfig = (windowId: 'sidebar' | 'main' | 'workstation' | 'editor') => {
        const { innerWidth: w, innerHeight: h } = window;

        switch (workspaceLayout) {
            case 'focus':
                if (windowId === 'workstation') return { x: w * 0.025, y: h * 0.05, width: w * 0.95, height: h * 0.9 };
                if (windowId === 'editor') return { x: w * 0.05, y: h * 0.05, width: w * 0.9, height: h * 0.9 };
                // Others hidden or minimized (handled by conditional rendering or off-screen)
                return { x: -1000, y: 0, width: 200, height: 200 }; // Hide

            case 'studio':
                if (windowId === 'sidebar') return { x: 20, y: 80, width: w * 0.2 - 40, height: h - 100 };
                if (windowId === 'workstation') return { x: w * 0.2, y: 80, width: w * 0.8 - 20, height: h - 100 };
                if (windowId === 'editor') return { x: w * 0.25, y: h * 0.1, width: w * 0.7, height: h * 0.8 };
                return { x: -1000, y: 0, width: 200, height: 200 };

            case 'command':
                // DOCKED LAYOUT: Explorador (esquerda) + Gerenciador (direita)
                if (windowId === 'sidebar') return { x: 10, y: 60, width: w * 0.25, height: h - 80 };
                if (windowId === 'main') return { x: w * 0.25 + 20, y: 60, width: w * 0.7 - 30, height: h - 80 };
                if (windowId === 'workstation') return { x: w * 0.1, y: h * 0.1, width: w * 0.8, height: h * 0.8 };
                if (windowId === 'editor') return { x: w * 0.1, y: h * 0.1, width: w * 0.8, height: h * 0.8 };
                return { x: 0, y: 0, width: 400, height: 500 };

            default:
                return { x: 100, y: 100, width: 500, height: 600 };
        }
    };


    // --- Page Management State ---
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null); // For shift + click



    // --- Page Actions ---

    // Toggle Selection (Refined)
    const handlePageClick = (pageId: string, e: React.MouseEvent, pages: FileNode[]) => {
        // Prevent default propagation if needed
        // e.stopPropagation(); 

        const newSet = new Set(selectedPageIds);

        if (e.shiftKey && lastSelectedId) {
            // Range Selection
            const lastIndex = pages.findIndex(p => p.id === lastSelectedId);
            const currIndex = pages.findIndex(p => p.id === pageId);
            if (lastIndex !== -1 && currIndex !== -1) {
                const start = Math.min(lastIndex, currIndex);
                const end = Math.max(lastIndex, currIndex);
                // Select range (inclusive)
                for (let i = start; i <= end; i++) {
                    newSet.add(pages[i].id);
                }
            }
        } else if (e.metaKey || e.ctrlKey) {
            // Toggle Selection with Modifier (Add/Remove)
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
                setLastSelectedId(null);
            } else {
                newSet.add(pageId);
                setLastSelectedId(pageId);
            }
        } else {
            // Simple Click = Exclusive Select
            newSet.clear();
            newSet.add(pageId);
            setLastSelectedId(pageId);
        }

        setSelectedPageIds(newSet);
    };

    // Bulk Delete
    const handleBulkDeletePages = () => {
        if (selectedPageIds.size === 0) return;
        if (confirm(`Excluir ${selectedPageIds.size} páginas?`)) {
            setFileSystem(prev => prev.filter(f => !selectedPageIds.has(f.id)));
            setSelectedPageIds(new Set());
            setLastSelectedId(null);
        }
    };


    // NOTE: Drag & Drop handlers removed to prevent "tile memory limits exceeded" errors
    // Pages can still be selected via click. Reordering can be added later with CSS Transform.

    // Add Page (Image Upload)
    const handleAddPage = async (e: React.ChangeEvent<HTMLInputElement>, comicId: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newPages: FileNode[] = [];

        // Simple loop to handle multiple files
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // For now, assume local object URL for preview (persistence would require uploading to backend)
            // In a real app we would upload to 'upload_page' endpoint.
            // Let's use ObjectURL for immediacy as per "Add Page" request logic
            const url = URL.createObjectURL(file);

            newPages.push({
                id: `page-added-${Date.now()}-${i}`,
                name: file.name,
                type: 'file',
                parentId: comicId,
                url: url,
                createdAt: new Date(),
                order: 9999 + i // Put at end initially
            });
        }

        setFileSystem(prev => [...prev, ...newPages]);
    };


    // --- RENDER ---

    if (view === 'editor' && selectedImageUrl) {
        return <EditorView imageUrl={selectedImageUrl} onBack={() => { setView('project'); setSelectedImageUrl(null); }} />
    }

    return (
        <div className="h-screen w-screen bg-app-bg text-text-primary font-sans relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-app-bg to-app-bg">

            {/* 1. Global Background Logo & Top Menu Bar */}
            <div className="absolute top-0 left-0 w-full z-50 pointer-events-auto select-none bg-[#09090b]/80 backdrop-blur-sm border-b border-white/5 flex items-center px-4 h-12 gap-6">
                {/* Logo Area */}
                <div className="flex items-center gap-3 opacity-90">
                    <div className="w-6 h-6 rounded bg-accent-blue flex items-center justify-center font-bold text-white text-xs shadow-lg shadow-blue-500/20">IR</div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight tracking-tight text-gray-200">Imagine Read <span className="text-[10px] text-text-secondary font-normal ml-1 opacity-70">Studio v1.0</span></h1>
                    </div>
                </div>

                {/* Vertical Separator */}
                <div className="w-[1px] h-4 bg-white/10"></div>

                {/* App Menu Bar */}
                <div className="flex items-center h-full relative">

                    {/* Menu Projetos */}
                    <div className="relative h-full flex items-center mr-1">
                        <button
                            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-white/10 flex items-center gap-2 ${isProjectMenuOpen ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
                        >
                            <LayoutGrid size={14} />
                            Projetos
                        </button>

                        {isProjectMenuOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-[#18181b] border border-border-color rounded-lg shadow-xl z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100 min-w-[200px]">
                                <button
                                    onClick={() => { setIsCreatingProject(true); setIsProjectMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-accent-blue hover:text-white flex items-center gap-2 group border-b border-white/5"
                                >
                                    <Plus size={14} className="text-accent-blue group-hover:text-white" />
                                    <span>Novo Projeto</span>
                                </button>

                                <p className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-1">Navegação</p>
                                <button
                                    onClick={() => { setIsMainOpen(true); bringToFront('main'); setView('dashboard'); setIsProjectMenuOpen(false); }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-accent-blue hover:text-white flex items-center justify-between group"
                                >
                                    <span>Gerenciador de Projetos</span>
                                </button>
                                <button
                                    onClick={() => { setIsSidebarOpen(true); bringToFront('sidebar'); setIsProjectMenuOpen(false); }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-accent-blue hover:text-white flex items-center justify-between group"
                                >
                                    <span>Explorador</span>
                                </button>
                            </div>
                        )}
                        {isProjectMenuOpen && (
                            <div className="fixed inset-0 z-40 bg-transparent cursor-default" onClick={() => setIsProjectMenuOpen(false)}></div>
                        )}
                    </div>

                    {/* Workspace Menu Item */}
                    <div className="relative h-full flex items-center">
                        <button
                            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:bg-white/10 ${isWorkspaceMenuOpen ? 'bg-white/10 text-white' : 'text-text-secondary'}`}
                        >
                            Workspace
                        </button>

                        {isWorkspaceMenuOpen && (
                            <div className="absolute top-full left-0 mt-1 w-56 bg-[#18181b] border border-border-color rounded-lg shadow-xl z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100 min-w-[200px]">
                                {/* JANELAS ATIVAS */}
                                <p className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Janelas Ativas</p>
                                <button
                                    onClick={() => { setIsSidebarOpen(!isSidebarOpen); if (!isSidebarOpen) bringToFront('sidebar'); }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent-blue hover:text-white flex items-center justify-between group ${isSidebarOpen ? 'text-white' : 'text-text-secondary'}`}
                                >
                                    <span>Explorador</span>
                                    {isSidebarOpen && <Check size={12} className="text-accent-blue group-hover:text-white" />}
                                </button>
                                <button
                                    onClick={() => { setIsMainOpen(!isMainOpen); if (!isMainOpen) { bringToFront('main'); setView('dashboard'); } }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent-blue hover:text-white flex items-center justify-between group ${isMainOpen ? 'text-white' : 'text-text-secondary'}`}
                                >
                                    <span>Gerenciador</span>
                                    {isMainOpen && <Check size={12} className="text-accent-blue group-hover:text-white" />}
                                </button>
                                <button
                                    onClick={() => { if (openedComicId) { setOpenedComicId(null); } }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent-blue hover:text-white flex items-center justify-between group ${openedComicId ? 'text-white' : 'text-text-secondary opacity-50 cursor-not-allowed'}`}
                                    disabled={!openedComicId}
                                >
                                    <span>Workstation</span>
                                    {openedComicId && <Check size={12} className="text-accent-blue group-hover:text-white" />}
                                </button>

                                {/* Separator */}
                                <div className="border-t border-white/10 my-1"></div>

                                {/* LAYOUTS */}
                                <p className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider">Layouts</p>
                                {[
                                    { id: 'focus', label: 'Foco', desc: 'Workstation cheia' },
                                    { id: 'studio', label: 'Estúdio', desc: 'Sidebar + Workstation' },
                                    { id: 'command', label: 'Comando', desc: 'Todos os painéis' },
                                ].map((layout) => (
                                    <button
                                        key={layout.id}
                                        onClick={() => { setWorkspaceLayout(layout.id as any); setIsWorkspaceMenuOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-accent-blue hover:text-white flex flex-col group border-b border-white/5 last:border-0 ${workspaceLayout === layout.id ? 'bg-accent-blue/10' : ''}`}
                                    >
                                        <span className={`font-bold ${workspaceLayout === layout.id ? 'text-accent-blue' : ''}`}>{layout.label}</span>
                                        <span className="text-[10px] opacity-60">{layout.desc}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Floating Sidebar Window */}
            {isSidebarOpen && (
                <DraggableWindow
                    title="Explorador"
                    onFocus={() => bringToFront('sidebar')}
                    onClose={() => setIsSidebarOpen(false)}
                    className="backdrop-blur-md"
                    initialPosition={{ x: getLayoutConfig('sidebar').x, y: getLayoutConfig('sidebar').y }}
                    initialSize={{ width: getLayoutConfig('sidebar').width, height: getLayoutConfig('sidebar').height }}
                    zIndex={focusedWindow === 'sidebar' ? 50 : 10}
                >
                    <div className="w-full h-full p-4 flex flex-col gap-4 min-w-[250px]">
                        {/* Navigation */}
                        <nav className="flex flex-col gap-1">
                            {/* Project List in Sidebar */}
                            <div className="mt-4 flex flex-col gap-1">
                                <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Seus Projetos</p>
                                {projects.map(project => {
                                    const isExpanded = expandedProjects.has(project.id);
                                    const projectLibraries = fileSystem.filter(f => f.parentId === project.rootFolderId && f.type === 'folder');

                                    return (
                                        <div key={project.id} className="flex flex-col">
                                            <div
                                                className={`px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors text-sm group ${currentProjectId === project.id ? 'bg-[#27272a] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'}`}
                                                onClick={() => {
                                                    setCurrentProjectId(project.id);
                                                    setCurrentFolderId(null);
                                                    setView('project');
                                                }}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedProjects(prev => {
                                                            const newSet = new Set(prev);
                                                            if (newSet.has(project.id)) newSet.delete(project.id);
                                                            else newSet.add(project.id);
                                                            return newSet;
                                                        });
                                                    }}
                                                    className="p-0.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>

                                                <Folder size={16} className={`${PROJECT_THEMES.find(t => t.bg === project.color)?.text || 'text-text-secondary'} fill-current`} />
                                                <span className={`truncate flex-1 ${PROJECT_THEMES.find(t => t.bg === project.color)?.lightText || ''}`}>{project.name}</span>

                                                {/* Edit/Delete Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startEditingProject(project, e as any); }}
                                                        className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-accent-blue transition-colors"
                                                        title="Editar Projeto"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id, e as any); }}
                                                        className="p-1 rounded hover:bg-white/10 text-text-secondary hover:text-red-400 transition-colors"
                                                        title="Excluir Projeto"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sub-libraries in Sidebar */}
                                            {isExpanded && (
                                                <div className="flex flex-col gap-0.5 ml-9 border-l border-white/10 pl-2 mt-1 mb-1">
                                                    {projectLibraries.length === 0 ? (
                                                        <span className="text-[10px] text-text-secondary py-1 italic">Vazio</span>
                                                    ) : (
                                                        projectLibraries.map(lib => {
                                                            const isLibExpanded = expandedFolders.has(lib.id);
                                                            const libComics = fileSystem.filter(f => f.parentId === lib.id && f.type === 'comic');
                                                            const hasChildren = libComics.length > 0;

                                                            return (
                                                                <div key={lib.id} className="flex flex-col">
                                                                    <div
                                                                        onClick={() => {
                                                                            setCurrentProjectId(project.id);
                                                                            setCurrentFolderId(lib.id);
                                                                            setView('project');
                                                                        }}
                                                                        className={`px-2 py-1.5 rounded-md flex items-center gap-2 cursor-pointer transition-colors text-xs group/lib ${currentFolderId === lib.id ? 'bg-[#27272a] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'}`}
                                                                    >
                                                                        {/* Expansion Toggle for Library */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setExpandedFolders(prev => {
                                                                                    const newSet = new Set(prev);
                                                                                    if (newSet.has(lib.id)) newSet.delete(lib.id);
                                                                                    else newSet.add(lib.id);
                                                                                    return newSet;
                                                                                });
                                                                            }}
                                                                            className={`p-0.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
                                                                        >
                                                                            {isLibExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                                        </button>

                                                                        <Folder size={12} className={PROJECT_THEMES.find(t => t.bg === lib.color)?.text || 'text-text-secondary'} />
                                                                        <span className="truncate flex-1">{lib.name}</span>
                                                                    </div>

                                                                    {/* Level 3: Comics inside Library */}
                                                                    {isLibExpanded && hasChildren && (
                                                                        <div className="flex flex-col gap-0.5 ml-8 border-l border-white/10 pl-2 mt-0.5">
                                                                            {libComics.map(comic => (
                                                                                <div
                                                                                    key={comic.id}
                                                                                    onClick={() => setOpenedComicId(comic.id)}
                                                                                    className={`px-2 py-1 rounded-md flex items-center gap-2 cursor-pointer transition-colors text-[10px] ${openedComicId === comic.id ? 'bg-accent-blue/20 text-accent-blue' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                                                                                >
                                                                                    <LayoutGrid size={10} className="opacity-70" />
                                                                                    <span className="truncate">{comic.name}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {projects.length === 0 && (
                                    <p className="px-3 text-xs text-text-secondary italic">Nenhum projeto</p>
                                )}
                            </div>
                        </nav>


                    </div>
                </DraggableWindow>
            )}

            {/* 4. Comic Reader Window */}
            {openedComicId && (() => {
                const comic = fileSystem.find(f => f.id === openedComicId);
                // SORT PAGES: Respect 'order' field FIRST, then fallback to Numeric Name
                const pages = fileSystem.filter(f => f.parentId === openedComicId).sort((a, b) => {
                    const orderA = a.order !== undefined ? a.order : 0;
                    const orderB = b.order !== undefined ? b.order : 0;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                });

                if (!comic) return null;

                return (
                    <DraggableWindow
                        key={openedComicId} // Force re-mount on new comic
                        title={`Editor Workstation${editingPageId ? '' : ' - ' + comic.name}`}
                        onFocus={() => bringToFront('workstation')}
                        onClose={() => setOpenedComicId(null)}
                        className="backdrop-blur-md"
                        initialPosition={{ x: getLayoutConfig('workstation').x, y: getLayoutConfig('workstation').y }}
                        initialSize={{ width: getLayoutConfig('workstation').width, height: getLayoutConfig('workstation').height }}
                        zIndex={focusedWindow === 'workstation' ? 50 : 10}
                    >
                        {editingPageId ? (
                            // Render EDITOR inside Workstation
                            (() => {
                                const page = fileSystem.find(f => f.id === editingPageId);
                                if (!page || !page.url) return <div>Erro ao carregar página</div>;
                                return (
                                    <div className="flex-1 bg-[#18181b] overflow-hidden relative h-full flex flex-col">
                                        <EditorView
                                            imageUrl={page.url}
                                            comicName={comic.name}
                                            pageName={page.name}
                                            onBack={() => setEditingPageId(null)}
                                        />
                                    </div>
                                );
                            })()
                        ) : (
                            // Render GRID inside Workstation
                            <div className="flex-1 overflow-y-auto bg-[#09090b] relative flex flex-col">
                                {/* WORKSTATION HOME MENU BAR */}
                                <div className="sticky top-0 z-20 bg-[#141416]/95 backdrop-blur border-b border-[#27272a] px-6 py-3 flex items-center justify-between">
                                    {/* Mockup Menus */}
                                    {/* Action Menus */}
                                    <div className="flex items-center gap-2">
                                        {/* Edit Page Button - Left Side */}
                                        <button
                                            onClick={() => {
                                                if (selectedPageIds.size === 1) {
                                                    setEditingPageId(Array.from(selectedPageIds)[0]);
                                                }
                                            }}
                                            disabled={selectedPageIds.size !== 1}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPageIds.size === 1 ? 'bg-accent-blue text-white hover:bg-blue-600' : 'bg-white/5 text-text-secondary opacity-50 cursor-not-allowed'}`}
                                        >
                                            <Edit3 size={12} />
                                            Editar Página
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4">


                                        {/* BULK DELETE ACTION */}
                                        <button
                                            onClick={handleBulkDeletePages}
                                            disabled={selectedPageIds.size === 0}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPageIds.size > 0 ? 'bg-red-900/50 text-red-100 hover:bg-red-800 animate-in fade-in slide-in-from-right-2' : 'bg-white/5 text-text-secondary opacity-50 cursor-not-allowed'}`}
                                            title={selectedPageIds.size > 0 ? "Excluir Selecionados" : "Selecione páginas para excluir"}
                                        >
                                            <Trash2 size={12} />
                                            Excluir {selectedPageIds.size > 0 ? `(${selectedPageIds.size})` : ''}
                                        </button>

                                        {/* Preview Button */}
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/50 text-white text-xs font-bold hover:bg-blue-600/70 opacity-60 cursor-not-allowed">
                                            <Play size={12} fill="currentColor" />
                                            Preview
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 custom-scrollbar">
                                    <div
                                        className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 content-start justify-center"
                                    >
                                        {pages.map(page => {
                                            const isSelected = selectedPageIds.has(page.id);
                                            // THUMBNAIL LOGIC
                                            const thumbnailUrl = page.url
                                                ? `${API_ENDPOINTS.THUMBNAIL}?url=${encodeURIComponent(page.url)}&width=300`
                                                : null;

                                            return (
                                                <div
                                                    key={page.id}
                                                    className={`group cursor-pointer relative aspect-[2/3] bg-[#18181b] rounded-md overflow-hidden border transition-colors duration-200 ${isSelected ? 'border-accent-blue ring-2 ring-accent-blue/50 contrast-100' : 'border-border-color hover:border-accent-blue/50 hover:shadow-lg'}`}
                                                    onClick={(e) => handlePageClick(page.id, e as any, pages)}
                                                    style={{
                                                        contentVisibility: 'auto',
                                                        containIntrinsicSize: '200px 300px',
                                                        contain: 'paint layout style',
                                                        willChange: 'contents'
                                                    }}
                                                >
                                                    {page.url ? (
                                                        <img
                                                            src={thumbnailUrl || page.url}
                                                            alt={page.name}
                                                            className="w-full h-full object-cover select-none pointer-events-none"
                                                            draggable={false}
                                                            decoding="async"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary bg-[#27272a]">
                                                            <LayoutGrid size={24} className="opacity-20" />
                                                            <span className="text-[10px] mt-2 opacity-30 font-mono">{page.name.slice(-3)}</span>
                                                        </div>
                                                    )}

                                                    {/* Selection Indicator */}
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center shadow-lg">
                                                            <Check size={14} className="text-white" strokeWidth={3} />
                                                        </div>
                                                    )}

                                                    {/* Footer with Page Name and Edit Button */}
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-3 flex items-center justify-between transition-all duration-200 translate-y-full group-hover:translate-y-0">
                                                        <span className="text-xs text-white font-medium truncate">
                                                            Página {page.name.replace(/\D/g, '') || (pages.indexOf(page) + 1)}
                                                        </span>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPageId(page.id);
                                                            }}
                                                            className="px-3 py-1 bg-accent-blue hover:bg-blue-600 rounded text-[10px] font-bold text-white transition-colors shadow-sm"
                                                        >
                                                            Editar
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {/* ADD PAGE CARD */}
                                        <div className="group relative aspect-[2/3] bg-[#18181b] rounded-md border border-dashed border-[#27272a] hover:border-accent-blue hover:bg-accent-blue/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => handleAddPage(e, comic.id)}
                                            />
                                            <div className="w-12 h-12 rounded-full bg-[#27272a] group-hover:bg-accent-blue group-hover:text-white flex items-center justify-center transition-colors text-text-secondary">
                                                <Plus size={24} />
                                            </div>
                                            <span className="text-xs font-medium text-text-secondary group-hover:text-white">Adicionar Página</span>
                                        </div>

                                    </div>
                                </div>
                                {pages.length === 0 && (
                                    <div className="text-text-secondary opacity-50 flex flex-col items-center justify-center h-full">
                                        <p>Nenhuma página encontrada.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DraggableWindow >
                )
            })()}



            {/* 3. Floating Main Content Window */}
            {
                isMainOpen && (
                    <DraggableWindow
                        title={view === 'dashboard' ? 'Gerenciador de Projetos' : (getCurrentProject()?.name || 'Projeto')}
                        initialPosition={{ x: getLayoutConfig('main').x, y: getLayoutConfig('main').y }}
                        initialSize={{ width: getLayoutConfig('main').width, height: getLayoutConfig('main').height }}
                        zIndex={focusedWindow === 'main' ? 50 : 10}
                        onFocus={() => bringToFront('main')}
                        className="shadow-2xl shadow-black/50 backdrop-blur-md"
                        onClose={() => setIsMainOpen(false)}
                    >
                        <div className="flex flex-col h-full bg-panel-bg p-6 relative">
                            {/* Header varies by View */}
                            {view === 'dashboard' ? (
                                <header className="flex flex-col gap-6 mb-8">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
                                            <p className="text-text-secondary mt-1">Gerencie suas HQs e coleções</p>
                                        </div>

                                        {/* Search & Sort Toolbar */}
                                        <div className="flex items-center gap-2 bg-[#18181b] p-1 rounded-md border border-border-color">
                                            <div className="flex items-center gap-2 px-2 border-r border-border-color/50">
                                                <Search size={14} className="text-text-secondary" />
                                                <input
                                                    type="text"
                                                    placeholder="Pesquisar..."
                                                    className="bg-transparent text-xs text-white focus:outline-none w-32"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setSortOrder(prev => prev === 'az' ? 'za' : 'az')}
                                                className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors flex items-center gap-1 text-[10px] font-medium"
                                            >
                                                {sortOrder === 'az' ? <ArrowDownAZ size={14} /> : <ArrowUpZA size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Bar Removed (Button moved to Grid) */}
                                </header>
                            ) : (
                                <header className="flex flex-col gap-4 mb-6">
                                    {/* Row 1: Breadcrumbs (Left) + Search (Right) */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <button onClick={() => { setView('dashboard'); setCurrentProjectId(null); }} className="hover:text-white transition-colors">Projetos</button>
                                            {getBreadcrumbs().map((crumb, i) => (
                                                <div key={crumb.id} className="flex items-center gap-2">
                                                    <ChevronRight size={14} />
                                                    <button
                                                        onClick={() => handleBreadcrumbClick(crumb.id, crumb.isRoot)}
                                                        className={`hover:text-white transition-colors ${i === getBreadcrumbs().length - 1 ? 'text-white font-bold' : ''}`}
                                                    >
                                                        {crumb.name}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Search & Sort Toolbar (Moved to Row 1) */}
                                        <div className="flex items-center gap-2 bg-[#18181b] p-1 rounded-md border border-border-color">
                                            <div className="flex items-center gap-2 px-2 border-r border-border-color/50">
                                                <Search size={14} className="text-text-secondary" />
                                                <input
                                                    type="text"
                                                    placeholder="Pesquisar..."
                                                    className="bg-transparent text-xs text-white focus:outline-none w-32"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setSortOrder(prev => prev === 'az' ? 'za' : 'az')}
                                                className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors flex items-center gap-1 text-[10px] font-medium"
                                            >
                                                {sortOrder === 'az' ? <ArrowDownAZ size={14} /> : <ArrowUpZA size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Row 2: Title (Left) + Upload (Right) */}
                                    <div className="flex justify-between items-end">
                                        <h2 className={`text-3xl font-bold tracking-tight flex items-center gap-3 ${!currentFolderId ? (PROJECT_THEMES.find(t => t.bg === getCurrentProject()?.color)?.text || 'text-white') : ''}`}>
                                            {getCurrentProject() && !currentFolderId && <Folder size={32} className={`${PROJECT_THEMES.find(t => t.bg === getCurrentProject()?.color)?.text || 'text-white'} fill-current`} />}
                                            {currentFolderId ? fileSystem.find(f => f.id === currentFolderId)?.name : getCurrentProject()?.name}
                                        </h2>

                                        <div className="flex gap-3">
                                            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-bold transition-all active:scale-95">
                                                <Upload size={16} />
                                                Upload PDF
                                            </button>
                                        </div>

                                        {/* Hidden Input */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                                            style={{ display: 'none' }}
                                            accept="application/pdf"
                                        />
                                    </div>

                                </header>
                            )}

                            {/* Content Grid */}
                            <div
                                className="flex-1 overflow-y-auto pr-2 custom-scrollbar"                            >
                                {view === 'dashboard' ? (
                                    // PROJECTS GRID
                                    <div className="grid grid-cols-[repeat(auto-fill,280px)] gap-6 content-start justify-start">

                                        {/* New Project Card */}
                                        {!isCreatingProject && (
                                            <button
                                                onClick={() => setIsCreatingProject(true)}
                                                className="group relative p-6 rounded-xl border border-dashed border-border-color bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 transition-all flex flex-col items-center justify-center gap-3 h-full aspect-[3/2] shadow-sm hover:shadow-md"
                                            >
                                                <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                                    <Plus size={24} />
                                                </div>
                                                <span className="text-sm font-bold text-text-secondary group-hover:text-accent-blue transition-colors">Novo Projeto</span>
                                            </button>
                                        )}

                                        {/* Inline Creator for Project */}
                                        {isCreatingProject && (
                                            <div className="p-6 rounded-xl border border-accent-blue bg-app-bg shadow-xl shadow-blue-500/10">
                                                <h3 className="text-sm font-bold mb-2 text-accent-blue">Novo Projeto</h3>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Nome do projeto..."
                                                    className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue mb-4"
                                                    value={newItemName}
                                                    onChange={(e) => setNewItemName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCreateProject();
                                                        if (e.key === 'Escape') setIsCreatingProject(false);
                                                    }}
                                                />
                                                <div className="grid grid-cols-8 gap-2 mb-4">
                                                    {PROJECT_THEMES.map(theme => (
                                                        <button
                                                            key={theme.bg}
                                                            onClick={() => setNewItemColor(theme.bg)}
                                                            className={`w-5 h-5 rounded-full transition-all ${theme.bg} ${newItemColor === theme.bg ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleCreateProject} className="flex-1 bg-accent-blue text-white py-1.5 rounded text-xs font-bold">Criar</button>
                                                    <button onClick={() => setIsCreatingProject(false)} className="px-3 bg-[#27272a] text-gray-400 py-1.5 rounded text-xs">Cancel</button>
                                                </div>
                                            </div>
                                        )}

                                        {projects
                                            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .sort((a, b) => {
                                                if (a.isPinned && !b.isPinned) return -1;
                                                if (!a.isPinned && b.isPinned) return 1;
                                                return sortOrder === 'az'
                                                    ? a.name.localeCompare(b.name)
                                                    : b.name.localeCompare(a.name);
                                            })
                                            .map(project => (
                                                editingProject?.id === project.id ? (
                                                    <div key={project.id} className="p-6 rounded-xl border border-accent-blue bg-app-bg shadow-xl cursor-default">
                                                        <h3 className="text-sm font-bold mb-2 text-accent-blue">Editar Projeto</h3>
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Nome do projeto..."
                                                            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue mb-4"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdateProject();
                                                                if (e.key === 'Escape') setEditingProject(null);
                                                            }}
                                                        />
                                                        <div className="grid grid-cols-8 gap-2 mb-4">
                                                            {PROJECT_THEMES.map(theme => (
                                                                <button
                                                                    key={theme.bg}
                                                                    onClick={() => setEditColor(theme.bg)}
                                                                    className={`w-5 h-5 rounded-full transition-all ${theme.bg} ${editColor === theme.bg ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button onClick={handleUpdateProject} className="flex-1 bg-accent-blue text-white py-1.5 rounded text-xs font-bold">Salvar</button>
                                                            <button onClick={() => setEditingProject(null)} className="px-3 bg-[#27272a] text-gray-400 py-1.5 rounded text-xs">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        key={project.id}
                                                        onClick={() => {
                                                            setCurrentProjectId(project.id);
                                                            setCurrentFolderId(null);
                                                            setView('project');
                                                        }}
                                                        className="group p-6 rounded-xl border border-border-color bg-app-bg hover:border-white/20 cursor-pointer transition-all hover:shadow-xl relative overflow-hidden"
                                                    >
                                                        <div className={`absolute top-0 right-0 p-4 transition-opacity flex gap-2 ${project.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, isPinned: !p.isPinned } : p));
                                                                }}
                                                                className={`p-1 hover:bg-white/10 rounded-full transition-colors ${project.isPinned ? 'text-accent-blue' : 'text-text-secondary hover:text-white'}`}
                                                            >
                                                                <Pin size={14} className={project.isPinned ? "fill-current" : ""} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => startEditingProject(project, e)}
                                                                className="p-1 hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-white"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteProject(project.id, e)}
                                                                className="p-1 hover:bg-red-500/10 rounded-full transition-colors text-text-secondary hover:text-red-400"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                            <ChevronRight className="text-text-secondary" />
                                                        </div>
                                                        <div className="mb-3">
                                                            <Folder size={40} className={`${PROJECT_THEMES.find(t => t.bg === project.color)?.text || 'text-gray-500'} fill-current`} />
                                                        </div>
                                                        <h3 className={`font-bold text-lg mb-1 ${PROJECT_THEMES.find(t => t.bg === project.color)?.lightText || 'text-white'}`}>{project.name}</h3>
                                                        <p className="text-xs text-text-secondary">{project.createdAt.toLocaleDateString()}</p>
                                                    </div>
                                                )
                                            ))}

                                        {projects.length === 0 && !isCreatingProject && (
                                            <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-color rounded-xl opacity-50">
                                                <p className="font-medium text-lg">Nenhum projeto ainda</p>
                                                <button onClick={() => setIsCreatingProject(true)} className="text-accent-blue hover:underline text-sm mt-2">Criar primeiro projeto</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // PROJECT / FOLDER CONTENTS
                                    <>
                                        {loading && (
                                            <div className="mb-6 p-4 rounded-lg bg-blue-900/10 border border-blue-900/30 flex items-center gap-3 text-blue-300">
                                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm font-medium">Processando PDF e gerando imagens...</span>
                                            </div>
                                        )}

                                        {error && (
                                            <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-900/50 text-red-200 text-sm">
                                                <strong>Erro:</strong> {error}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-[repeat(auto-fill,180px)] gap-4 content-start justify-start">

                                            {/* Add New Library Card */}
                                            {!isCreatingFolder && (
                                                <button
                                                    onClick={() => setIsCreatingFolder(true)}
                                                    className="group aspect-square p-4 rounded-xl border border-dashed border-border-color bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 transition-all flex flex-col items-center justify-center gap-2"
                                                >
                                                    <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                                        <Plus size={24} />
                                                    </div>
                                                    <span className="text-sm font-medium text-text-secondary group-hover:text-accent-blue">Nova Biblioteca</span>
                                                </button>
                                            )}

                                            {/* Inline Creator for Folder */}
                                            {isCreatingFolder && (
                                                <div className="flex flex-col gap-2 p-3 rounded-xl border border-accent-blue bg-app-bg animate-pulse">
                                                    <div className="aspect-square rounded-xl bg-[#27272a] flex items-center justify-center mb-1">
                                                        <Folder size={32} className="text-accent-blue" />
                                                    </div>
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Nome da biblioteca..."
                                                        className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-blue mb-2"
                                                        value={newItemName}
                                                        onChange={(e) => setNewItemName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCreateFolder();
                                                            if (e.key === 'Escape') setIsCreatingFolder(false);
                                                        }}
                                                    />
                                                    <div className="grid grid-cols-8 gap-1 mb-2">
                                                        {PROJECT_THEMES.map(theme => (
                                                            <button
                                                                key={theme.bg}
                                                                onClick={() => setNewItemColor(theme.bg)}
                                                                className={`w-3 h-3 rounded-full transition-all ${theme.bg} ${newItemColor === theme.bg ? 'ring-1 ring-white scale-125' : 'hover:scale-125 opacity-70 hover:opacity-100'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={handleCreateFolder} className="flex-1 bg-accent-blue text-white py-1 rounded-[4px] text-[10px] font-bold">Criar</button>
                                                        <button onClick={() => setIsCreatingFolder(false)} className="px-2 bg-[#27272a] text-gray-400 py-1 rounded-[4px] text-[10px]">Cancel</button>
                                                    </div>
                                                </div>
                                            )}

                                            {getCurrentItems()
                                                .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .sort((a, b) => {
                                                    // Pin Priority
                                                    if (a.isPinned && !b.isPinned) return -1;
                                                    if (!a.isPinned && b.isPinned) return 1;
                                                    // Name Sort
                                                    return sortOrder === 'az'
                                                        ? a.name.localeCompare(b.name)
                                                        : b.name.localeCompare(a.name);
                                                })
                                                .map(item => (
                                                    editingFolder?.id === item.id ? (
                                                        <div key={item.id} className="p-4 rounded-xl border border-accent-blue bg-app-bg shadow-xl cursor-default flex flex-col gap-2">
                                                            <h3 className="text-xs font-bold text-accent-blue">Editar Biblioteca</h3>
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-blue"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdateFolder();
                                                                    if (e.key === 'Escape') setEditingFolder(null);
                                                                }}
                                                            />
                                                            {item.type === 'folder' && (
                                                                <div className="grid grid-cols-8 gap-1">
                                                                    {PROJECT_THEMES.map(theme => (
                                                                        <button
                                                                            key={theme.bg}
                                                                            onClick={() => setEditColor(theme.bg)}
                                                                            className={`w-3 h-3 rounded-full transition-all ${theme.bg} ${editColor === theme.bg ? 'ring-1 ring-white scale-125' : 'hover:scale-125 opacity-70 hover:opacity-100'}`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={handleUpdateFolder} className="flex-1 bg-accent-blue text-white py-1 rounded-[4px] text-[10px] font-bold">Salvar</button>
                                                                <button onClick={() => setEditingFolder(null)} className="px-2 bg-[#27272a] text-gray-400 py-1 rounded-[4px] text-[10px]">Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => {
                                                                if (item.type === 'comic') {
                                                                    setOpenedComicId(item.id);
                                                                } else {
                                                                    openItem(item);
                                                                }
                                                            }}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                if (confirm(`Excluir ${item.name}?`)) {
                                                                    setFileSystem(prev => prev.filter(f => f.id !== item.id && f.parentId !== item.id));
                                                                }
                                                            }}
                                                            className="group cursor-pointer relative"
                                                        >
                                                            {/* Pin Button for Library/File */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFileSystem(prev => prev.map(f => f.id === item.id ? { ...f, isPinned: !f.isPinned } : f));
                                                                }}
                                                                className={`absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-all z-20 ${item.isPinned ? 'opacity-100 bg-white/20' : 'opacity-0 group-hover:opacity-100'}`}
                                                            >
                                                                <Pin size={14} className={item.isPinned ? "fill-white text-white" : "text-white"} />
                                                            </button>

                                                            <div className={`aspect-square rounded-xl border border-border-color bg-app-bg overflow-hidden relative transition-all group-hover:border-accent-blue group-hover:shadow-lg ${item.type === 'folder' ? 'flex flex-col items-center justify-center gap-3' : ''}`}>
                                                                {item.type === 'folder' ? (
                                                                    <>
                                                                        <Folder size={40} className={PROJECT_THEMES.find(t => t.bg === item.color)?.text || 'text-blue-400 fill-blue-400/10'} />
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs font-medium text-center truncate px-2 text-white max-w-full">{item.name}</span>
                                                                            {item.createdAt && <span className="text-[10px] text-white/40">{item.createdAt.toLocaleDateString()}</span>}
                                                                        </div>
                                                                    </>
                                                                ) : item.type === 'comic' ? (
                                                                    // Comic Card using Cover
                                                                    (() => {
                                                                        // Find First Page for Cover
                                                                        const pages = fileSystem.filter(f => f.parentId === item.id).sort((a, b) => a.name.localeCompare(b.name));
                                                                        const coverUrl = pages[0]?.url;

                                                                        return (
                                                                            <>
                                                                                {coverUrl ? (
                                                                                    <img src={coverUrl} className="w-full h-full object-cover" alt={item.name} />
                                                                                ) : (
                                                                                    <div className="flex flex-col items-center text-text-secondary">
                                                                                        <LayoutGrid size={32} />
                                                                                        <span className="text-[10px] mt-2">Sem capa</span>
                                                                                    </div>
                                                                                )}
                                                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
                                                                                    <span className="text-xs font-medium text-white truncate block">{item.name}</span>
                                                                                    <span className="text-[10px] text-white/60">{pages.length} páginas</span>
                                                                                </div>
                                                                            </>
                                                                        )
                                                                    })()
                                                                ) : (
                                                                    <>
                                                                        <img src={item.url} className="w-full h-full object-cover" alt={item.name} />
                                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
                                                                            <span className="text-xs font-medium text-white truncate block">{item.name}</span>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {/* Hover Actions */}
                                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                                                    {item.type === 'folder' && (
                                                                        <>
                                                                            <button
                                                                                onClick={(e) => startEditingFolder(item, e)}
                                                                                className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
                                                                            >
                                                                                <Pencil size={12} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => handleDeleteFolder(item.id, e)}
                                                                                className="p-1.5 bg-black/50 hover:bg-red-900/80 rounded-full text-red-300 backdrop-blur-sm transition-colors"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                ))}

                                            {getCurrentItems().length === 0 && !loading && !isCreatingFolder && (
                                                <div className="col-span-full h-64 flex flex-col items-center justify-center text-text-secondary opacity-50">
                                                    <div className="text-6xl mb-4">📂</div>
                                                    <p>Biblioteca vazia</p>
                                                    <p className="text-xs">Arraste um PDF ou crie uma sub-biblioteca</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </DraggableWindow>
                )
            }


            {/* Global Overlay for Dropdowns */}
            {
                isWorkspaceMenuOpen && (
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsWorkspaceMenuOpen(false)}></div>
                )
            }

        </div >

    )
};

export default App;
