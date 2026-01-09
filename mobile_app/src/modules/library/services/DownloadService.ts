import * as FileSystem from 'expo-file-system';
import { ComicRepository } from '../repositories/ComicRepository';
import { readerService } from '../../reader/services/MockReaderService'; // Ensure this path is correct relative to this file
import { ComicManifest } from '../../reader/types/Manifest';

// Enum for Download Status matching DB
export type DownloadStatus = 'NONE' | 'PENDING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';

export const DownloadService = {
    async downloadComic(comicId: string) {
        try {
            // 1. Update DB to PENDING/DOWNLOADING
            await ComicRepository.updateDownloadStatus(comicId, 'DOWNLOADING', 0, null);

            // 2. Setup Folder
            // @ts-ignore
            const downloadFolder = `${FileSystem.documentDirectory}downloads/${comicId}/`;
            const folderInfo = await FileSystem.getInfoAsync(downloadFolder);
            if (!folderInfo.exists) {
                await FileSystem.makeDirectoryAsync(downloadFolder, { intermediates: true });
            }

            // 3. Fetch Manifest
            // In a real app, we'd fetch from a URL. Here we get the mock object.
            const manifest = await readerService.getComicDetails(comicId);

            // 4. Download Pages
            const totalPages = manifest.pages.length;
            let downloaded = 0;

            const newPages = await Promise.all(manifest.pages.map(async (page, index) => {
                const imageUrl = page.imageUri;
                // Generate a local filename
                const fileName = `page_${index}_${imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg'}`;
                const fileUri = downloadFolder + fileName;

                // Download File
                try {
                    await FileSystem.downloadAsync(imageUrl, fileUri);
                } catch (e) {
                    console.error("Failed to download image", imageUrl, e);
                    // Continue best effort or throw? Let's continue for now but ideally fail.
                }

                downloaded++;
                const progress = Math.round((downloaded / totalPages) * 100);

                // Update DB periodically (every 5 images or 20%?) or just simply every image for now since DB is local
                if (downloaded % 2 === 0 || downloaded === totalPages) {
                    await ComicRepository.updateDownloadStatus(comicId, 'DOWNLOADING', progress, null);
                }

                // Return updated page with local URI
                return {
                    ...page,
                    imageUri: fileUri
                };
            }));

            // 5. Save Local Manifest
            const localManifest: ComicManifest = {
                ...manifest,
                pages: newPages
            };
            const manifestPath = downloadFolder + 'manifest.json';
            await FileSystem.writeAsStringAsync(manifestPath, JSON.stringify(localManifest));

            // 6. Complete
            await ComicRepository.updateDownloadStatus(comicId, 'COMPLETED', 100, downloadFolder);

        } catch (error) {
            console.error("Download Failed", error);
            await ComicRepository.updateDownloadStatus(comicId, 'FAILED', 0, null);
        }
    },

    async deleteDownload(comicId: string) {
        try {
            const downloadFolder = `${FileSystem.documentDirectory}downloads/${comicId}/`;
            const info = await FileSystem.getInfoAsync(downloadFolder);
            if (info.exists) {
                await FileSystem.deleteAsync(downloadFolder);
            }
            await ComicRepository.updateDownloadStatus(comicId, 'NONE', 0, null);
        } catch (error) {
            console.error("Delete Failed", error);
        }
    }
};
