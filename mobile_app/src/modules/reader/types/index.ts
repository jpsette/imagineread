// Export legacy types if needed, or update them to map to Manifest
// For now, let's re-export specific sub-types or aliases to avoid breaking too many imports instantly, 
// OR we just deprecate them.

export type ReadingMode = 'vertical' | 'horizontal';

export interface Balloon {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type?: 'speech' | 'thought' | 'scream';
    tail?: {
        x: number;
        y: number;
    };
}

export interface FocusPoint {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'panel' | 'balloon';
    order?: number;
}

// Deprecating strict 'ComicPage' in favor of ComicPageManifest logic, 
// but for component compatibility we might keep a similar shape or alias it.
// To minimize refactors, we can alias ComicPage to ComicPageManifest (mostly)
// BUT ComicPageManifest has 'layers'. The old one had direct 'balloons' array.
// We must update components to access 'layers.balloons'.

export interface ComicPage {
    id: string;
    imageUrl: string; // The Manifest calls it imageUri. We need to unify.
    width: number;
    height: number;
    // Legacy support via mapping or strict update
    balloons: Balloon[];
    focusPoints?: FocusPoint[];
}

export interface ComicDetails {
    id: string;
    title: string;
    pages: ComicPage[];
}

export interface IReaderService {
    getComicDetails(id: string): Promise<any>; // Relaxed temporarily
}
