import { useState, useCallback } from 'react';

/**
 * Controller Hook for Editor Zoom & Pan
 * Responsibilities:
 * - Manages `zoom` level and `imgNaturalSize`
 * - Provides zoom in/out handlers
 * - Future: could handle Pan state if moved from Canvas to here
 */
export const useEditorZoom = () => {
    const [zoom, setZoom] = useState(1);
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

    const handleZoom = useCallback((delta: number) => {
        setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
    }, []);

    const resetZoom = useCallback(() => {
        setZoom(1);
    }, []);

    return {
        zoom,
        setZoom,
        imgNaturalSize,
        setImgNaturalSize,
        handleZoom,
        resetZoom
    };
};
