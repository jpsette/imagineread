/**
 * Application Configuration
 * Centralized configuration for the Imagine Read application
 */

// API Configuration
export const API_BASE_URL = 'http://127.0.0.1:8000';

// API Endpoints
export const API_ENDPOINTS = {
    BASE_URL: API_BASE_URL,
    // Project Management
    PROJECTS: `${API_BASE_URL}/projects`,
    PROJECT_DETAIL: (id: string) => `${API_BASE_URL}/projects/${id}`,

    // File System & Resources
    FILES: `${API_BASE_URL}/files`,
    FILE_DETAIL: (id: string) => `${API_BASE_URL}/files/${id}`,
    FILE_DATA: (id: string) => `${API_BASE_URL}/files/${id}/data`, // For saving balloons
    UPLOAD_PDF: `${API_BASE_URL}/upload_pdf`,
    UPLOAD_PAGE: `${API_BASE_URL}/upload_page`,

    // AI Services
    AI: {
        ANALYZE_YOLO: `${API_BASE_URL}/analisar-yolo`, // Keeping legacy name to match backend for now
        OCR: `${API_BASE_URL}/ler-texto`,              // keeping legacy name
        CLEAN: `${API_BASE_URL}/clean_page`,
        ANALYZE_PAGE: `${API_BASE_URL}/analyze_page`
    }
} as const;
