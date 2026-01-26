import { useState, useEffect } from 'react';
import { Project } from '../../../types';

interface UseProjectManagerProps {
    projects: Project[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortOrder: 'az' | 'za';
    setSortOrder: (order: 'az' | 'za') => void;

    // Actions - These are passed through or enhanced
    onCreateProject: () => void;
    onUpdateProject: (id: string, updates: Partial<Project>) => void;
    onDeleteProject: (id: string) => void;
    onSelectProject: (id: string) => void;
    onTogglePin: (id: string) => void;

    // Creation/Editing State (Lifted from props or managed locally if that was the intent,
    // but based on original file, these were PROPS. We will bundle them here for easier consumption)
    isCreatingProject: boolean;
    setIsCreatingProject: (isOpen: boolean) => void;
    newItemName: string;
    setNewItemName: (name: string) => void;
    newItemColor: string;
    setNewItemColor: (color: string) => void;

    editingProject: Project | null;
    setEditingProject: (project: Project | null) => void;
    editName: string;
    setEditName: (name: string) => void;
    editColor: string;
    setEditColor: (color: string) => void;
}

export const useProjectManager = ({
    projects,
    searchTerm, setSearchTerm,
    sortOrder, setSortOrder,
    onCreateProject,
    onUpdateProject,
    onDeleteProject,
    onSelectProject,
    onTogglePin,
    ...rest // Modal states
}: UseProjectManagerProps) => {

    // View Mode Persistence
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem('project_view_mode') as 'grid' | 'list') || 'grid';
    });

    useEffect(() => {
        localStorage.setItem('project_view_mode', viewMode);
    }, [viewMode]);

    // Handlers
    const handleUpdate = () => {
        if (!rest.editingProject || !rest.editName.trim()) return;
        onUpdateProject(rest.editingProject.id, { name: rest.editName, color: rest.editColor });
    };

    // Derived State (Filtered Projects)
    const filteredProjects = projects
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return sortOrder === 'az'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        });

    return {
        viewMode,
        setViewMode,
        filteredProjects,
        // Pass-through execution handlers that might need extra logic later
        handleUpdate,
        handlers: {
            onCreate: onCreateProject,
            onDelete: onDeleteProject,
            onSelect: onSelectProject,
            onTogglePin: onTogglePin,
        },
        // Re-export props for sub-components to consume easily
        state: {
            searchTerm, setSearchTerm,
            sortOrder, setSortOrder,
            ...rest // Modal states
        }
    };
};
