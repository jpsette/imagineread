import { getDB } from '../database/db';
import { apiClient } from '../api/apiClient';

export const SyncService = {
    async processQueue() {
        const db = await getDB();

        // 1. Fetch pending items
        const pendingItems = await db.getAllAsync<any>(`
            SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 10
        `);

        if (pendingItems.length === 0) return;

        console.log(`[Sync] Processing ${pendingItems.length} items...`);

        for (const item of pendingItems) {
            try {
                const payload = JSON.parse(item.payload);

                // 2. Send to API (Mocked for now)
                // await apiClient.post('/sync', { action: item.action, ...payload });

                // Simulate success
                // console.log(`[Sync] Synced item ${item.id}:`, payload);

                // 3. Delete from Queue on Success
                await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [item.id]);

            } catch (error) {
                console.error(`[Sync] Failed item ${item.id}`, error);

                // 4. Increment retry count
                await db.runAsync(`
                    UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?
                `, [item.id]);
            }
        }
    }
};
