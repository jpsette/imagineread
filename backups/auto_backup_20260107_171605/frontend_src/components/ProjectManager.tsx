import { Plus, Search, ArrowDownAZ, ArrowUpZA, Folder, Pin, Pencil, Trash2, ChevronRight } from 'lucide-react'

// Types
interface Project {
    id: string
    name: string
    color: string
    rootFolderId: string
    createdAt: Date
    isPinned?: boolean
}

interface ProjectManagerProps {
    projects: Project[]
    searchTerm: string
    setSearchTerm: (term: string) => void
    sortOrder: 'az' | 'za'
    setSortOrder: (order: 'az' | 'za') => void
    isCreatingProject: boolean
    setIsCreatingProject: (creating: boolean) => void
    newItemName: string
    setNewItemName: (name: string) => void
    newItemColor: string
    setNewItemColor: (color: string) => void
    editingProject: Project | null
    setEditingProject: (project: Project | null) => void
    editName: string
    setEditName: (name: string) => void
    editColor: string
    setEditColor: (color: string) => void
    PROJECT_THEMES: Array<{ bg: string; text: string; lightText?: string }>
    onCreateProject: () => void
    onUpdateProject: () => void
    onDeleteProject: (projectId: string, e: React.MouseEvent) => void
    onSelectProject: (projectId: string) => void
    onTogglePin: (projectId: string) => void
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
    projects,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    isCreatingProject,
    setIsCreatingProject,
    newItemName,
    setNewItemName,
    newItemColor,
    setNewItemColor,
    editingProject,
    setEditingProject,
    editName,
    setEditName,
    editColor,
    setEditColor,
    PROJECT_THEMES,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    onSelectProject,
    onTogglePin,
}) => {
    return (
        <>
            {/* Header */}
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
                            onClick={() => setSortOrder(sortOrder === 'az' ? 'za' : 'az')}
                            className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-white transition-colors flex items-center gap-1 text-[10px] font-medium"
                        >
                            {sortOrder === 'az' ? <ArrowDownAZ size={14} /> : <ArrowUpZA size={14} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Projects Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,280px)] gap-6 content-start justify-start">
                {/* New Project Card */}
                {!isCreatingProject && (
                    <button
                        onClick={() => setIsCreatingProject(true)}
                        className="group relative p-6 rounded-xl border border-dashed border-border-color bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 transition-all flex flex-col items-center justify-center gap-3 min-h-[210px] h-[210px] aspect-[3/2] shadow-sm hover:shadow-md"
                    >
                        <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="text-sm font-bold text-text-secondary group-hover:text-accent-blue transition-colors">Novo Projeto</span>
                    </button>
                )}

                {/* Inline Creator for Project */}
                {isCreatingProject && (
                    <div className="p-6 rounded-xl border border-accent-blue bg-app-bg shadow-xl shadow-blue-500/10 min-h-[210px] h-[210px] flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold mb-2 text-accent-blue">Novo Projeto</h3>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Nome do projeto..."
                                className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue mb-3"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onCreateProject();
                                    if (e.key === 'Escape') setIsCreatingProject(false);
                                }}
                            />
                            <div className="grid grid-cols-8 gap-0.5">
                                {PROJECT_THEMES.map(theme => (
                                    <button
                                        key={theme.bg}
                                        onClick={() => setNewItemColor(theme.bg)}
                                        className={`w-4 h-4 rounded-full transition-all ${theme.bg} ${newItemColor === theme.bg ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onCreateProject} className="flex-1 bg-accent-blue text-white py-1.5 rounded text-xs font-bold">Criar</button>
                            <button onClick={() => setIsCreatingProject(false)} className="px-3 bg-[#27272a] text-gray-400 py-1.5 rounded text-xs">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Project Cards */}
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
                        <div key={project.id} className="h-52 relative">
                            {editingProject?.id === project.id ? (
                                <div className="absolute inset-0 z-50 bg-[#18181b] border-2 border-blue-500 shadow-xl rounded-xl p-6 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold mb-2 text-accent-blue">Editar Projeto</h3>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Nome do projeto..."
                                            className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue mb-3"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') onUpdateProject();
                                                if (e.key === 'Escape') setEditingProject(null);
                                            }}
                                        />
                                        <div className="grid grid-cols-8 gap-0.5">
                                            {PROJECT_THEMES.map(theme => (
                                                <button
                                                    key={theme.bg}
                                                    onClick={() => setEditColor(theme.bg)}
                                                    className={`w-4 h-4 rounded-full transition-all ${theme.bg} ${editColor === theme.bg ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={onUpdateProject} className="flex-1 bg-accent-blue text-white py-1.5 rounded text-xs font-bold">Salvar</button>
                                        <button onClick={() => setEditingProject(null)} className="px-3 bg-[#27272a] text-gray-400 py-1.5 rounded text-xs">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => onSelectProject(project.id)} className="h-52 group p-6 rounded-xl border border-border-color bg-app-bg hover:border-white/20 cursor-pointer transition-all hover:shadow-xl relative overflow-hidden flex flex-col justify-between">
                                    <div className={`absolute top-0 right-0 p-4 transition-opacity flex gap-2 ${project.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTogglePin(project.id);
                                            }}
                                            className={`p-1 hover:bg-white/10 rounded-full transition-colors ${project.isPinned ? 'text-accent-blue' : 'text-text-secondary hover:text-white'}`}
                                        >
                                            <Pin size={14} className={project.isPinned ? "fill-current" : ""} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingProject(project); setEditName(project.name); setEditColor(project.color); }}
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors text-text-secondary hover:text-white"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => onDeleteProject(project.id, e)}
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
                                    <p className="text-xs text-text-secondary">{project.createdAt ? project.createdAt.toLocaleDateString() : '...'}</p>
                                </div>
                            )}
                        </div>
                    ))}

                {/* Empty State */}
                {projects.length === 0 && !isCreatingProject && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-color rounded-xl opacity-50">
                        <p className="font-medium text-lg">Nenhum projeto ainda</p>
                        <button onClick={() => setIsCreatingProject(true)} className="text-accent-blue hover:underline text-sm mt-2">Criar primeiro projeto</button>
                    </div>
                )}
            </div>
        </>
    )
}
export default ProjectManager;
