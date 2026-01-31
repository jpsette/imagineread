import { ProjectFile, ProjectPage } from '../../types/ProjectSchema';

/**
 * IFileSystemService
 * Standard Interface for File System Operations.
 * Both "Cloud" (Legacy) and "Local" (New) services must implement this.
 */
export interface IFileSystemService {
    // Project Management
    createProject(name: string, location?: string): Promise<ProjectFile>;
    loadProject(pathOrId: string): Promise<ProjectFile>;
    saveProject(project: ProjectFile): Promise<boolean>;

    // Asset Management
    importPage(project: ProjectFile, filePath: string): Promise<ProjectPage>;
    deletePage(project: ProjectFile, pageId: string): Promise<boolean>;

    // Utilities
    getProjectLocation(project: ProjectFile): string; // URL (Cloud) or Path (Local)
}
