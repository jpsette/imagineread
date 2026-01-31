/**
 * API Client
 * 
 * Unified API interface for backward compatibility.
 * Methods are organized in domain-specific modules:
 * - ./core.ts - Base request function
 * - ./projects.ts - Project management
 * - ./filesystem.ts - File and folder operations
 * - ./ai.ts - AI-powered features (OCR, cleaning, detection)
 */

import { projectsApi } from './projects';
import { filesystemApi } from './filesystem';
import { aiApi, CleanResponse } from './ai';

// Re-export types
export type { CleanResponse };

/**
 * Unified API client maintaining backward compatibility.
 * Delegates to domain-specific modules.
 */
class ApiClient {
    // --- Projects ---
    getProjects = projectsApi.getAll;
    createProject = projectsApi.create;
    deleteProject = projectsApi.delete;
    updateProject = projectsApi.update;

    // --- FileSystem ---
    getFileSystem = filesystemApi.getFileSystem.bind(filesystemApi);
    getFileSystemEntry = filesystemApi.getFileSystemEntry.bind(filesystemApi);
    getFile = filesystemApi.getFile;
    updateFileData = filesystemApi.updateFileData.bind(filesystemApi);
    updateFileBalloons = filesystemApi.updateFileBalloons.bind(filesystemApi);
    uploadPage = filesystemApi.uploadPage;
    uploadPDF = filesystemApi.uploadPDF;
    createFolder = filesystemApi.createFolder;
    moveItem = filesystemApi.moveItem;
    updateFileSystemEntry = filesystemApi.updateFileSystemEntry;
    renameFileSystemEntry = filesystemApi.renameFileSystemEntry.bind(filesystemApi);
    reorderItems = filesystemApi.reorderItems;
    deleteFileSystemEntry = filesystemApi.deleteFileSystemEntry;

    // --- AI ---
    runOcr = aiApi.runOcr;
    cleanPage = aiApi.cleanPage;
    detectBalloons = aiApi.detectBalloons;
    detectPanels = aiApi.detectPanels;
}

export const api = new ApiClient();

// Also export individual modules for direct access
export { projectsApi, filesystemApi, aiApi };
