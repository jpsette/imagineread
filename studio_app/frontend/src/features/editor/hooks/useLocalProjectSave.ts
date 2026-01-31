/**
 * useLocalProjectSave
 * 
 * Hook to handle saving editor state to local comic/project files.
 * Supports both:
 * - New structure: comic.json (per-comic metadata)
 * - Legacy structure: project.irproject (per-project metadata)
 */

import { useCallback, useRef } from 'react';
import { Balloon, Panel } from '@shared/types';

// Hidden folder names (must match backend config)
const LOCAL_PROJECT_FOLDERS = {
    origin: '.origin',
    cleaned: '.cleaned',
    exports: '.exports',
};

interface LocalSaveData {
    pageId: string;           // Identifier for the page being saved
    balloons?: Balloon[];     // Balloon data to save
    panels?: Panel[];         // Panel data to save
    cleanedImagePath?: string; // Path to cleaned image (in temp) to copy
}

// Page data structure (shared between both formats)
interface PageData {
    id: string;
    order?: number;
    filename?: string;
    originPath?: string;
    cleanedPath?: string;
    balloons?: Balloon[];
    panels?: Panel[];
}

// Comic metadata structure (new structure - comic.json)
interface ComicFile {
    id: string;
    name: string;
    folderName: string;
    sourceFile: string;
    createdAt: string;
    pageCount: number;
    pages: PageData[];
}

// Legacy project structure (project.irproject)
interface LegacyProjectFile {
    version?: number;
    meta?: {
        id: string;
        name: string;
        color?: string;
        createdAt: string;
        updatedAt?: string;
    };
    pages?: PageData[];
    comics?: any[];
}

type MetadataType = 'comic' | 'legacy' | null;

interface DetectionResult {
    type: MetadataType;
    metadataPath: string | null;
}

interface LoadResult {
    type: MetadataType;
    metadataPath: string | null;
    data: ComicFile | LegacyProjectFile | null;
}

/**
 * Hook for saving editor data to local files.
 * Automatically detects and handles both new (comic.json) and legacy (project.irproject) structures.
 * @param basePath - Path derived from fileId (parent of .origin folder)
 */
export const useLocalProjectSave = (basePath: string | null) => {
    // Cache the detected metadata type to avoid repeated file checks
    const detectedType = useRef<MetadataType>(null);
    const cachedMetadataPath = useRef<string | null>(null);

    /**
     * Check if this is a local project (path-based, not cloud ID)
     */
    const isLocalProject = useCallback(() => {
        return basePath !== null && basePath.startsWith('/');
    }, [basePath]);

    /**
     * Detect which metadata structure exists at basePath or parent
     * Returns both the type and the actual path where metadata was found
     */
    const detectMetadataType = useCallback(async (): Promise<DetectionResult> => {
        if (!basePath || !window.electron?.local?.readFile) {
            return { type: null, metadataPath: null };
        }

        // Use cached value if available
        if (cachedMetadataPath.current !== null && detectedType.current !== null) {
            return { type: detectedType.current, metadataPath: cachedMetadataPath.current };
        }

        // Try comic.json first (new structure - in current folder)
        const comicFilePath = `${basePath}/comic.json`;
        const comicResult = await window.electron.local.readFile(comicFilePath);
        if (comicResult.success && comicResult.content) {
            console.log('📚 [LocalSave] Detected comic.json at:', basePath);
            detectedType.current = 'comic';
            cachedMetadataPath.current = basePath;
            return { type: 'comic', metadataPath: basePath };
        }

        // Try project.irproject in current folder (legacy structure)
        const legacyFilePath = `${basePath}/project.irproject`;
        const legacyResult = await window.electron.local.readFile(legacyFilePath);
        if (legacyResult.success && legacyResult.content) {
            console.log('📂 [LocalSave] Detected project.irproject at:', basePath);
            detectedType.current = 'legacy';
            cachedMetadataPath.current = basePath;
            return { type: 'legacy', metadataPath: basePath };
        }

        // Try parent folder for project.irproject (legacy structure where .origin is inside project root)
        const parentPath = basePath.split('/').slice(0, -1).join('/');
        if (parentPath) {
            const parentLegacyPath = `${parentPath}/project.irproject`;
            const parentResult = await window.electron.local.readFile(parentLegacyPath);
            if (parentResult.success && parentResult.content) {
                console.log('📂 [LocalSave] Detected project.irproject in parent:', parentPath);
                detectedType.current = 'legacy';
                cachedMetadataPath.current = parentPath;
                return { type: 'legacy', metadataPath: parentPath };
            }
        }

        console.warn('⚠️ [LocalSave] No metadata file found at:', basePath, 'or parent');
        return { type: null, metadataPath: null };
    }, [basePath]);

    /**
     * Load metadata (comic.json or project.irproject)
     */
    const loadMetadata = useCallback(async (): Promise<LoadResult> => {
        if (!basePath || !window.electron?.local?.readFile) {
            return { type: null, metadataPath: null, data: null };
        }

        const detection = await detectMetadataType();
        if (!detection.type || !detection.metadataPath) {
            return { type: null, metadataPath: null, data: null };
        }

        const filePath = detection.type === 'comic'
            ? `${detection.metadataPath}/comic.json`
            : `${detection.metadataPath}/project.irproject`;

        const result = await window.electron.local.readFile(filePath);
        if (!result.success || !result.content) {
            console.error('Failed to load metadata:', result.error);
            return { type: detection.type, metadataPath: detection.metadataPath, data: null };
        }

        try {
            const data = JSON.parse(result.content);
            return { type: detection.type, metadataPath: detection.metadataPath, data };
        } catch (e) {
            console.error('Failed to parse metadata:', e);
            return { type: detection.type, metadataPath: detection.metadataPath, data: null };
        }
    }, [basePath, detectMetadataType]);

    /**
     * Save metadata (comic.json or project.irproject)
     */
    const saveMetadata = useCallback(async (
        type: MetadataType,
        metadataPath: string,
        data: ComicFile | LegacyProjectFile
    ): Promise<boolean> => {
        if (!window.electron?.local?.writeFile || !type || !metadataPath) return false;

        const filePath = type === 'comic'
            ? `${metadataPath}/comic.json`
            : `${metadataPath}/project.irproject`;

        const content = JSON.stringify(data, null, 2);
        const result = await window.electron.local.writeFile(filePath, content);

        if (!result.success) {
            console.error('Failed to save metadata:', result.error);
            return false;
        }

        console.log(`✅ [LocalSave] Saved to ${type === 'comic' ? 'comic.json' : 'project.irproject'}`);
        return true;
    }, []);

    /**
     * Handle cleaned image - download from URL or copy local file
     */
    const handleCleanedImage = useCallback(async (
        imageSource: string,
        pageId: string,
        targetPath: string
    ): Promise<string | null> => {
        const isUrl = imageSource.startsWith('http://') || imageSource.startsWith('https://');

        // Get file extension from source
        const ext = imageSource.split('.').pop()?.split('?')[0] || 'jpg';
        const filename = `${pageId}_clean.${ext}`;
        const cleanedDir = `${targetPath}/${LOCAL_PROJECT_FOLDERS.cleaned}`;
        const destPath = `${cleanedDir}/${filename}`;

        // Ensure .cleaned directory exists
        if (window.electron?.local?.createDirectory) {
            await window.electron.local.createDirectory(cleanedDir);
        }

        try {
            if (isUrl) {
                // For HTTP URLs, download the image and save locally
                console.log('📥 [LocalSave] Downloading cleaned image from:', imageSource);

                // Check if Electron has downloadFile capability
                if (window.electron?.local?.downloadFile) {
                    const result = await window.electron.local.downloadFile(imageSource, destPath);
                    if (!result.success) {
                        console.error('Failed to download cleaned image:', result.error);
                        // Fallback: store URL reference
                        return imageSource;
                    }
                    console.log('✅ [LocalSave] Cleaned image downloaded to:', destPath);
                    return `${LOCAL_PROJECT_FOLDERS.cleaned}/${filename}`;
                } else {
                    // downloadFile not available in this Electron version, store URL reference
                    console.warn('⚠️ [LocalSave] downloadFile not available, storing URL reference');
                    return imageSource;
                }
            } else {
                if (!window.electron?.local?.copyFile) return null;

                const result = await window.electron.local.copyFile(imageSource, destPath);
                if (!result.success) {
                    console.error('Failed to copy cleaned image:', result.error);
                    return null;
                }

                console.log('✅ Cleaned image copied:', destPath);
                return `${LOCAL_PROJECT_FOLDERS.cleaned}/${filename}`;
            }
        } catch (error) {
            console.error('Failed to save cleaned image:', error);
            return null;
        }
    }, []);

    /**
     * Main save function - saves page data to local metadata file
     */
    const saveToLocal = useCallback(async (data: LocalSaveData): Promise<boolean> => {
        if (!isLocalProject()) {
            console.warn('saveToLocal called but not a local project');
            return false;
        }

        console.log('💾 [LocalSave] Saving to basePath:', basePath);

        // 1. Load current metadata
        const loadResult = await loadMetadata();
        if (!loadResult.type || !loadResult.metadataPath || !loadResult.data) {
            console.error('Failed to load metadata for saving');
            return false;
        }

        const { type, metadataPath, data: metadata } = loadResult;
        console.log('📂 [LocalSave] Using metadata at:', metadataPath, 'type:', type);

        // 2. Get pages array (works for both structures)
        const pages: PageData[] = (metadata as any).pages || [];

        // 3. Find the page
        let pageIndex = pages.findIndex((p: PageData) =>
            p.id === data.pageId ||
            p.originPath?.includes(data.pageId) ||
            p.filename === data.pageId
        );

        if (pageIndex === -1) {
            console.log('📄 Page not found, creating new entry:', data.pageId);
            const newPage: PageData = {
                id: data.pageId,
                order: pages.length,
                filename: data.pageId,
                originPath: `${LOCAL_PROJECT_FOLDERS.origin}/${data.pageId}.jpg`,
                balloons: data.balloons || [],
                panels: data.panels || []
            };
            pages.push(newPage);
            pageIndex = pages.length - 1;
        } else {
            // Update existing page
            if (data.balloons !== undefined) {
                pages[pageIndex].balloons = data.balloons;
            }
            if (data.panels !== undefined) {
                pages[pageIndex].panels = data.panels;
            }
        }

        // 4. Handle cleaned image if provided
        if (data.cleanedImagePath && pageIndex !== -1) {
            const cleanedRelPath = await handleCleanedImage(
                data.cleanedImagePath,
                data.pageId,
                metadataPath
            );
            if (cleanedRelPath) {
                pages[pageIndex].cleanedPath = cleanedRelPath;
            }
        }

        // 5. Update pages array in metadata
        (metadata as any).pages = pages;

        // Update timestamp for legacy projects
        if (type === 'legacy' && (metadata as LegacyProjectFile).meta) {
            (metadata as LegacyProjectFile).meta!.updatedAt = new Date().toISOString();
        }

        // 6. Save metadata
        const success = await saveMetadata(type, metadataPath, metadata);

        if (success) {
            console.log('✅ [LocalSave] Save complete');
        }

        return success;
    }, [basePath, isLocalProject, loadMetadata, saveMetadata, handleCleanedImage]);

    return {
        isLocalProject,
        saveToLocal,
        loadMetadata,
        detectMetadataType,
    };
};
