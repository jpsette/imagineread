import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { api } from '../services/api';
import { Project } from '../types';

export const useProjectActions = () => {
    const {
        projects,
        addProject,
        updateProject: updateStoreProject,
        deleteProject: deleteStoreProject,
        currentProjectId,
        setCurrentProjectId
    } = useProjectStore();

    const { setView, setIsCreatingProject } = useUIStore();

    const createProject = async (name: string, color: string) => {
        try {
            const newP = await api.createProject({ name, color });
            addProject(newP);
            setCurrentProjectId(newP.id);
            setView('project');
            setIsCreatingProject(false);
            return newP;
        } catch (e) {
            console.error("Failed to create project", e);
            alert("Erro ao criar projeto");
        }
    };

    const updateProject = async (id: string, data: Partial<Project>) => {
        try {
            await api.updateProject(id, data);

            // Optimistic / Store update
            // Verify if we need to reload or just update local
            // Original code: await api.updateProject... const newP = await api.getProjects()... setProjects
            // Optimization: Update local state directly
            updateStoreProject(id, data);

        } catch (e) {
            console.error("Failed to update project", e);
            alert("Erro ao atualizar projeto");
        }
    };

    const deleteProject = async (id: string) => {
        try {
            await api.deleteProject(id);
            deleteStoreProject(id);

            if (currentProjectId === id) {
                setCurrentProjectId(null);
                setView('dashboard');
            }
        } catch (e) {
            console.error("Failed to delete project", e);
            alert("Erro ao deletar projeto");
        }
    };

    const togglePin = (id: string) => {
        const p = projects.find(x => x.id === id);
        if (p) {
            updateProject(id, { isPinned: !p.isPinned });
        }
    };

    return {
        createProject,
        updateProject,
        deleteProject,
        togglePin
    };
};
