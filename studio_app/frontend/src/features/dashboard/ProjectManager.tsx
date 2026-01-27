import React from 'react';
import { Project } from '../../types';
import { useProjectManager } from './hooks/useProjectManager';
import { ProjectFilters } from './components/ProjectFilters';
import { ProjectList } from './components/ProjectList';

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

    // Actions
    onCreateProject: () => void;
    onUpdateProject: (id: string, updates: Partial<Project>) => void;
    onDeleteProject: (id: string) => void;
    onSelectProject: (id: string) => void;
    onTogglePin: (id: string) => void;
    onEditProject: (project: Project) => void; // New prop

    // Constants
    PROJECT_THEMES: { bg: string; text: string; lightText: string }[];
}

export const ProjectManager: React.FC<ProjectManagerProps> = (props) => {
    const {
        viewMode,
        setViewMode,
        filteredProjects,

        handlers,
        state
    } = useProjectManager(props);

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
                        <ProjectFilters
                            searchTerm={state.searchTerm}
                            setSearchTerm={state.setSearchTerm}
                            sortOrder={state.sortOrder}
                            setSortOrder={state.setSortOrder}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                        />
                    </div>
                </div>
            </header>

            {/* Projects Container (Grid/List) */}
            <ProjectList
                projects={filteredProjects}
                viewMode={viewMode}

                // Creation
                isCreating={state.isCreatingProject}
                setIsCreating={state.setIsCreatingProject}
                newName={state.newItemName}
                setNewName={state.setNewItemName}
                newColor={state.newItemColor}
                setNewColor={state.setNewItemColor}
                onCreate={handlers.onCreate}

                // Editing (Delegated to Parent)
                onEdit={props.onEditProject}

                // Actions
                onSelect={handlers.onSelect}
                onPin={handlers.onTogglePin}
                onDelete={handlers.onDelete}

                themes={props.PROJECT_THEMES}
            />
        </>
    );
};

export default ProjectManager;
