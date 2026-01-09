import { Plus, Search, ArrowDownAZ, ArrowUpZA, Folder, Pin, Pencil, Trash2, ChevronRight, Upload } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Card } from '../../ui/Card';

// Types
import { Project } from '../../types';

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
    onUploadPDF: (file: File) => Promise<void>
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
    onUploadPDF,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onUploadPDF(files[0]);
            // Reset input
            e.target.value = '';
        }
    };
    return (
        <>
            {/* Header */}
            <header className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Projetos</h2>
                        <p className="text-text-secondary mt-1">Gerencie suas HQs e coleções</p>
                    </div>

                    {/* Actions Container */}
                    <div className="flex items-center gap-3">
                        {/* Search & Sort Toolbar */}
                        <div className="flex items-center gap-2 bg-[#18181b] p-1 rounded-md border border-border-color">
                            <Input
                                icon={Search}
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-32 !bg-transparent !border-none !p-0 !text-xs"
                            />
                            <div className="w-[1px] h-4 bg-border-color/50 mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSortOrder(sortOrder === 'az' ? 'za' : 'az')}
                                icon={sortOrder === 'az' ? ArrowDownAZ : ArrowUpZA}
                            >
                            </Button>
                        </div>

                        {/* Import Button */}
                        <div className="bg-[#18181b] p-1 rounded-md border border-border-color flex items-center">
                            <input
                                type="file"
                                accept="application/pdf"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                icon={Upload}
                                size="sm"
                            >
                                Importar PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Projects Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,280px)] gap-6 content-start justify-start">
                {/* New Project Card */}
                {!isCreatingProject && (
                    <Card
                        onClick={() => setIsCreatingProject(true)}
                        className="group relative p-6 border-dashed bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 flex flex-col items-center justify-center gap-3 min-h-[210px] aspect-[3/2] shadow-sm hover:shadow-md cursor-pointer transition-all"
                    >
                        <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="text-sm font-bold text-text-secondary group-hover:text-accent-blue transition-colors">Novo Projeto</span>
                    </Card>
                )}

                {/* Inline Creator for Project */}
                {isCreatingProject && (
                    <Card className="p-6 border-accent-blue bg-app-bg shadow-xl shadow-blue-500/10 min-h-[210px] flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold mb-2 text-accent-blue">Novo Projeto</h3>
                            <Input
                                autoFocus
                                placeholder="Nome do projeto..."
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onCreateProject();
                                    if (e.key === 'Escape') setIsCreatingProject(false);
                                }}
                                className="mb-3"
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
                            <Button onClick={onCreateProject} className="flex-1">Criar</Button>
                            <Button variant="secondary" onClick={() => setIsCreatingProject(false)}>Cancel</Button>
                        </div>
                    </Card>
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
                                        <Input
                                            autoFocus
                                            placeholder="Nome do projeto..."
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') onUpdateProject();
                                                if (e.key === 'Escape') setEditingProject(null);
                                            }}
                                            className="mb-3"
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
                                        <Button onClick={onUpdateProject} className="flex-1">Salvar</Button>
                                        <Button variant="secondary" onClick={() => setEditingProject(null)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Card onClick={() => onSelectProject(project.id)} hoverEffect className="h-52 p-6 flex flex-col justify-between relative group">
                                    <div className={`absolute top-0 right-0 p-4 transition-opacity flex gap-2 ${project.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTogglePin(project.id);
                                            }}
                                            className={`${project.isPinned ? 'text-accent-blue' : ''}`}
                                        >
                                            <Pin size={14} className={project.isPinned ? "fill-current" : ""} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); setEditingProject(project); setEditName(project.name); setEditColor(project.color); }}
                                        >
                                            <Pencil size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-red-500/10 hover:text-red-400"
                                            onClick={(e) => onDeleteProject(project.id, e)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                        <ChevronRight className="text-text-secondary" />
                                    </div>
                                    <div className="mb-3">
                                        <Folder size={40} className={`${PROJECT_THEMES.find(t => t.bg === project.color)?.text || 'text-gray-500'} fill-current`} />
                                    </div>
                                    <h3 className={`font-bold text-lg mb-1 ${PROJECT_THEMES.find(t => t.bg === project.color)?.lightText || 'text-white'}`}>{project.name}</h3>
                                    <p className="text-xs text-text-secondary">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '...'}</p>
                                </Card>
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
