/**
 * Application Configuration
 * Centralized configuration for the Imagine Read application
 */

// API Configuration
export const API_BASE_URL = 'http://127.0.0.1:8000';

// API Endpoints
export const API_ENDPOINTS = {
    UPLOAD_PDF: `${API_BASE_URL}/upload_pdf`,
    THUMBNAIL: `${API_BASE_URL}/thumbnail`,
    ANALYZE_PAGE: `${API_BASE_URL}/analyze_page`,
    CLEAN_PAGE: `${API_BASE_URL}/clean_page`,
    ANALYZE_YOLO: `${API_BASE_URL}/analisar-yolo`,
    READ_TEXT: `${API_BASE_URL}/ler-texto`,
    CLEAN_IMAGE: `${API_BASE_URL}/limpar-imagem`,
    STORE: `${API_BASE_URL}/store`,
} as const;
