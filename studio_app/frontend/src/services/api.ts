import { API_ENDPOINTS } from '../config';
import { normalizeFile, toBackendPayload } from './adapters';
import {
    Project,
    FileEntry,
    Balloon,
    CreateProjectRequest,
    CreateFolderRequest,

    OCRRequest,
    CleanRequest,
    DetectedBalloon
} from '../types';

export interface CleanResponse {
    clean_image_url: string;
    debug_mask_url?: string;
}

class ApiClient {

    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {};

        // Only add Content-Type if NOT FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            cache: 'no-store' as RequestCache, // FORCE FRESH DATA
            headers: {
                ...headers,
                ...options.headers,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
        };

        try {
            console.log(`🌐 [API] Request: ${options.method || 'GET'} ${url}`);
            const response = await fetch(url, config);

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const msg = typeof data === 'object' && data.detail ? data.detail :
                    (data.message || `API Error: ${response.status}`);
                throw new Error(msg);
            }

            return data as T;
        } catch (error: any) {
            console.error(`API Request Failed: [${options.method || 'GET'} ${url}]`, error);
            throw error;
        }
    }

    // --- Projects ---
    async getProjects(): Promise<Project[]> {
        return this.request<Project[]>(`${API_ENDPOINTS.BASE_URL}/projects`);
    }

    async createProject(data: CreateProjectRequest): Promise<Project> {
        return this.request<Project>(`${API_ENDPOINTS.BASE_URL}/projects`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async deleteProject(id: string): Promise<void> {
        return this.request<void>(`${API_ENDPOINTS.BASE_URL}/projects/${id}`, {
            method: 'DELETE'
        });
    }

    async updateProject(id: string, data: Partial<Project>): Promise<Project> {
        return this.request<Project>(`${API_ENDPOINTS.BASE_URL}/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // --- Files (FileSystem) ---
    async getFileSystem(parentId?: string | null): Promise<FileEntry[]> {
        const url = parentId
            ? `${API_ENDPOINTS.BASE_URL}/filesystem?parentId=${parentId}`
            : `${API_ENDPOINTS.BASE_URL}/filesystem`;

        const rawFiles = await this.request<any[]>(url);
        return rawFiles.map(normalizeFile); // ADAPTER APPLIED
    }

    async getFileSystemEntry(id: string): Promise<FileEntry> {
        // Fallback: Backend doesn't support single entry fetch yet (404 on /filesystem/:id)
        // We fetch all and find it.
        const all = await this.getFileSystem();
        const found = all.find(f => f.id === id);
        if (!found) throw new Error("Entry not found");
        return found;
    }

    async getFile(fileId: string): Promise<FileEntry> {
        const rawFile = await this.request<any>(`${API_ENDPOINTS.BASE_URL}/files/${fileId}`);
        return normalizeFile(rawFile); // ADAPTER APPLIED
    }

    async updateFileData(fileId: string, data: { balloons?: Balloon[], panels?: any[], cleanUrl?: string, isCleaned?: boolean }): Promise<void> {
        // Use Adapter to ensure payload matches backend expectations
        const payload = toBackendPayload(data);

        console.log(`🌐 [API] Enviando PUT para: ${API_ENDPOINTS.BASE_URL}/files/${fileId}/data`);
        console.log("📦 [API] Payload:", payload);

        return this.request<void>(`${API_ENDPOINTS.BASE_URL}/files/${fileId}/data`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    // Deprecated wrapper for backward compatibility if needed, but better to update calls
    async updateFileBalloons(fileId: string, balloons: Balloon[]): Promise<void> {
        return this.updateFileData(fileId, { balloons });
    }

    async uploadPage(file: File, parentId: string): Promise<{ url: string, filename: string, id: string }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent_id', parentId);

        return this.request<{ url: string, filename: string, id: string }>(`${API_ENDPOINTS.BASE_URL}/upload_page`, {
            method: 'POST',
            body: formData
        });
    }

    async uploadPDF(file: File, parentId: string): Promise<{ pages: { id: string, url: string, name: string }[] }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent_id', parentId);

        return this.request<{ pages: { id: string, url: string, name: string }[] }>(`${API_ENDPOINTS.BASE_URL}/upload_pdf`, {
            method: 'POST',
            body: formData
        });
    }

    // --- AI & Tools (MATCHING LEGACY BACKEND ROUTES) ---

    async runOcr(imagePath: string, balloons: DetectedBalloon[]): Promise<{ balloons: DetectedBalloon[] }> {
        const payload: OCRRequest = { image_path: imagePath, balloons };
        return this.request<{ balloons: DetectedBalloon[] }>(`${API_ENDPOINTS.BASE_URL}/ler-texto`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async cleanPage(imageUrl: string, balloons: Balloon[], fileId?: string): Promise<CleanResponse> {
        const payload: CleanRequest = {
            image_url: imageUrl,
            file_id: fileId,
            bubbles: balloons
        };
        return this.request<CleanResponse>(`${API_ENDPOINTS.BASE_URL}/clean_page`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async detectBalloons(imagePath: string): Promise<{ balloons: DetectedBalloon[] }> {
        return this.request<{ balloons: DetectedBalloon[] }>(`${API_ENDPOINTS.BASE_URL}/analisar-yolo`, {
            method: 'POST',
            body: JSON.stringify({ image_path: imagePath })
        });
    }

    async detectPanels(imagePath: string): Promise<{ panels: any[] }> {
        return this.request<{ panels: any[] }>(`${API_ENDPOINTS.BASE_URL}/analisar-quadros`, {
            method: 'POST',
            body: JSON.stringify({ image_path: imagePath })
        });
    }

    async createFolder(data: CreateFolderRequest): Promise<FileEntry> {
        // Backend returns the created folder entry, or should.
        // If backend returns just {id, name}, we need to adapt or type strictly.
        // Assuming partial FileEntry for now if strict mismatch, but goal is strict.
        // Let's type as generic T matching FileEntry structure or specific DTO.
        // Based on original code: return this.request<{ id: string, name: string }>
        // If it creates a folder, it should return representation.
        // Let's blindly trust it returns FileEntry or compatible.
        return this.request<FileEntry>(`${API_ENDPOINTS.BASE_URL}/folders`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async moveItem(itemId: string, newParentId: string): Promise<void> {
        return this.request<void>(`${API_ENDPOINTS.BASE_URL}/files/${itemId}/move`, {
            method: 'POST',
            body: JSON.stringify({ targetParentId: newParentId })
        });
    }

    async updateFileSystemEntry(itemId: string, updates: { name?: string, color?: string, isPinned?: boolean }): Promise<{ id: string, name: string, color?: string, isPinned?: boolean }> {
        return this.request<{ id: string, name: string, color?: string, isPinned?: boolean }>(`${API_ENDPOINTS.BASE_URL}/files/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async renameFileSystemEntry(itemId: string, name: string, color?: string): Promise<{ id: string, name: string, color?: string }> {
        return this.updateFileSystemEntry(itemId, { name, color });
    }


    async reorderItems(orderedIds: string[]): Promise<void> {
        return this.request<void>(`${API_ENDPOINTS.BASE_URL}/files/reorder`, {
            method: 'POST',
            body: JSON.stringify({ orderedIds })
        });
    }

    async deleteFileSystemEntry(itemId: string): Promise<void> {
        return this.request<void>(`${API_ENDPOINTS.BASE_URL}/files/${itemId}`, {
            method: 'DELETE'
        });
    }
}

export const api = new ApiClient();
