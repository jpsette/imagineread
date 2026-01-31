import { IFileSystemService } from './IFileSystemService';
import { ProjectFile, ProjectPage } from '../../types/ProjectSchema';
import { v4 as uuidv4 } from 'uuid';

export class LocalFileSystemService implements IFileSystemService {

    async createProject(name: string, location: string, color?: string): Promise<ProjectFile> {
        // 0. Guard Electron
        if (!window.electron?.local) throw new Error("Local FileSystem not available");

        // 1. Create Project Structure
        const projectDir = `${location}/${name}`;
        await window.electron.local.createDirectory(projectDir);
        await window.electron.local.createDirectory(`${projectDir}/assets`);
        await window.electron.local.createDirectory(`${projectDir}/assets/pages`);

        // 2. Create Metadata File (.irproject)
        const projectFile: ProjectFile = {
            version: 1,
            meta: {
                id: uuidv4(),
                name: name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                author: 'Local User',
                color: color || 'bg-zinc-500'
            },
            pages: [],
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

    async importPage(_project: ProjectFile, sourceFilePath: string): Promise<ProjectPage> {
        // 1. Generate unique filename
        // const ext = sourceFilePath.split('.').pop();
        // const _newFilename = `page_${uuidv4()}.${ext}`;

        // TODO: Implement file copy logic via Electron Bridge
        console.warn("LocalFileSystem: Page Import not fully implemented yet");

        return {} as any;
    }

    async deletePage(_project: ProjectFile, _pageId: string): Promise<boolean> {
        return true;
    }

    getProjectLocation(_project: ProjectFile): string {
        return "local";
    }
}
