import { useEffect } from 'react';
import { SyncService } from '../sync/SyncService';

// Interval in milliseconds (e.g., 30 seconds)
const SYNC_INTERVAL_MS = 30000;

export function useSync() {
    useEffect(() => {
        // Initial sync on mount
        SyncService.processQueue();

        const intervalId = setInterval(() => {
            SyncService.processQueue();
        }, SYNC_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, []);
}
