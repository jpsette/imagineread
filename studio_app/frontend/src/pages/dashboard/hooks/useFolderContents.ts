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

            // === LOCAL PATH DETECTION ===
            // A path starting with "/" is a local filesystem path
            const isLocalPath = folderId?.startsWith('/') || false;

            // === LOCAL MODE STRATEGY ===
            // If project is LOCAL (has localPath) OR folderId is a local path
            if (project?.localPath || isLocalPath) {
                const basePath = project?.localPath || folderId;
                const projectId = project?.id || 'local';

                console.log(`📂 [useFolderContents] Using Local Bridge. Path: ${basePath}`);

                // Case A: Root Folder Request
                if (folderId === 'LOCAL_PROJECT_ROOT' || !folderId) {
                    return LocalFileSystemBridge.readDirectory(basePath!, projectId);
                }

                // Case B: Subfolder/File Directory Request (folderId is absolute path)
                return LocalFileSystemBridge.readDirectory(folderId, projectId);
            }

            // === CLOUD MODE STRATEGY (Legacy) ===
            // Guard against leaking Cloud Root into Local Project
            if (folderId === 'LOCAL_PROJECT_ROOT') return [];

            console.log(`☁️ [useFolderContents] Using API (Cloud Mode). ParentId: ${folderId}`);
            return api.getFileSystem(folderId || undefined);
        },

        // Cache for 5 mins usually, but keeping it fresh is safer for file OS
        staleTime: 1000 * 5, // 5 seconds for local files (more reactive)
    });
};
