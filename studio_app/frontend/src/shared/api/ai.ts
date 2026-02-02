/**
 * AI API
 * 
 * API methods for AI-powered features: OCR, cleaning, detection.
 */

import { request, API_ENDPOINTS, normalizeMediaUrl } from './core';
import { Balloon, DetectedBalloon, OCRRequest, CleanRequest } from '@shared/types';

export interface CleanResponse {
    clean_image_url: string;
    debug_mask_url?: string;
}

export const aiApi = {
    async runOcr(imagePath: string, balloons: DetectedBalloon[]): Promise<{ balloons: DetectedBalloon[] }> {
        const actualPath = normalizeMediaUrl(imagePath);
        const payload: OCRRequest = { image_path: actualPath, balloons };

        return request<{ balloons: DetectedBalloon[] }>(`${API_ENDPOINTS.BASE_URL}/ler-texto`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    async cleanPage(imageUrl: string, balloons: Balloon[], fileId?: string): Promise<CleanResponse> {
        const actualUrl = normalizeMediaUrl(imageUrl);
        const payload: CleanRequest = {
            image_url: actualUrl,
            file_id: fileId,
            bubbles: balloons
        };

        return request<CleanResponse>(`${API_ENDPOINTS.BASE_URL}/clean_page`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    async detectBalloons(imagePath: string): Promise<{ balloons: DetectedBalloon[] }> {
        const actualPath = normalizeMediaUrl(imagePath);

        return request<{ balloons: DetectedBalloon[] }>(`${API_ENDPOINTS.BASE_URL}/analisar-yolo`, {
            method: 'POST',
            body: JSON.stringify({ image_path: actualPath })
        });
    },

    async detectPanels(imagePath: string): Promise<{ panels: any[] }> {
        const actualPath = normalizeMediaUrl(imagePath);

        return request<{ panels: any[] }>(`${API_ENDPOINTS.BASE_URL}/analisar-quadros`, {
            method: 'POST',
            body: JSON.stringify({ image_path: actualPath })
        });
    },

    async translateTexts(
        texts: string[],
        sourceLang: string,
        targetLang: string,
        context?: string,
        glossary?: { original: string; translation: string }[]
    ): Promise<{ status: string; translations: string[]; error?: string }> {
        return request<{ status: string; translations: string[]; error?: string }>(
            `${API_ENDPOINTS.BASE_URL}/traduzir`,
            {
                method: 'POST',
                body: JSON.stringify({
                    texts,
                    source_lang: sourceLang,
                    target_lang: targetLang,
                    context,
                    glossary
                })
            }
        );
    }
};
