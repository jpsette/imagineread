import { useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';
import { api } from '../services/api';
import { Project } from '../types';

export const useProjectActions = () => {
    const queryClient = useQueryClient();
    const {
        projects,
        addProject,
        updateProject: updateStoreProject,
        deleteProject: deleteStoreProject,
        currentProjectId,
        setCurrentProjectId
    } = useProjectStore();

    const { setView, setIsCreatingProject } = useUIStore();

    // Helper to sync UI (React Query) with Actions
    const invalidateProjects = () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    const createProject = async (name: string, color: string) => {
        try {
            const newP = await api.createProject({ name, color });

            // 1. Update Legacy Store (for internal logic like togglePin)
            addProject(newP);

            // 2. Sync UI (React Query)
            invalidateProjects();

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

            // 1. Update Legacy Store
            updateStoreProject(id, data);

            // 2. Sync UI
            invalidateProjects();

        } catch (e) {
            console.error("Failed to update project", e);
            alert("Erro ao atualizar projeto");
        }
    };

    const deleteProject = async (id: string) => {
        try {
            await api.deleteProject(id);

            // 1. Update Legacy Store
            deleteStoreProject(id);

            // 2. Sync UI
            invalidateProjects();

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
        // 1. Try Legacy Store
        let p = projects.find(x => x.id === id);

        // 2. If not found, try React Query Cache (Source of Truth for Dashboard)
        if (!p) {
            const cachedProjects = queryClient.getQueryData<Project[]>(['projects']);
            p = cachedProjects?.find(x => x.id === id);
        }

        if (p) {
            updateProject(id, { isPinned: !p.isPinned });
        } else {
            console.warn(`[togglePin] Project ${id} not found in Store or Cache`);
        }
    };

    return {
        createProject,
        updateProject,
        deleteProject,
        togglePin
    };
};
