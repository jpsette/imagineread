import { ComicManifest, ComicPageManifest } from '../types/Manifest';

export class ManifestAdapter {
    static parse(json: any): ComicManifest {
        // 1. Basic Structure Check
        if (!json || typeof json !== 'object') {
            throw new Error("Invalid Manifest: Root must be an object.");
        }

        // 2. Version Check
        if (json.version !== "1.0") {
            // In future, handle migration here. For now, strict check.
            // console.warn("Unknown version, attempting to parse as 1.0"); 
        }

        // 3. Metadata Validation
        if (!json.metadata || !json.metadata.title) {
            throw new Error("Invalid Manifest: Missing metadata.");
        }

        // 4. Pages Normalization
        const pages: ComicPageManifest[] = (json.pages || []).map((p: any, index: number) => ({
            id: p.id || `page-${index}`,
            imageUri: p.imageUri || p.url || '', // Fallback for legacy fields
            width: Number(p.width) || 1000,
            height: Number(p.height) || 1500,
            layers: {
                balloons: Array.isArray(p.layers?.balloons) ? p.layers.balloons : (p.balloons || []), // Fallback for flat structure
                focusPoints: Array.isArray(p.layers?.focusPoints) ? p.layers.focusPoints : (p.focusPoints || [])
            }
        }));

        if (pages.length === 0) {
            throw new Error("Invalid Manifest: No pages found.");
        }

        return {
            version: "1.0",
            id: json.id || "unknown",
            metadata: {
                title: json.metadata.title,
                author: json.metadata.author || "Unknown",
                language: json.metadata.language || "en",
                direction: json.metadata.direction === 'rtl' ? 'rtl' : 'ltr'
            },
            pages
        };
    }
}
