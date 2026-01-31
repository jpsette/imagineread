/**
 * API Core
 * 
 * Base request function and shared utilities for all API modules.
 */

import { API_ENDPOINTS } from '@app/config';

export { API_ENDPOINTS };

/**
 * Base request function with error handling and caching policies.
 */
export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {};

    // Only add Content-Type if NOT FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        cache: 'no-store' as RequestCache,
        headers: {
            ...headers,
            ...options.headers,
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
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

/**
 * Helper to extract actual filesystem path from media:// URLs.
 */
export function normalizeMediaUrl(url: string): string {
    if (url.startsWith('media://')) {
        return '/' + decodeURIComponent(url.replace('media://', ''));
    }
    return url;
}
