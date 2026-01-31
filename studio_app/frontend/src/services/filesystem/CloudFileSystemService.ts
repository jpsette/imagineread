import { IFileSystemService } from './IFileSystemService';
import { ProjectFile, ProjectPage } from '../../types/ProjectSchema';
import { api } from '../../services/api';

export class CloudFileSystemService implements IFileSystemService {

    async createProject(name: string, _location?: string): Promise<ProjectFile> {
        // Legacy: API 'createProject' returns a simple ID/Name object
        // We need to adhere to the NEW ProjectFile schema even for Cloud projects.
        // This effectively upgrades Cloud projects to the new schema in memory.

        const response = await api.createProject({ name, color: 'blue' }); // Assuming existing API signature

        // Convert Legacy Response -> New ProjectFile
        return {
            version: 1,
            meta: {
                id: response.id,
                name: response.name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: 'Cloud User'
            },
            pages: [],
            settings: {
                language: 'pt-BR',
                exportFormat: 'pdf'
            }
        };
    }

    async loadProject(pathOrId: string): Promise<ProjectFile> {
        // Legacy: We fetch the project details from API
        // NOTE: The current API might return a different structure. 
        // We'd need to Map it.
        // For now, I'll place a placeholder mapping.

        console.warn("CloudFileSystem: Mock Loading for ID", pathOrId);

        return {
            version: 1,
            meta: {
                id: pathOrId,
                name: 'Cloud Project (Legacy)',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            pages: [],
            settings: { language: 'pt-BR', exportFormat: 'pdf' }
        };
    }

    async saveProject(_project: ProjectFile): Promise<boolean> {
        // Cloud saves are typically granular (auto-save per action).
        // If we want to save the WHOLE metadata, we'd need a new endpoint.
        // For legacy compatibility, maybe we do nothing (as it auto-saves)?
        console.log("CloudFileSystem: Auto-save handled by individual actions.");
        return true;
    }

    async importPage(_project: ProjectFile, _filePath: string): Promise<ProjectPage> {
        // Cloud: Uploads the file to the server
        console.warn("CloudFileSystem: Import logic requires file upload form data");
        throw new Error("Cloud import not fully implemented in adapter yet.");
    }

    async deletePage(_project: ProjectFile, _pageId: string): Promise<boolean> {
        // Call API
        return true;
    }

    getProjectLocation(_project: ProjectFile): string {
        return "cloud";
    }
}
