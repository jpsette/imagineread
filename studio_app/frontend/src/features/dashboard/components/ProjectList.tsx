import React from 'react';
import { Plus, Folder, Trash2, Pin, Pencil, ChevronRight } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';
import { Input } from '../../../ui/Input';
import { Project } from '../../../types';
import { CreateProjectModal } from './CreateProjectModal';

interface ProjectListProps {
    projects: Project[];
    viewMode: 'grid' | 'list';

    // Creation Props
    isCreating: boolean;
    setIsCreating: (v: boolean) => void;
    newName: string;
    setNewName: (v: string) => void;
    newColor: string;
    setNewColor: (v: string) => void;
    onCreate: () => void;

    // Edit Props
    editingProject: Project | null;
    setEditingProject: (p: Project | null) => void;
    editName: string;
    setEditName: (v: string) => void;
    editColor: string;
    setEditColor: (v: string) => void;
    onUpdate: () => void;

    // Actions
    onSelect: (id: string) => void;
    onPin: (id: string) => void;
    onDelete: (id: string) => void;

    themes: { bg: string; text: string; lightText: string }[];
}

export const ProjectList: React.FC<ProjectListProps> = ({
    projects, viewMode,
    isCreating, setIsCreating,
    newName, setNewName, newColor, setNewColor, onCreate,
    editingProject, setEditingProject, editName, setEditName, editColor, setEditColor, onUpdate,
    onSelect, onPin, onDelete,
    themes
}) => {

    if (viewMode === 'list') {
        return (
            <div className="flex flex-col gap-2 p-2 pb-20">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-2">
                    <div className="col-span-1"></div>
                    <div className="col-span-5">Nome</div>
                    <div className="col-span-3">Modificado</div>
                    <div className="col-span-3 text-right">Ações</div>
                </div>

                {/* New Project Button */}
                {!isCreating && (
                    <div
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer group transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent-blue/20 group-hover:text-accent-blue transition-colors">
                            <Plus size={16} />
                        </div>
                        <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">Criar Novo Projeto</span>
                    </div>
                )}

                {/* Inline Creator */}
                {isCreating && (
                    <div className="p-4 rounded-xl bg-surface border border-accent-blue/30 shadow-lg animate-in fade-in slide-in-from-top-2 mb-4">
                        <div className="flex gap-4 items-center">
                            <Input
                                autoFocus
                                placeholder="Nome do projeto..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onCreate();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                                className="flex-1"
                            />
                            <div className="flex gap-1">
                                {themes.map(theme => (
                                    <button
                                        key={theme.bg}
                                        onClick={() => setNewColor(theme.bg)}
                                        className={`w-6 h-6 rounded-full ${theme.bg} ${newColor === theme.bg ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>
                            <Button onClick={onCreate}>Criar</Button>
                            <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                        </div>
                    </div>
                )}

                {/* Function to render List Items would go here, effectively duplicating logic unless extracted further */}
                {/* For brevity of this refactor step, I will inline logic similar to grid, but adapted for list */}
                {projects.map(project => (
                    <div key={project.id}>
                        {editingProject?.id === project.id ? (
                            <div className="col-span-full bg-surface border border-accent-blue p-4 rounded-xl flex items-center gap-4 animate-in fade-in">
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') onUpdate();
                                        if (e.key === 'Escape') setEditingProject(null);
                                    }}
                                />
                                <div className="flex gap-1">
                                    {themes.map(theme => (
                                        <button
                                            key={theme.bg}
                                            onClick={() => setEditColor(theme.bg)}
                                            className={`w-5 h-5 rounded-full transition-all duration-200 border border-transparent ${theme.bg} ${editColor === theme.bg ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100 hover:border-white/20'}`}
                                        />
                                    ))}
                                </div>
                                <Button onClick={onUpdate}>Salvar</Button>
                                <Button variant="ghost" onClick={() => setEditingProject(null)}>X</Button>
                            </div>
                        ) : (
                            <div
                                onClick={() => onSelect(project.id)}
                                className="grid grid-cols-12 gap-4 items-center p-4 rounded-xl bg-surface hover:bg-surface-hover border border-transparent hover:border-white/5 transition-all cursor-pointer group"
                            >
                                <div className="col-span-1 flex justify-center">
                                    <Folder className={`${themes.find(t => t.bg === project.color)?.text || 'text-gray-500'} fill-current`} size={20} />
                                </div>
                                <div className="col-span-5 font-medium text-white group-hover:text-accent-blue transition-colors flex items-center gap-2">
                                    {project.name}
                                    {project.isPinned && <Pin size={12} className="text-accent-blue fill-current rotate-45" />}
                                </div>
                                <div className="col-span-3 text-sm text-zinc-500">
                                    {project.lastModified ? new Date(project.lastModified).toLocaleDateString() : '-'}
                                </div>
                                <div className="col-span-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(project.id); }}>
                                        <Pin size={14} className={project.isPinned ? "fill-current text-accent-blue" : ""} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingProject(project); setEditName(project.name); setEditColor(project.color); }}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="hover:text-red-400" onClick={(e) => { e.stopPropagation(); if (confirm('Excluir?')) onDelete(project.id); }}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // GRID VIEW
    return (
        <div className="grid grid-cols-[repeat(auto-fill,280px)] gap-6 content-start justify-start p-2 pb-20">
            {/* New Project Card */}
            {!isCreating && (
                <Card
                    onClick={() => setIsCreating(true)}
                    className="group relative p-6 border-dashed border-border-color bg-surface/50 hover:bg-surface-hover hover:border-accent-blue/50 flex flex-col items-center justify-center gap-3 h-52 shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300"
                >
                    <div className="p-4 rounded-full bg-surface text-text-muted group-hover:bg-accent-blue group-hover:text-white transition-all duration-300 shadow-inner group-hover:scale-110">
                        <Plus size={24} />
                    </div>
                    <span className="text-sm font-semibold text-text-muted group-hover:text-accent-blue transition-colors">Novo Projeto</span>
                </Card>
            )}

            {/* Inline Creator (Grid) */}
            {isCreating && (
                <CreateProjectModal
                    isOpen={true}
                    onClose={() => setIsCreating(false)}
                    onCreate={onCreate}
                    newName={newName}
                    setNewName={setNewName}
                    newColor={newColor}
                    setNewColor={setNewColor}
                    projectThemes={themes}
                />
            )}

            {/* Project Cards */}
            {projects.map(project => (
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
                                        if (e.key === 'Enter') onUpdate();
                                        if (e.key === 'Escape') setEditingProject(null);
                                    }}
                                    className="mb-4"
                                />
                                <div className="grid grid-cols-8 gap-0.5">
                                    {themes.map(theme => (
                                        <button
                                            key={theme.bg}
                                            onClick={() => setEditColor(theme.bg)}
                                            className={`w-5 h-5 rounded-full transition-all duration-200 border border-transparent ${theme.bg} ${editColor === theme.bg ? 'ring-2 ring-offset-2 ring-offset-surface ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100 hover:border-white/20'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={onUpdate} className="flex-1">Salvar</Button>
                                <Button variant="secondary" onClick={() => setEditingProject(null)}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <Card onClick={() => onSelect(project.id)} hoverEffect className="h-52 p-6 flex flex-col justify-between relative group bg-surface hover:bg-surface-hover">
                            <div className={`absolute top-0 right-0 p-3 transition-all duration-300 flex gap-1 ${project.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPin(project.id); }} className={`${project.isPinned ? 'text-accent-blue hover:text-accent-hover' : 'text-text-muted'}`}>
                                    <Pin size={16} className={project.isPinned ? "fill-current" : ""} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingProject(project); setEditName(project.name); setEditColor(project.color); }}>
                                    <Pencil size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="hover:bg-red-500/10 hover:text-red-400" onClick={(e) => { e.stopPropagation(); if (confirm('Tem certeza que deseja excluir este projeto?')) onDelete(project.id); }}>
                                    <Trash2 size={16} />
                                </Button>
                                <ChevronRight className="text-text-muted/30 ml-1" />
                            </div>
                            <div className="mb-3 transform group-hover:scale-105 transition-transform duration-300 origin-left">
                                <Folder size={48} className={`${themes.find(t => t.bg === project.color)?.text || 'text-gray-500'} fill-current drop-shadow-lg`} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg mb-1 tracking-tight leading-snug ${themes.find(t => t.bg === project.color)?.lightText || 'text-white'}`}>{project.name}</h3>
                                <p className="text-xs text-text-muted font-medium">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '...'}</p>
                            </div>
                        </Card>
                    )}
                </div>
            ))}
        </div>
    );
};
