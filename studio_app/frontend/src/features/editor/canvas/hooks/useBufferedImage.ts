import { useState, useEffect } from 'react';
import useImage from 'use-image';

/**
 * A wrapper around useImage that implements Double Buffering.
 * It holds the previous image on screen until the new image is fully loaded.
 */
export const useBufferedImage = (url: string, crossOrigin?: 'anonymous' | undefined) => {
    // 1. Fetch the new image (standard hook)
    const [img, status] = useImage(url, crossOrigin);

    // 2. Hold the "Stable" image in state
    const [stableImage, setStableImage] = useState<HTMLImageElement | undefined>(undefined);

    // 3. Only update the stable image when the new one is READY
    useEffect(() => {
        if (status === 'loaded' && img) {
            setStableImage(img);
        }
    }, [img, status]);

    // 4. Return the Stable Image (which might be the old one while loading)
    // We also return the live status so components can show spinners if needed
    return [stableImage, status] as const;
};
