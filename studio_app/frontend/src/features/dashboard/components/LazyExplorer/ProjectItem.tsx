import React, { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2, Pin } from 'lucide-react';
import { Project, FileEntry } from '../../../../types';
import { LazyLibraryList } from './LazyLibraryList';

interface ProjectItemProps {
    project: Project;
    currentProjectId: string | null;
    currentFolderId: string | null;
    onSelectProject: (id: string) => void;
    onSelectFolder: (id: string) => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;
    onPinProject: (id: string) => void;
    onEditFolder: (folder: FileEntry) => void;
    onDeleteFolder: (id: string) => void;

    // Theme helper
    PROJECT_THEMES: { bg: string; text: string; lightText: string }[];
    isInitiallyExpanded: boolean;
}

export const ProjectItem: React.FC<ProjectItemProps> = ({
    project,
    currentProjectId,
    currentFolderId,
    onSelectProject,
    onSelectFolder,
    onEditProject,
    onDeleteProject,
    onPinProject,
    onEditFolder,
    onDeleteFolder,
    PROJECT_THEMES,
    isInitiallyExpanded
}) => {
    const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
        // We might want to persist this in parent state, but local is fine for lazy load start.
    };

    const isSelected = currentProjectId === project.id;
    const theme = PROJECT_THEMES.find(t => t.bg === project.color);

    return (
        <div className="flex flex-col">
            <div
                className={`px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors text-sm group ${isSelected ? 'bg-surface-hover text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                onClick={() => onSelectProject(project.id)}
            >
                <button
                    onClick={handleToggle}
                    className="p-0.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <Folder size={16} className={`${theme?.text || 'text-text-secondary'} fill-current`} />
                <span className={`truncate flex-1 ${theme?.lightText || ''}`}>{project.name}</span>

                <div className="hidden group-hover:flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPinProject(project.id); }}
                        className={`p-1 hover:text-white ${project.isPinned ? 'text-accent-blue' : 'text-text-muted'}`}
                        title={project.isPinned ? 'Desafixar' : 'Fixar'}
                    >
                        <Pin size={12} className={project.isPinned ? "fill-current" : ""} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
                        className="p-1 hover:text-white text-text-muted"
                    >
                        <Pencil size={12} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(project.id);
                        }}
                        className="p-1 hover:text-red-400 text-text-muted"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* EXPANDED CONTENT: Lazy Libraries */}
            {isExpanded && (
                <LazyLibraryList
                    rootFolderId={project.rootFolderId}
                    currentFolderId={currentFolderId}
                    onSelectFolder={onSelectFolder}
                    onEditFolder={onEditFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            )}
        </div>
    );
};
