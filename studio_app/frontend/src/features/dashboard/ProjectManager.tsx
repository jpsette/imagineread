import React from 'react';
import { Plus, Search, Folder, Trash2, Pin, Pencil, ArrowDownAZ, ArrowUpZA, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Card } from '../../ui/Card';
import { Project } from '../../types';

interface ProjectManagerProps {
    projects: Project[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortOrder: 'az' | 'za';
    setSortOrder: (order: 'az' | 'za') => void;

    // Creation State
    isCreatingProject: boolean;
    setIsCreatingProject: (isOpen: boolean) => void;
    newItemName: string;
    setNewItemName: (name: string) => void;
    newItemColor: string;
    setNewItemColor: (color: string) => void;

    // Editing State
    editingProject: Project | null;
    setEditingProject: (project: Project | null) => void;
    editName: string;
    setEditName: (name: string) => void;
    editColor: string;
    setEditColor: (color: string) => void;

    // Actions
    onCreateProject: () => void;
    onUpdateProject: (id: string, updates: Partial<Project>) => void;
    onDeleteProject: (id: string) => void;
    onSelectProject: (id: string) => void;
    onTogglePin: (id: string) => void;

    // Constants
    PROJECT_THEMES: { bg: string; text: string; lightText: string }[];
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
    projects,
    searchTerm, setSearchTerm,
    sortOrder, setSortOrder,
    isCreatingProject, setIsCreatingProject,
    newItemName, setNewItemName,
    newItemColor, setNewItemColor,
    editingProject, setEditingProject,
    editName, setEditName,
    editColor, setEditColor,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    onSelectProject,
    onTogglePin,
    PROJECT_THEMES
}) => {


    // === HANDLERS MAPPED TO PROPS ===
    const handleCreateProject = onCreateProject;

    const handleUpdateProject = () => {
        if (!editingProject || !editName.trim()) return;
        onUpdateProject(editingProject.id, { name: editName, color: editColor });
    };

    const handleSelectProject = onSelectProject;
    const togglePin = onTogglePin;


    return (
        <>
            {/* Header */}
            <header className="flex flex-col gap-6 mb-8 pt-4 px-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Projetos</h2>
                        <p className="text-text-secondary text-sm">Gerencie suas publicações e séries</p>
                    </div>

                    {/* Actions Container */}
                    <div className="flex items-center gap-3">
                        {/* Search & Sort Toolbar */}
                        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border-color shadow-sm">
                            <Input
                                icon={Search}
                                placeholder="Pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-48 !bg-transparent !border-none !text-xs !pl-9 !py-1 placeholder:text-text-muted text-text-primary"
                            />
                            <div className="w-[1px] h-4 bg-border-color mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSortOrder(sortOrder === 'az' ? 'za' : 'az')}
                                icon={sortOrder === 'az' ? ArrowDownAZ : ArrowUpZA}
                            >
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Projects Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,280px)] gap-6 content-start justify-start p-2 pb-20">
                {/* New Project Card */}
                {!isCreatingProject && (
                    <Card
                        onClick={() => setIsCreatingProject(true)}
                        className="group relative p-6 border-dashed border-border-color bg-surface/50 hover:bg-surface-hover hover:border-accent-blue/50 flex flex-col items-center justify-center gap-3 h-52 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300"
                    >
                        <div className="p-4 rounded-full bg-surface text-text-muted group-hover:bg-accent-blue group-hover:text-white transition-all duration-300 shadow-inner group-hover:scale-110">
                            <Plus size={24} />
                        </div>
                        <span className="text-sm font-semibold text-text-muted group-hover:text-accent-blue transition-colors">Novo Projeto</span>
                    </Card>
                )}

                {/* Inline Creator for Project */}
                {isCreatingProject && (
                    <Card className="p-6 border-accent-blue bg-surface shadow-2xl shadow-blue-500/10 min-h-[210px] flex flex-col justify-between ring-1 ring-accent-blue/20">
                        <div>
                            <h3 className="text-sm font-bold mb-3 text-accent-blue uppercase tracking-wider">Novo Projeto</h3>
                            <Input
                                autoFocus
                                placeholder="Nome do projeto..."
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateProject();
                                    if (e.key === 'Escape') setIsCreatingProject(false);
                                }}
                                className="mb-4"
                            />
                            <div className="grid grid-cols-8 gap-0.5">
                                {PROJECT_THEMES.map(theme => (
                                    <button
                                        key={theme.bg}
                                        onClick={() => setNewItemColor(theme.bg)}
                                        className={`w-5 h-5 rounded-full transition-all duration-200 border border-transparent ${theme.bg} ${newItemColor === theme.bg ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100 hover:border-white/20'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreateProject} className="flex-1">Criar</Button>
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
                                <div className="absolute inset-0 z-50 bg-surface border-2 border-accent-blue shadow-2xl rounded-xl p-6 flex flex-col justify-between animate-in zoom-in-95 duration-200">
                                    <div>
                                        <h3 className="text-sm font-bold mb-3 text-accent-blue uppercase tracking-wider">Editar Projeto</h3>
                                        <Input
                                            autoFocus
                                            placeholder="Nome do projeto..."
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateProject();
                                                if (e.key === 'Escape') setEditingProject(null);
                                            }}
                                            className="mb-4"
                                        />
                                        <div className="grid grid-cols-8 gap-0.5">
                                            {PROJECT_THEMES.map(theme => (
                                                <button
                                                    key={theme.bg}
                                                    onClick={() => setEditColor(theme.bg)}
                                                    className={`w-5 h-5 rounded-full transition-all duration-200 border border-transparent ${theme.bg} ${editColor === theme.bg ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100 hover:border-white/20'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={handleUpdateProject} className="flex-1">Salvar</Button>
                                        <Button variant="secondary" onClick={() => setEditingProject(null)}>Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Card onClick={() => handleSelectProject(project.id)} hoverEffect className="h-52 p-6 flex flex-col justify-between relative group bg-surface hover:bg-surface-hover">
                                    <div className={`absolute top-0 right-0 p-3 transition-all duration-300 flex gap-1 ${project.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePin(project.id);
                                            }}
                                            className={`${project.isPinned ? 'text-accent-blue hover:text-accent-hover' : 'text-text-muted'}`}
                                        >
                                            <Pin size={16} className={project.isPinned ? "fill-current" : ""} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); setEditingProject(project); setEditName(project.name); setEditColor(project.color); }}
                                        >
                                            <Pencil size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-red-500/10 hover:text-red-400"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Tem certeza que deseja excluir este projeto?')) {
                                                    onDeleteProject(project.id);
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                        <ChevronRight className="text-text-muted/30 ml-1" />
                                    </div>
                                    <div className="mb-3 transform group-hover:scale-105 transition-transform duration-300 origin-left">
                                        <Folder size={48} className={`${PROJECT_THEMES.find(t => t.bg === project.color)?.text || 'text-gray-500'} fill-current drop-shadow-lg`} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg mb-1 tracking-tight leading-snug ${PROJECT_THEMES.find(t => t.bg === project.color)?.lightText || 'text-white'}`}>{project.name}</h3>
                                        <p className="text-xs text-text-muted font-medium">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '...'}</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    ))}

                {/* Empty State */}
                {projects.length === 0 && !isCreatingProject && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-color rounded-2xl opacity-50 bg-surface/20">
                        <p className="font-medium text-lg text-text-muted">Nenhum projeto ainda</p>
                        <button onClick={() => setIsCreatingProject(true)} className="text-accent-blue hover:text-accent-hover font-semibold text-sm mt-2 transition-colors">Criar primeiro projeto</button>
                    </div>
                )}
            </div >
        </>
    )
}
export default ProjectManager;
