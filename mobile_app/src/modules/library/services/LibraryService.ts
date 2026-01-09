import * as FileSystem from 'expo-file-system';
import { readerService } from '../../reader/services/MockReaderService';
import { ComicManifest } from '../../reader/types/Manifest';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { ComicRepository } from '../repositories/ComicRepository';
import { initDatabase } from '../../../core/database/db';

export interface ComicMetadata {
    id: string;
    title: string;
    author: string;
    coverUrl: string;
    synopsis: string;
    rating: number;
    year: string;
    genre: string[];
    downloadStatus?: 'NONE' | 'PENDING' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';
    downloadProgress?: number;
    localFolderUri?: string | null;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    color: string;
    comicCount: number;
    thumbnailUri?: string;
}

// Keep mock extras for now as DB doesn't have synopsis/genre yet
const MOCK_METADATA_EXTRAS: Record<string, Partial<ComicMetadata>> = {
    'c1': { synopsis: "A generic cyber comic.", genre: ["Sci-Fi"] },
};

let dbInitialized = false;

const ensureDb = async () => {
    if (!dbInitialized) {
        await initDatabase();
        dbInitialized = true;
    }
};

export const LibraryService = {
    async getProjects(): Promise<Project[]> {
        await ensureDb();
        return await ProjectRepository.getAllProjects();
    },

    async getComicsByProjectId(projectId: string): Promise<ComicMetadata[]> {
        await ensureDb();
        return await ComicRepository.getComicsByProjectId(projectId);
    },

    async getComicMetadata(id: string): Promise<ComicMetadata> {
        await ensureDb();
        // Try to get from Local DB first for basic info
        const localComic = await ComicRepository.getComicById(id);

        let manifestTitle = "Unknown";
        let manifestAuthor = "Unknown";
        let coverUrl = "";

        // If local exists, use it
        if (localComic) {
            manifestTitle = localComic.title;
            manifestAuthor = localComic.author;
            coverUrl = localComic.cover_uri;
        } else {
            // Fallback to reader service (Mock) if not in DB, 
            // e.g. for the standalone '1' comic if it wasn't seeded or for details
            try {
                const manifest = await readerService.getComicDetails('1'); // Generic fetch hook
                manifestTitle = manifest.metadata.title;
                manifestAuthor = manifest.metadata.author;
                coverUrl = manifest.pages[0]?.imageUri || "";
            } catch (e) {
                console.warn("Could not fetch manifest for", id);
            }
        }

        const extras = MOCK_METADATA_EXTRAS[id] || {
            synopsis: "No synopsis available locally.",
            rating: 0,
            year: "2024",
            genre: ["Unknown"],
            coverUrl: coverUrl
        };

        return {
            id: id,
            title: manifestTitle,
            author: manifestAuthor,
            coverUrl: extras.coverUrl || coverUrl,
            synopsis: extras.synopsis!,
            rating: extras.rating!,
            year: extras.year!,
            genre: extras.genre!,
            downloadStatus: localComic?.download_status || 'NONE',
            downloadProgress: localComic?.download_progress || 0,
            localFolderUri: localComic?.local_folder_uri
        };
    },

    async getComicManifest(id: string): Promise<ComicManifest> {
        await ensureDb();
        const localComic = await ComicRepository.getComicById(id);

        if (localComic && localComic.download_status === 'COMPLETED' && localComic.local_folder_uri) {
            console.log("Loading offline manifest for", id);
            try {
                const manifestJson = await FileSystem.readAsStringAsync(localComic.local_folder_uri + 'manifest.json');
                return JSON.parse(manifestJson);
            } catch (e) {
                console.warn("Failed to read local manifest, falling back to online", e);
            }
        }

        // Online Fetch logic
        return await readerService.getComicDetails(id);
    }
};
