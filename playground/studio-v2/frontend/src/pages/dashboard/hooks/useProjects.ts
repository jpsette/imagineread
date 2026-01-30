import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/api/api';
import { useProjectStore } from '@app/store/useProjectStore';
import { Project } from '@shared/types';

const getProjects = () => api.getProjects();

export const useProjects = () => {
    // 1. Get Cloud Projects
    const { data: cloudProjects = [], isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: getProjects,
        staleTime: 1000 * 60 * 5
    });

    // 2. Get Local Projects (from Zustand Store)
    const storeProjects = useProjectStore(state => state.projects);
    const localProjects = storeProjects.filter(p => p.localPath); // Filter only local ones to avoid dupe cloud ones if store has them

    // 3. Merge Strategies
    // We prioritize Cloud, but append Local.
    // If a project exists in both (by ID), we use the one with more info (likely Cloud if synced, but Local if strictly local)
    // For now, naive merge: Cloud + Local unique IDs.

    const mergedProjects = useMemo(() => {
        const map = new Map<string, Project>();

        // Add Cloud first
        cloudProjects.forEach(p => map.set(p.id, p));

        // Add Local (overwriting if ID clash? Or preserving? Local usually fresher for local paths)
        localProjects.forEach(p => {
            // If local version has localPath and cloud version doesn't, we definitely want the local version info merged in.
            const existing = map.get(p.id);
            if (existing) {
                map.set(p.id, { ...existing, ...p });
            } else {
                map.set(p.id, p);
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        );
    }, [cloudProjects, localProjects]);

    return {
        data: mergedProjects,
        isLoading
    };
};
