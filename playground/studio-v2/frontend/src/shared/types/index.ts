export interface Project {
    id: string;
    name: string;
    color: string;
    rootFolderId?: string;
    createdAt: string;
    lastModified: string;
    isPinned: boolean;
    localPath?: string; // Phase 1: Persistence
}

// Editor Types
export type EditorMode = 'vectorize' | 'edit' | 'translate' | 'animate';
export type EditorTool = 'select' | 'text' | 'balloon-square' | 'balloon-circle' | 'balloon-thought' | 'balloon-shout';

export interface Balloon {
    id: string;
    text: string;
    box_2d: number[]; // [ymin, xmin, ymax, xmax]
    shape: 'rectangle' | 'ellipse' | 'cloud' | 'scream';
    // Payload for Polygon Logic
    detectedPolygon?: number[][]; // [ [x,y], [x,y] ] for reconstruction

    type: 'speech' | 'thought' | 'whisper' | 'text' | 'shape' | 'mask' | 'balloon' | 'balloon-square' | 'balloon-circle' | 'balloon-thought' | 'balloon-shout' | 'balloon-custom';
    // Custom SVG Payload
    customSvg?: string; // Path data (d attribute)
    svgViewBox?: { width: number, height: number }; // Original dimensions for scaling

    customFontSize?: number;
    fontSize?: number;
    borderRadius?: number;
    borderWidth?: number;
    tailWidth?: number;
    roughness?: number;
    tailTip?: { x: number, y: number } | null;
    tailControl?: { x: number, y: number } | null;
    tailCurve?: string | null;
    points?: { x: number, y: number }[]; // For freeform vertex editing

    // Style Props
    color?: string; // Fill color
    borderColor?: string; // Stroke color
    textColor?: string;
    fontFamily?: string;
    fontStyle?: string;   // 'bold', 'italic', 'italic bold', 'normal'
    textDecoration?: string; // 'underline', 'line-through', ''
    opacity?: number;
    html?: string; // For rich text content
    rotation?: number;
    direction?: string;
    tail_box_2d?: number[];

    // Konva Spatial Props (Optional, present during runtime editing)
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;

    // Index signature for Konva extensibility / legacy props
    [key: string]: unknown;
}

export interface DetectedBalloon {
    id?: number | string;
    box: number[]; // [x, y, w, h]
    text?: string;
    confidence?: number;
    class_id?: number;
    polygon?: number[][];
}

export interface Panel {
    id: string;
    type: 'panel';
    order: number;
    points: number[]; // [x1, y1, x2, y2...] representing polygon
    box_2d: [number, number, number, number]; // [top, left, bottom, right]
}

export interface FileEntry {
    id: string;
    parentId: string | null;
    projectId?: string;
    name: string;
    type: 'file' | 'folder' | 'comic' | 'project';
    url: string;

    // Canonical Properties (ADAPTED)
    cleanUrl?: string | null;
    // REMOVED LEGACY ALIASES: clean_image_url, clean_url

    isCleaned?: boolean;
    balloons?: Balloon[] | null;
    panels?: Panel[] | null;
    order?: number;
    isPinned?: boolean;
    createdAt?: string;
    color?: string;
    mimeType?: string;
    // Backend Enrichment
    isComic?: boolean;
    coverUrl?: string;
}

// API DTOs
export interface CreateProjectRequest {
    name: string;
    color: string;
}

export interface CreateFolderRequest {
    name: string;
    parentId: string;
    color?: string;
}

export interface FileUpdateData {
    balloons: Balloon[];
    panels?: Panel[];
    cleanUrl?: string; // Unified Persistence
    isCleaned?: boolean;
}

export interface OCRRequest {
    image_path: string;
    balloons: DetectedBalloon[];
}

export interface CleanRequest {
    image_url: string;
    file_id?: string;
    bubbles: Balloon[];
}

// --- ELECTRON GLOBAL TYPE ---
export interface ElectronLocal {
    selectDirectory: () => Promise<string | null>;
    writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
    readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    createDirectory: (path: string) => Promise<{ success: boolean; error?: string }>;
    readDirectory: (path: string) => Promise<{ success: boolean; files?: { name: string, isDirectory: boolean }[]; error?: string }>;
}

export interface ElectronAPI {
    getProjects: () => Promise<Project[]>;
    createProject: (data: any) => Promise<any>;
    updateProject: (id: string, data: any) => Promise<any>;
    deleteProject: (id: string) => Promise<any>;
    getFileSystem: () => Promise<FileEntry[]>;
    uploadPdf: (projectId: string, filePath: string) => Promise<any>;

    // Phase 1: Local Bridge
    local: ElectronLocal;

    platform: string;
    versions: any;
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}
