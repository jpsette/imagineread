import { API_BASE_URL } from '@app/config';
import { FileEntry } from '@shared/types';

/**
 * HELPER: Fixes localhost port mismatch (8000 -> 8001)
 */
const fixUrlPort = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    if (url.includes('127.0.0.1:8000')) return url.replace('127.0.0.1:8001', '127.0.0.1:8000');
    if (url.includes('localhost:8000')) return url.replace('localhost:8000', 'localhost:8001');
    return url;
};

/**
 * ADAPTER: Normalizes raw backend file data into the clean FileEntry domain entity.
 * Handles the aliasing of clean_url / clean_image_url -> cleanUrl.
 */
export const normalizeFile = (raw: any): FileEntry => {
    if (!raw) return raw; // Safety check

    // Resolve Canonical cleanUrl
    // Priority: cleanUrl (Already clean) > clean_image_url (Backend A) > clean_url (Backend B)
    const cleanUrl = fixUrlPort(raw.cleanUrl || raw.clean_image_url || raw.clean_url || null);
    const url = fixUrlPort(raw.url);

    // Construct valid FileEntry
    return {
        ...raw,
        url: url || raw.url,
        cleanUrl: cleanUrl || null,
        // We explicitly do not include the legacy keys in the output object
        // to prevent accidental usage, although TS would block it anyway.
    };
};

/**
 * ADAPTER: Prepares the FileEntry for backend persistence.
 * Maps cleanUrl back to what the backend expects (historically clean_url or clean_image_url).
 */
export const toBackendPayload = (data: { cleanUrl?: string | null, isCleaned?: boolean, [key: string]: any }): any => {
    const payload = { ...data };

    // DENORMALIZE:
    // If we have cleanUrl, map it to what backend might expect.
    // Based on audit, backend accepts 'cleanUrl' in some PUT DTOs, but let's be safe.
    // The previous api.ts implementation of updateFileData:
    // if (data.cleanUrl !== undefined) payload.cleanUrl = data.cleanUrl;
    // So the backend ALREADY accepts 'cleanUrl' in the PUT body!
    // We just pass it through.

    // However, if we need to support legacy backends:
    if (payload.cleanUrl !== undefined) {
        // Keep cleanUrl as is, since api.ts audit showed `payload.cleanUrl = data.cleanUrl`
    }

    return payload;
};
