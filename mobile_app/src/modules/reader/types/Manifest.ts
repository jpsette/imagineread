import { Balloon, FocusPoint } from './index';

export interface ComicPageManifest {
    id: string;
    imageUri: string;
    width: number;
    height: number;
    // Decoupled layers
    layers: {
        balloons: Balloon[];
        focusPoints: FocusPoint[];
    };
}

export interface ComicManifest {
    version: string;
    id: string;
    metadata: {
        title: string;
        author: string;
        language: string;
        direction: 'ltr' | 'rtl';
    };
    pages: ComicPageManifest[];
}
