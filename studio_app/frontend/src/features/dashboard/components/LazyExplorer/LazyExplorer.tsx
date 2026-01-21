import React from 'react';
import { Project, FileEntry } from '../../../../types';
import { ProjectItem } from './ProjectItem';

interface LazyExplorerProps {
    projects: Project[];
    // fileSystem: FileNode[]; // NO LONGER NEEDED HERE! We lazy load.

    currentProjectId: string | null;
    currentFolderId: string | null;
    onSelectProject: (id: string) => void;
    onSelectFolder: (id: string) => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;
    onPinProject: (id: string) => void;
    onEditFolder: (folder: FileEntry) => void;
    onDeleteFolder: (id: string) => void;

    // We don't need 'expandedFolders' prop anymore as state is local to FolderItem
    // onToggleProjectExpand: (id: string) => void; // Optional if we want global tracking, but local is fine for now
    expandedProjects: Set<string>; // We can keep this to maintain Project expansion state at higher level

    PROJECT_THEMES: { bg: string; text: string; lightText: string }[];
}

export const LazyExplorer: React.FC<LazyExplorerProps> = ({
    projects,
    currentProjectId,
    currentFolderId,
    onSelectProject,
    onSelectFolder,
    onEditProject,
    onDeleteProject,
    onPinProject,
    onEditFolder,
    onDeleteFolder,
    expandedProjects,
    PROJECT_THEMES,
}) => {
    const safeProjects = projects || [];

    return (
        <div className="w-full h-full p-4 flex flex-col gap-4 min-w-[250px]">
            <nav className="flex flex-col gap-1">
                <div className="mt-4 flex flex-col gap-1">
                    <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Seus Projetos</p>

                    {safeProjects.map(project => (
                        <ProjectItem
                            key={project.id}
                            project={project}
                            currentProjectId={currentProjectId}
                            currentFolderId={currentFolderId}
                            onSelectProject={onSelectProject}
                            onSelectFolder={onSelectFolder}
                            onEditProject={onEditProject}
                            onDeleteProject={onDeleteProject}
                            onPinProject={onPinProject}
                            onEditFolder={onEditFolder}
                            onDeleteFolder={onDeleteFolder}
                            PROJECT_THEMES={PROJECT_THEMES}
                            isInitiallyExpanded={expandedProjects.has(project.id) || currentProjectId === project.id}
                        />
                    ))}
                </div>
            </nav>
        </div>
    );
};
