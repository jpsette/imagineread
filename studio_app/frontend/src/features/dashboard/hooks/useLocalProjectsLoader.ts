import { useEffect } from 'react';
import { LocalProjectRegistry } from '../services/LocalProjectRegistry';
import { LocalFileSystemService } from '../../../services/filesystem/LocalFileSystemService';
import { useProjectStore } from '../../../store/useProjectStore';

export const useLocalProjectsLoader = () => {
    const { addProject, projects } = useProjectStore();

    useEffect(() => {
        const loadLocalProjects = async () => {
            const registeredPaths = LocalProjectRegistry.getRegisteredPaths();
            const localService = new LocalFileSystemService();

            for (const path of registeredPaths) {
                try {
                    // Check if already loaded to avoid dupes (basic check)
                    // We can't easily check by ID before loading, but we can check if any project in store matches logic?
                    // Actually, projects store is empty on fresh load.

                    const projectFile = await localService.loadProject(path);

                    // Check if already exists in store by ID
                    const exists = projects.some(p => p.id === projectFile.meta.id);
                    if (exists) continue;

                    // Map to UI Type
                    addProject({
                        id: projectFile.meta.id,
                        name: projectFile.meta.name,
                        color: projectFile.meta.color || 'bg-zinc-500',
                        createdAt: projectFile.meta.createdAt,
                        lastModified: projectFile.meta.updatedAt,
                        isPinned: false,
                        rootFolderId: 'LOCAL_PROJECT_ROOT',
                        localPath: path
                    });
                } catch (e) {
                    console.warn(`Failed to load local project at ${path}. It might be deleted.`, e);
                    // Optional: Auto-unregister if file not found?
                    // LocalProjectRegistry.unregisterPath(path);
                }
            }
        };

        loadLocalProjects();
    }, []); // Run once on mount
};
