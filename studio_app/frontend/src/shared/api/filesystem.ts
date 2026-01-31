/**
 * FileSystem API
 * 
 * API methods for file and folder management.
 */

import { request, API_ENDPOINTS } from './core';
import { normalizeFile, toBackendPayload } from './adapters';
import { FileEntry, Balloon, CreateFolderRequest } from '@shared/types';

export const filesystemApi = {
    async getFileSystem(parentId?: string | null): Promise<FileEntry[]> {
        const url = parentId
            ? `${API_ENDPOINTS.BASE_URL}/filesystem?parentId=${encodeURIComponent(parentId)}`
            : `${API_ENDPOINTS.BASE_URL}/filesystem`;

        const rawFiles = await request<any[]>(url);
        return rawFiles.map(normalizeFile);
    },

    async getFileSystemEntry(id: string): Promise<FileEntry> {
        const all = await this.getFileSystem();
        const found = all.find(f => f.id === id);
        if (!found) throw new Error("Entry not found");
        return found;
    },

    async getFile(fileId: string): Promise<FileEntry> {
        const rawFile = await request<any>(`${API_ENDPOINTS.BASE_URL}/files/${fileId}`);
        return normalizeFile(rawFile);
    },

    async updateFileData(fileId: string, data: { balloons?: Balloon[], panels?: any[], cleanUrl?: string, isCleaned?: boolean }): Promise<void> {
        const payload = toBackendPayload(data);
        return request<void>(`${API_ENDPOINTS.BASE_URL}/files/${fileId}/data`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
    },

    async updateFileBalloons(fileId: string, balloons: Balloon[]): Promise<void> {
        return this.updateFileData(fileId, { balloons });
    },

    async uploadPage(file: File, parentId: string): Promise<{ url: string, filename: string, id: string }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent_id', parentId);

        return request<{ url: string, filename: string, id: string }>(`${API_ENDPOINTS.BASE_URL}/upload_page`, {
            method: 'POST',
            body: formData
        });
    },

    async uploadPDF(file: File, parentId: string): Promise<{ pages: { id: string, url: string, name: string }[] }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parent_id', parentId);

        return request<{ pages: { id: string, url: string, name: string }[] }>(`${API_ENDPOINTS.BASE_URL}/upload_pdf`, {
            method: 'POST',
            body: formData
        });
    },

    async createFolder(data: CreateFolderRequest): Promise<FileEntry> {
        return request<FileEntry>(`${API_ENDPOINTS.BASE_URL}/folders`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async moveItem(itemId: string, newParentId: string): Promise<void> {
        return request<void>(`${API_ENDPOINTS.BASE_URL}/files/${itemId}/move`, {
            method: 'POST',
            body: JSON.stringify({ targetParentId: newParentId })
        });
    },

    async updateFileSystemEntry(itemId: string, updates: { name?: string, color?: string, isPinned?: boolean }): Promise<{ id: string, name: string, color?: string, isPinned?: boolean }> {
        return request<{ id: string, name: string, color?: string, isPinned?: boolean }>(`${API_ENDPOINTS.BASE_URL}/files/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    async renameFileSystemEntry(itemId: string, name: string, color?: string): Promise<{ id: string, name: string, color?: string }> {
        return this.updateFileSystemEntry(itemId, { name, color });
    },

    async reorderItems(orderedIds: string[]): Promise<void> {
        return request<void>(`${API_ENDPOINTS.BASE_URL}/files/reorder`, {
            method: 'POST',
            body: JSON.stringify({ orderedIds })
        });
    },

    async deleteFileSystemEntry(itemId: string): Promise<void> {
        return request<void>(`${API_ENDPOINTS.BASE_URL}/files/${itemId}`, {
            method: 'DELETE'
        });
    }
};
