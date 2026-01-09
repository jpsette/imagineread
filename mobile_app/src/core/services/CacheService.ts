import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

// @ts-ignore
const CACHE_FOLDER = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + 'comics/';

export const CacheService = {
    // Initialize cache folder
    async ensureCacheDirectory() {
        const info = await FileSystem.getInfoAsync(CACHE_FOLDER);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true });
        }
    },

    // Get local path for a remote URL
    async getLocalPath(url: string): Promise<string> {
        // Hash the URL to get a unique filename
        const hash = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            url
        );
        return CACHE_FOLDER + hash + '.jpg'; // Assume JPG for now or parse ext
    },

    // Download and Cache
    async downloadAndCache(url: string): Promise<string> {
        await this.ensureCacheDirectory();

        const localUri = await this.getLocalPath(url);
        const info = await FileSystem.getInfoAsync(localUri);

        if (info.exists) {
            return localUri;
        }

        try {
            const result = await FileSystem.downloadAsync(url, localUri);
            return result.uri;
        } catch (error) {
            console.error('Download failed:', error);
            return url; // Fallback to remote if download fails
        }
    },

    // Prefetch multiple URLs
    async prefetch(urls: string[]) {
        try {
            await Promise.all(urls.map(url => this.downloadAndCache(url)));
        } catch (e) {
            console.warn('Prefetch error:', e);
        }
    }
};
