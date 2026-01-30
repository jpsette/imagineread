import { useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '@app/store/useProjectStore';
import { useUIStore } from '@app/store/useUIStore';
import { api } from '@shared/api/api';
import { Project } from '@shared/types';
import { LocalProjectRegistry } from '@pages/dashboard/services/LocalProjectRegistry';

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

    const createProject = async (name: string, color: string, mode: 'cloud' | 'local' = 'cloud', path?: string) => {
        try {
            let newP: Project;

            if (mode === 'local' && path) {
                // === LOCAL MODE ===
                const { LocalFileSystemService } = await import('@shared/services/filesystem/LocalFileSystemService');
                const localService = new LocalFileSystemService();
                const projectFile = await localService.createProject(name, path, color);

                // Map ProjectFile (New) -> Project (Old) for UI compatibility
                newP = {
                    id: projectFile.meta.id,
                    name: projectFile.meta.name,
                    color: color, // We use the passed color, though it's not strictly in file yet
                    createdAt: projectFile.meta.createdAt,
                    lastModified: projectFile.meta.updatedAt,
                    isPinned: false,
                    rootFolderId: 'LOCAL_PROJECT_ROOT', // Explicit ID to prevent Cloud API fetching,
                    localPath: path + '/' + name // PERSISTENCE: Must save path!
                };

                // === PERSISTENCE: Register the path ===
                LocalProjectRegistry.registerPath(path + '/' + name);

            } else {
                // === CLOUD MODE (Legacy) ===
                newP = await api.createProject({ name, color });
            }

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
            // Check if it's local (by looking at Store)
            const projectToDelete = projects.find(p => p.id === id);

            if (projectToDelete?.localPath) {
                // === LOCAL DELETE ===
                // 1. Unregister from Registry (so it doesn't reload)
                LocalProjectRegistry.unregisterPath(projectToDelete.localPath);

                // 2. We do NOT delete files from disk automatically yet (safety)

            } else {
                // === CLOUD DELETE ===
                await api.deleteProject(id);
            }

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
