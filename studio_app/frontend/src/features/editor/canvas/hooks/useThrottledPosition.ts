import { useState, useRef, useEffect } from 'react';

/**
 * Throttles position updates to reduce re-renders during pan/zoom.
 * 
 * This hook limits how often position updates propagate to child components,
 * which is critical for performance when panning/zooming the canvas.
 * 
 * @param position - Current position { x, y }
 * @param delay - Minimum ms between updates (default 16ms = ~60fps)
 * @returns Throttled position that updates at most every `delay` ms
 * 
 * @example
 * const throttledPos = useThrottledPosition(position, 16);
 * // Pass throttledPos to non-critical child components
 */
export function useThrottledPosition(
    position: { x: number; y: number },
    delay = 16
): { x: number; y: number } {
    const [throttled, setThrottled] = useState(position);
    const lastUpdate = useRef(0);
    const pendingUpdate = useRef<number | null>(null);

    useEffect(() => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdate.current;

        // If enough time has passed, update immediately
        if (timeSinceLastUpdate >= delay) {
            setThrottled(position);
            lastUpdate.current = now;
            return;
        }

        // Otherwise, schedule an update for when the delay expires
        if (pendingUpdate.current) {
            cancelAnimationFrame(pendingUpdate.current);
        }

        pendingUpdate.current = requestAnimationFrame(() => {
            setThrottled(position);
            lastUpdate.current = Date.now();
            pendingUpdate.current = null;
        });

        return () => {
            if (pendingUpdate.current) {
                cancelAnimationFrame(pendingUpdate.current);
            }
        };
    }, [position.x, position.y, delay]);

    return throttled;
}

/**
 * Throttles scale updates with similar logic.
 * Useful for zoom operations.
 */
export function useThrottledScale(
    scale: number,
    delay = 16
): number {
    const [throttled, setThrottled] = useState(scale);
    const lastUpdate = useRef(0);
    const pendingUpdate = useRef<number | null>(null);

    useEffect(() => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdate.current;

        if (timeSinceLastUpdate >= delay) {
            setThrottled(scale);
            lastUpdate.current = now;
            return;
        }

        if (pendingUpdate.current) {
            cancelAnimationFrame(pendingUpdate.current);
        }

        pendingUpdate.current = requestAnimationFrame(() => {
            setThrottled(scale);
            lastUpdate.current = Date.now();
            pendingUpdate.current = null;
        });

        return () => {
            if (pendingUpdate.current) {
                cancelAnimationFrame(pendingUpdate.current);
            }
        };
    }, [scale, delay]);

    return throttled;
}
