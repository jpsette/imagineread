import { create } from 'zustand';
import { Job } from '../types';

const API_BASE = 'http://localhost:8000'; // Hardcoded for now, should move to env

interface JobStore {
    jobs: Job[];
    isLoading: boolean;
    isPolling: boolean;

    // Actions
    fetchJobs: (silent?: boolean) => Promise<void>;
    startPolling: () => void;
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

    // Adaptive Polling Logic
    startPolling: () => {
        if (get().isPolling) return; // Prevent double start

        set({ isPolling: true });

        const pollLoop = async () => {
            const { isPolling, fetchJobs } = get();

            if (!isPolling) return; // Stop if flag turned off

            await fetchJobs(true); // Silent fetch

            // CHECK AGAIN: If stopped during fetch (e.g. unmount/HMR), do not schedule next.
            if (!get().isPolling) return;

            // Decide next interval
            // Only count "Active" jobs if they are fresh (updated in last 5 mins)
            // This prevents "Zombie Jobs" from keeping the poller in fast mode forever.
            const now = Date.now() / 1000; // API uses seconds
            const STALE_THRESHOLD = 5 * 60; // 5 minutes

            const activeJobs = get().jobs.filter(j =>
                (j.status === 'PENDING' || j.status === 'PROCESSING') &&
                (now - j.updated_at < STALE_THRESHOLD)
            );

            const hasActive = activeJobs.length > 0;
            const nextInterval = hasActive ? 2000 : 60000; // 2s (Fast) vs 60s (Idle Heartbeat)

            // Recursively schedule next poll
            pollTimer = setTimeout(pollLoop, nextInterval);
        };

        pollLoop();
    },

    stopPolling: () => {
        if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
        set({ isPolling: false });
    },

    activeJobsCount: () => {
        const { jobs } = get();
        return jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING').length;
    }
}));
