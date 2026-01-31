import { Balloon, Panel } from './index';

/**
 * .irproject File Schema
 * This is the "Brain" of a local project.
 * It replaces the SQL Database for project metadata.
 */
export interface ProjectFile {
    version: number; // For future migrations (e.g. 1)
    meta: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        author?: string;
        color?: string; // New: Persist folder color
    };
    // Structure
    pages: ProjectPage[];

    // Global Settings
    settings: {
        language: string;
        exportFormat: 'pdf' | 'cbz' | 'images';
    };
}

export interface ProjectPage {
    id: string;
    filename: string; // "page_01.jpg" (Relative to /assets/pages)
    order: number;
    isCleaned: boolean;
    cleanFilename?: string; // "page_01_clean.jpg" (Relative to /assets/processed)

    // The "State" of the page
    balloons: Balloon[];
    panels: Panel[];

    // Dimensions for rendering
    width: number;
    height: number;
}
