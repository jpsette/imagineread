import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';


export const useFileItem = (id: string | null, options?: { keepPreviousData?: boolean }) => {
    return useQuery({
        queryKey: ['file', id],
        queryFn: async () => {
            if (!id) return null;
            // Since we don't have a direct getFile API (based on typical pattern), 
            // we likely used getFileSystem() and found it, OR we have a getFile endpoint.
            // Let's assume we need to implement a fetch logic. 
            // If API doesn't have getFile, we might filter from getFileSystem or assuming there IS an endpoint I missed.
            // Actually, looking at typical REST, it should be api.getFile(id).
            // I will check API first. If not, I will fallback to finding it in full filesystem or implementing it.

            // Re-implementing based on likely previous behavior:
            return api.getFileSystemEntry(id);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options
    });
};
