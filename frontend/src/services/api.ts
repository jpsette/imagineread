import { API_ENDPOINTS } from '../config';
import {
    Project,
    FileEntry,
    Balloon,
    CreateProjectRequest,
    FileUpdateData,
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
            headers: {
                ...headers,
                ...options.headers,
            },
        };

        try {
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
    async getFileSystem(): Promise<FileEntry[]> {
        return this.request<FileEntry[]>(`${API_ENDPOINTS.BASE_URL}/filesystem`);
    }

    async updateFileBalloons(fileId: string, balloons: Balloon[]): Promise<any> {
        const payload: FileUpdateData = { balloons };
        return this.request(`${API_ENDPOINTS.BASE_URL}/files/${fileId}/data`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    }

    async uploadPage(file: File, parentId: string): Promise<{ url: string, filename: string }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent_id', parentId);

        return this.request<{ url: string, filename: string }>(`${API_ENDPOINTS.BASE_URL}/upload_page`, {
            method: 'POST',
            body: formData
        });
    }

    async uploadPDF(file: File, parentId: string): Promise<{ pages: string[] }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent_id', parentId);

        return this.request<{ pages: string[] }>(`${API_ENDPOINTS.BASE_URL}/upload_pdf`, {
            method: 'POST',
            body: formData
        });
    }

    // --- AI & Tools (MATCHING LEGACY BACKEND ROUTES) ---

    async runOcr(imagePath: string, balloons: DetectedBalloon[]): Promise<{ balloons: DetectedBalloon[] }> {
        const payload: OCRRequest = { image_path: imagePath, balloons };
        // FIX: Route is /ler-texto
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
        // FIX: Route is /clean_page
        return this.request<CleanResponse>(`${API_ENDPOINTS.BASE_URL}/clean_page`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async detectBalloons(imagePath: string): Promise<{ balloons: DetectedBalloon[] }> {
        // FIX: Route is /analisar-yolo
        return this.request<{ balloons: DetectedBalloon[] }>(`${API_ENDPOINTS.BASE_URL}/analisar-yolo`, {
            method: 'POST',
            body: JSON.stringify({ image_path: imagePath })
        });
    }
}

export const api = new ApiClient();
