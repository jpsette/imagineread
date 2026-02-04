import { useMemo } from 'react';
import { Balloon, Panel } from '@shared/types';
import { createSpatialIndex, queryAtPoint, queryInRect, SpatialItem } from '../utils/SpatialIndex';
import RBush from 'rbush';

/**
 * React hook that creates and maintains a spatial index for efficient hit testing.
 * 
 * The index is rebuilt when balloons or panels change. For very frequent updates,
 * consider using a debounced version or updating only on stable state.
 * 
 * @param balloons - Array of balloons to index
 * @param panels - Array of panels to index
 * @returns Object with query methods
 * 
 * @example
 * const { queryPoint, queryRect, tree } = useSpatialIndex(balloons, panels);
 * 
 * const handleClick = (x: number, y: number) => {
 *   const hits = queryPoint(x, y);
 *   if (hits.length > 0) {
 *     selectItem(hits[0].id);
 *   }
 * };
 */
export function useSpatialIndex(balloons: Balloon[], panels: Panel[]) {
    // Memoize the tree to avoid rebuilding on every render
    const tree = useMemo(() => {
        return createSpatialIndex(balloons, panels);
    }, [balloons, panels]);

    // Memoized query functions
    const queryPoint = useMemo(() => {
        return (x: number, y: number): SpatialItem[] => queryAtPoint(tree, x, y);
    }, [tree]);

    const queryRect = useMemo(() => {
        return (x: number, y: number, width: number, height: number): SpatialItem[] =>
            queryInRect(tree, x, y, width, height);
    }, [tree]);

    return {
        tree,
        queryPoint,
        queryRect,

        /**
         * Get all items in the spatial index
         */
        getAll: () => tree.all(),

        /**
         * Check if a point hits any item
         */
        hasHitAt: (x: number, y: number) => queryPoint(x, y).length > 0,

        /**
         * Get the topmost item at a point (last in the array = highest z-index)
         */
        getTopItemAt: (x: number, y: number): SpatialItem | null => {
            const hits = queryPoint(x, y);
            return hits.length > 0 ? hits[hits.length - 1] : null;
        }
    };
}

/**
 * Hook to query just balloons at a point
 */
export function useBalloonHitTest(balloons: Balloon[]) {
    const tree = useMemo(() => {
        // Create custom RBush with proper methods to avoid "Comparator is not a function" error
        class BalloonRBush extends RBush<SpatialItem> {
            toBBox(item: SpatialItem) {
                return { minX: item.minX, minY: item.minY, maxX: item.maxX, maxY: item.maxY };
            }
            compareMinX(a: SpatialItem, b: SpatialItem) { return a.minX - b.minX; }
            compareMinY(a: SpatialItem, b: SpatialItem) { return a.minY - b.minY; }
        }

        const rbush = new BalloonRBush();
        const items: SpatialItem[] = balloons.map(b => {
            // Use box_2d for bounds
            const [ymin, xmin, ymax, xmax] = b.box_2d;
            return {
                id: b.id,
                type: 'balloon' as const,
                minX: b.x ?? xmin,
                minY: b.y ?? ymin,
                maxX: (b.x ?? xmin) + (b.width ?? (xmax - xmin)),
                maxY: (b.y ?? ymin) + (b.height ?? (ymax - ymin))
            };
        });
        rbush.load(items);
        return rbush;
    }, [balloons]);

    return {
        queryPoint: (x: number, y: number) => tree.search({ minX: x, minY: y, maxX: x, maxY: y }),
        queryRect: (x: number, y: number, w: number, h: number) =>
            tree.search({ minX: x, minY: y, maxX: x + w, maxY: y + h })
    };
}
