import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../../../services/api';

interface UseFileItemOptions {
    keepPreviousData?: boolean;
}

export const useFileItem = (fileId: string | null, options?: UseFileItemOptions) => {
    return useQuery({
        queryKey: ['file', fileId],
        queryFn: async () => {
            if (!fileId) throw new Error('No file ID');
            return api.getFile(fileId);
        },
        enabled: !!fileId, // Only run if ID is present
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: options?.keepPreviousData ? keepPreviousData : undefined
    });
};
