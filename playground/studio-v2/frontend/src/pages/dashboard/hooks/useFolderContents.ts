import { useQuery } from '@tanstack/react-query';
import { api } from '@shared/api/api';
import { Project } from '@shared/types';
import { LocalFileSystemBridge } from '../services/filesystem/LocalFileSystemBridge';

export const useFolderContents = (folderId: string | null, project?: Project | null) => {
    return useQuery({
        // Unique cache key: varies by folderId and project ID/LocalPath
        queryKey: ['filesystem', folderId, project?.id],

        queryFn: async () => {
            console.log(`🔍 [useFolderContents] Fetching for folder: ${folderId}, Project: ${project?.name} (${project?.id})`);
            
            // === LOCAL MODE STRATEGY ===
            // If project is LOCAL (has localPath), we use the Bridge.
            if (project?.localPath) {
                console.log(`📂 [useFolderContents] Using Local Bridge. Path: ${project.localPath}`);

                // Case A: Root Folder Request
                if (folderId === 'LOCAL_PROJECT_ROOT' || !folderId) {
                    return LocalFileSystemBridge.readDirectory(project.localPath, project.id);
                }

                // Case B: Subfolder Request (folderId is absolute path)
                // We assume folderId IS the path for local items.
                // Security Check: simple check to ensure we don't traverse up? 
                // For now, trusting the app logic.
                return LocalFileSystemBridge.readDirectory(folderId, project.id);
            }

            // === CLOUD MODE STRATEGY (Legacy) ===
            // Guard against leaking Cloud Root into Local Project (if project is local but missing path - rare edge case)
            if (folderId === 'LOCAL_PROJECT_ROOT') return [];

            console.log(`☁️ [useFolderContents] Using API (Cloud Mode). ParentId: ${folderId}`);
            return api.getFileSystem(folderId || undefined);
        },

        // Cache for 5 mins usually, but keeping it fresh is safer for file OS
        staleTime: 1000 * 5, // 5 seconds for local files (more reactive)
    });
};
