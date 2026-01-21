import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: () => api.getProjects(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
