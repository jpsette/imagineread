import { create } from 'zustand';
import { Job } from '../types';

const API_BASE = 'http://localhost:8000'; // Hardcoded for now, should move to env

interface JobStore {
    jobs: Job[];
    isLoading: boolean;
    isPolling: boolean;

    // Actions
    fetchJobs: (silent?: boolean) => Promise<void>;
    startPolling: (interval?: number) => void;
    stopPolling: () => void;

    // Derived helpers
    activeJobsCount: () => number;
}

// Polling Timer Reference
let pollTimer: NodeJS.Timeout | null = null;

export const useJobStore = create<JobStore>((set, get) => ({
    jobs: [],
    isLoading: false,
    isPolling: false,

    fetchJobs: async (silent = false) => {
        try {
            if (!silent) set({ isLoading: true });
            const response = await fetch(`${API_BASE}/jobs`);
            if (!response.ok) throw new Error('Failed to fetch jobs');

            const data = await response.json();

            // Sort by Date DESC
            const sorted = (data as Job[]).sort((a, b) => b.created_at - a.created_at);

            set({ jobs: sorted, isLoading: false });
        } catch (error) {
            console.error('Job polling error:', error);
            set({ isLoading: false });
        }
    },

    startPolling: (interval = 2000) => {
        if (get().isPolling) return;

        set({ isPolling: true });
        get().fetchJobs(true); // Initial fetch (Silent to avoid flicker on mount if we prefer, or false)
        // Let's make initial fetch silent too if we want, OR make it loading.
        // Actually, for "Flicker" prevention on empty, silent is best.

        pollTimer = setInterval(() => {
            get().fetchJobs(true); // Silent polling
        }, interval);
    },

    stopPolling: () => {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        set({ isPolling: false });
    },

    activeJobsCount: () => {
        const { jobs } = get();
        return jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING').length;
    }
}));
