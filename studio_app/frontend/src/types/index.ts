export interface Project {
    id: string;
    name: string;
    color: string;
    rootFolderId?: string;
    createdAt: string;
    lastModified: string;
    isPinned: boolean;
}

export interface Balloon {
    id: string;
    text: string;
    box_2d: number[]; // [ymin, xmin, ymax, xmax]
    shape: 'rectangle' | 'ellipse' | 'cloud' | 'scream';
    type: 'speech' | 'thought' | 'whisper' | 'text' | 'shape' | 'mask' | 'balloon' | 'balloon-square' | 'balloon-circle' | 'balloon-thought' | 'balloon-shout';
    customFontSize?: number;
    fontSize?: number;
    borderRadius?: number;
    borderWidth?: number;
    tailWidth?: number;
    roughness?: number;
    tailTip?: { x: number, y: number } | null;
    tailControl?: { x: number, y: number } | null;
    tailCurve?: any; // Deprecated or for older format compatibility
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
    type: 'file' | 'folder' | 'comic';
    url: string;
    cleanUrl?: string | null;
    isCleaned?: boolean;
    balloons?: Balloon[] | null;
    order?: number;
    isPinned?: boolean;
    createdAt?: string;
    color?: string;
    mimeType?: string;
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
