import { create } from 'zustand';
import { Job, JobState } from '../types';

const API_BASE = 'http://localhost:8000'; // Hardcoded for now, should move to env

interface JobStore {
    jobs: Job[];
    isLoading: boolean;
    isPolling: boolean;

    // Actions
    fetchJobs: () => Promise<void>;
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

    fetchJobs: async () => {
        try {
            set({ isLoading: true });
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
        get().fetchJobs(); // Initial fetch

        pollTimer = setInterval(() => {
            get().fetchJobs();
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
