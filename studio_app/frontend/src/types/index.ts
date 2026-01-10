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
    type: 'speech' | 'thought' | 'whisper';
    customFontSize?: number;
    borderRadius?: number;
    borderWidth?: number;
    tailWidth?: number;
    roughness?: number;
    tailTip?: { x: number, y: number } | null;
    tailCurve?: any;

    // Style Props
    color?: string;
    textColor?: string;
    fontFamily?: string;
    opacity?: number;
}

export interface DetectedBalloon {
    id?: number | string;
    box: number[]; // [x, y, w, h]
    text?: string;
    confidence?: number;
    class_id?: number;
    polygon?: number[][];
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
}

// API DTOs
export interface CreateProjectRequest {
    name: string;
    color: string;
}

export interface CreateFolderRequest {
    name: string;
    parentId: string;
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
