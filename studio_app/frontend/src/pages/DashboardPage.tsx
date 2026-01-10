import React, { useState } from 'react';
import ProjectManager from '../features/dashboard/ProjectManager';
import { useUIStore } from '../store/useUIStore';
import { useProjectStore } from '../store/useProjectStore';
import { useProjectActions } from '../hooks/useProjectActions';
import { PROJECT_THEMES } from '../constants/theme';
import { Project } from '../types';

const DashboardPage: React.FC = () => {
    // Global Stores
    const { projects, setCurrentProjectId } = useProjectStore();
    const { isCreatingProject, setIsCreatingProject, setView, setShowManager } = useUIStore();

    // Actions
    const { createProject, updateProject, deleteProject, togglePin } = useProjectActions();

    // Local View State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');

    // Creation State
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[0].bg);

    // Editing State
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    // Glue Handlers
    const handleCreateProject = async () => {
        if (!newItemName) return;
        await createProject(newItemName, newItemColor);
        setNewItemName('');
        // Ensure UI state consistency if needed (hooks handle view switching)
    };

    const handleUpdateProjectWrapper = async () => {
        if (editingProject) {
            await updateProject(editingProject.id, { name: editName, color: editColor });
            setEditingProject(null);
        }
    };

    const handleSelectProject = (id: string) => {
        setCurrentProjectId(id);
        setView('project');
        // If we were using draggable windows, we would ensure showManager is true, 
        // but as a Page, we just navigate.
        // Assuming future router logic will handle URL, for now we manipulate store if App.tsx still drives view.
        setShowManager(true); // Keep legacy compatibility if App.tsx uses this
    };

    return (
        <div className="w-full h-full">
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
                onCreateProject={handleCreateProject}
                onSelectProject={handleSelectProject}
                onTogglePin={togglePin}
                onDeleteProject={(id, e) => {
                    e?.stopPropagation();
                    deleteProject(id);
                }}
                onUpdateProject={handleUpdateProjectWrapper}
                editingProject={editingProject}
                setEditingProject={setEditingProject}
                editName={editName}
                setEditName={setEditName}
                editColor={editColor}
                setEditColor={setEditColor}
                PROJECT_THEMES={PROJECT_THEMES}
            />
        </div>
    );
};

export default DashboardPage;
