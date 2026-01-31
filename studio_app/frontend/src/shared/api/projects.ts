/**
 * Projects API
 * 
 * API methods for project management.
 */

import { request, API_ENDPOINTS } from './core';
import { Project, CreateProjectRequest } from '@shared/types';

export const projectsApi = {
    async getAll(): Promise<Project[]> {
        return request<Project[]>(`${API_ENDPOINTS.BASE_URL}/projects`);
    },

    async create(data: CreateProjectRequest): Promise<Project> {
        return request<Project>(`${API_ENDPOINTS.BASE_URL}/projects`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async delete(id: string): Promise<void> {
        return request<void>(`${API_ENDPOINTS.BASE_URL}/projects/${id}`, {
            method: 'DELETE'
        });
    },

    async update(id: string, data: Partial<Project>): Promise<Project> {
        return request<Project>(`${API_ENDPOINTS.BASE_URL}/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
};
