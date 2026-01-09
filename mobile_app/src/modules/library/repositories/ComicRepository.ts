import { getDB } from '../../../core/database/db';
import { ComicMetadata } from '../services/LibraryService';
import * as Crypto from 'expo-crypto';

export const ComicRepository = {
    async getComicsByProjectId(projectId: string): Promise<ComicMetadata[]> {
        const db = await getDB();
        const rows = await db.getAllAsync<any>(`
            SELECT c.*, p.current_page_index, p.is_finished 
            FROM comics c
            LEFT JOIN progress p ON c.id = p.comic_id
            WHERE c.project_id = ?
        `, [projectId]);

        return rows.map((row: any) => ({
            id: row.id,
            title: row.title,
            author: row.author || 'Unknown',
            coverUrl: row.cover_uri || '',
            synopsis: 'Local comic',
            rating: 0,
            year: '2024',
            genre: [],
            downloadStatus: row.download_status || 'NONE',
            downloadProgress: row.download_progress || 0,
            localFolderUri: row.local_folder_uri
        }));
    },

    async getComicById(id: string) {
        const db = await getDB();
        return await db.getFirstAsync<any>(`
            SELECT c.*, p.current_page_index, p.is_finished, p.last_read_at
            FROM comics c
            LEFT JOIN progress p ON c.id = p.comic_id
            WHERE c.id = ?
        `, [id]);
    },

    async updateProgress(comicId: string, pageIndex: number, isFinished: boolean = false) {
        const db = await getDB();
        const timestamp = new Date().toISOString();
        const finishedInt = isFinished ? 1 : 0;

        await db.withTransactionAsync(async () => {
            // 1. Local Update
            await db.runAsync(`
                INSERT INTO progress (comic_id, current_page_index, last_read_at, is_finished)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(comic_id) DO UPDATE SET
                    current_page_index = excluded.current_page_index,
                    last_read_at = excluded.last_read_at,
                    is_finished = excluded.is_finished
            `, [comicId, pageIndex, timestamp, finishedInt]);

            // 2. Queue for Sync
            const payload = JSON.stringify({ comicId, pageIndex, timestamp, isFinished });
            await db.runAsync(`
                INSERT INTO sync_queue (action, payload) VALUES (?, ?)
            `, ['UPDATE_PROGRESS', payload]);
        });
    },

    async updateDownloadStatus(comicId: string, status: string, progress: number, localFolderUri: string | null) {
        const db = await getDB();
        await db.runAsync(`
            UPDATE comics 
            SET download_status = ?, download_progress = ?, local_folder_uri = ?
            WHERE id = ?
        `, [status, progress, localFolderUri, comicId]);
    },

    // --- BOOKMARKS ---

    async addBookmark(comicId: string, pageIndex: number) {
        const db = await getDB();
        const id = Crypto.randomUUID();
        await db.runAsync(`
            INSERT INTO bookmarks (id, comic_id, page_index)
            VALUES (?, ?, ?)
        `, [id, comicId, pageIndex]);
        return id;
    },

    async removeBookmark(comicId: string, pageIndex: number) {
        const db = await getDB();
        await db.runAsync(`
            DELETE FROM bookmarks WHERE comic_id = ? AND page_index = ?
        `, [comicId, pageIndex]);
    },

    async getBookmarks(comicId: string) {
        const db = await getDB();
        const rows = await db.getAllAsync<any>(`
            SELECT * FROM bookmarks WHERE comic_id = ? ORDER BY page_index ASC
        `, [comicId]);
        return rows.map(r => r.page_index as number);
    },

    async isBookmarked(comicId: string, pageIndex: number): Promise<boolean> {
        const db = await getDB();
        const result = await db.getFirstAsync<{ count: number }>(`
            SELECT count(*) as count FROM bookmarks WHERE comic_id = ? AND page_index = ?
        `, [comicId, pageIndex]);
        return (result?.count ?? 0) > 0;
    }
};
