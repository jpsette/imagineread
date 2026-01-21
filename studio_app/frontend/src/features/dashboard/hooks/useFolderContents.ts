import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { FileEntry } from '../../../types';

export const useFolderContents = (folderId: string | null) => {
    return useQuery({
        // Unique cache key: varies by folderId. 
        // If folderId is null/undefined, checks 'root'.
        queryKey: ['filesystem', folderId],

        queryFn: async () => {
            // api.getFileSystem() by legacy fetches EVERYTHING.
            // We need to update api.getFileSystem to accept parentId arg.
            // Wait, we updated Backend, but not frontend api.ts yet!
            // We need to update api.ts first.
            // Assuming api.ts has getFileSystem(parentId?: string)

            // NOTE: api.ts needs update. I'll flag this as a required step.
            // For now, I'll write the hook assuming api.getFileSystem accepts it.
            return api.getFileSystem(folderId || undefined);
        },

        // Cache for 5 mins usually, but keeping it fresh is safer for file OS
        staleTime: 1000 * 60, // 1 minute
    });
};
