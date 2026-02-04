import { IFileSystemService } from './IFileSystemService';
import { ProjectFile, ProjectPage } from '@shared/types/ProjectSchema';
import { v4 as uuidv4 } from 'uuid';

// Hidden folder names that should be filtered from UI
// Must match backend config.LOCAL_PROJECT_FOLDERS
const HIDDEN_FOLDERS = ['.origin', '.cleaned', '.exports'];

// Backend API URL
const API_URL = 'http://127.0.0.1:8000';

/**
 * Check if a folder/file name should be hidden from the user
 */
export const isHiddenFolder = (name: string): boolean => {
    return name.startsWith('.') || HIDDEN_FOLDERS.includes(name);
};

// Comic metadata stored in project.irproject
interface ComicEntry {
    id: string;
    folder: string;
    name: string;
    pageCount: number;
    createdAt: string;
}

// Extended ProjectFile with comics list
interface ProjectFileV2 extends ProjectFile {
    version: 2;
    comics?: ComicEntry[];
}

export class LocalFileSystemService implements IFileSystemService {

    async createProject(name: string, location: string, color?: string, useExistingFolder = false): Promise<ProjectFile> {
        // 0. Guard Electron
        if (!window.electron?.local) throw new Error("Local FileSystem not available");

        // 1. Create Project Folder
        // If useExistingFolder is true, use location directly (user selected a folder with same name)
        // Otherwise, create a subfolder with the project name
        const projectDir = useExistingFolder ? location : `${location}/${name}`;
        await window.electron.local.createDirectory(projectDir);

        // NOTE: Hidden folders (.origin, .cleaned, .exports) are now created
        // per-comic by importComic, not at project root

        // 2. Create Metadata File (.irproject)
        const projectFile: ProjectFileV2 = {
            version: 2,
            meta: {
                id: uuidv4(),
                name: name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: 'Local User',
                color: color || 'bg-zinc-500'
            },
            comics: [],  // New: list of imported comics
            pages: [],   // Legacy: kept for backwards compatibility
            settings: {
                language: 'pt-BR',
                exportFormat: 'pdf'
            }
        };

        const success = await this.saveProject(projectFile, projectDir);
        if (!success) throw new Error('Failed to create project file on disk');

        return projectFile;
    }

    async loadProject(path: string): Promise<ProjectFile> {
        if (!window.electron?.local) throw new Error("Local FileSystem not available");

        // Path should point to the folder or the .irproject file?
        // Let's assume path is the FOLDER path for now, we look for project.ir
        const filePath = path.endsWith('.irproject') ? path : `${path}/project.irproject`;

        const result = await window.electron.local.readFile(filePath);
        if (!result.success || !result.content) {
            throw new Error(`Failed to load project: ${result.error}`);
        }

        return JSON.parse(result.content) as ProjectFile;
    }

    async saveProject(project: ProjectFile, projectPath?: string): Promise<boolean> {
        if (!window.electron?.local) return false;

        // We need to know where to save. 
        if (!projectPath) {
            console.error("LocalFileSystem: saveProject requires a path (temporary limitation).");
            return false;
        }

        const filePath = `${projectPath}/project.irproject`;
        const content = JSON.stringify(project, null, 4);
        const result = await window.electron.local.writeFile(filePath, content);

        return result.success;
    }

    /**
     * Update project metadata (name, color, etc.)
     */
    async updateProject(projectPath: string, updates: { name?: string; color?: string }): Promise<boolean> {
        try {
            const project = await this.loadProject(projectPath);

            // Apply updates
            if (updates.name !== undefined) {
                project.meta.name = updates.name;
            }
            if (updates.color !== undefined) {
                project.meta.color = updates.color;
            }
            project.meta.updatedAt = new Date().toISOString();

            // Save back
            return await this.saveProject(project, projectPath);
        } catch (e) {
            console.error('Failed to update local project:', e);
            return false;
        }
    }

    /**
     * Import a comic (PDF, images) into a project.
     * Creates a comic folder with proper structure and extracts pages.
     */
    async importComic(projectPath: string, sourcePath: string, customName?: string): Promise<ComicEntry> {
        console.log('📚 [LocalFS] Importing comic:', sourcePath);

        // Call backend to do the heavy lifting
        const response = await fetch(`${API_URL}/import_comic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_path: sourcePath,
                project_path: projectPath,
                comic_name: customName || undefined
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to import comic');
        }

        const result = await response.json();
        console.log('✅ [LocalFS] Comic imported:', result);

        // Create comic entry for project.irproject
        const comicEntry: ComicEntry = {
            id: result.comic_id,
            folder: result.comic_folder,
            name: result.comic_name,
            pageCount: result.page_count,
            createdAt: new Date().toISOString()
        };

        // Update project.irproject with new comic
        try {
            const project = await this.loadProject(projectPath) as ProjectFileV2;

            // Ensure comics array exists
            if (!project.comics) {
                project.comics = [];
            }

            // Add comic to list
            project.comics.push(comicEntry);
            project.meta.updatedAt = new Date().toISOString();

            await this.saveProject(project, projectPath);
            console.log('✅ [LocalFS] Project updated with comic:', comicEntry.name);
        } catch (e) {
            console.error('Failed to update project.irproject:', e);
            // Don't fail the import if project update fails
        }

        return comicEntry;
    }

    async importPage(_project: ProjectFile, _sourceFilePath: string): Promise<ProjectPage> {
        // Legacy method - use importComic for new imports
        console.warn("LocalFileSystem: importPage is deprecated, use importComic instead");
        return {} as any;
    }

    async deletePage(_project: ProjectFile, _pageId: string): Promise<boolean> {
        return true;
    }

    getProjectLocation(_project: ProjectFile): string {
        return "local";
    }
}
