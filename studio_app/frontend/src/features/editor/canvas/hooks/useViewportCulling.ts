import { useMemo } from 'react';

/**
 * Bounds interface for items that can be culled
 */
export interface CullableBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Viewport state for culling calculations
 */
export interface ViewportState {
    x: number;      // Viewport X offset (from pan)
    y: number;      // Viewport Y offset (from pan)
    width: number;  // Container width
    height: number; // Container height
    scale: number;  // Zoom level
}

/**
 * Hook that filters items based on viewport visibility.
 * Only returns items that are currently visible on screen.
 * 
 * @param items - Array of items with bounds (x, y, width, height)
 * @param viewport - Current viewport state
 * @param padding - Extra pixels around viewport to preload (default 150)
 * @returns Filtered array of visible items
 * 
 * @example
 * const visibleBalloons = useViewportCulling(balloons, viewport, 100);
 */
export function useViewportCulling<T extends CullableBounds>(
    items: T[],
    viewport: ViewportState | null,
    padding = 150
): T[] {
    return useMemo(() => {
        // If no viewport info, return all items (fallback for initial render)
        if (!viewport || viewport.width === 0) {
            return items;
        }

        const { x: vpX, y: vpY, width, height, scale } = viewport;

        // Calculate visible bounds in canvas coordinates
        // We need to transform screen coordinates to canvas coordinates
        const vpLeft = -vpX / scale - padding;
        const vpRight = (-vpX + width) / scale + padding;
        const vpTop = -vpY / scale - padding;
        const vpBottom = (-vpY + height) / scale + padding;

        // Filter items that intersect with viewport
        return items.filter(item => {
            const itemRight = item.x + item.width;
            const itemBottom = item.y + item.height;

            // AABB intersection test
            return (
                itemRight > vpLeft &&
                item.x < vpRight &&
                itemBottom > vpTop &&
                item.y < vpBottom
            );
        });
    }, [items, viewport, padding]);
}

/**
 * Returns visibility stats for debugging
 */
export function useViewportStats<T extends CullableBounds>(
    items: T[],
    viewport: ViewportState | null,
    padding = 150
): { total: number; visible: number; culled: number } {
    const visible = useViewportCulling(items, viewport, padding);

    return useMemo(() => ({
        total: items.length,
        visible: visible.length,
        culled: items.length - visible.length
    }), [items.length, visible.length]);
}
