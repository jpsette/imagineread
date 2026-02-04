import RBush from 'rbush';
import { Balloon, Panel } from '@shared/types';
import { getBalloonBounds, getPanelBounds, ShapeBounds } from './boundsUtils';

/**
 * Item stored in the spatial index
 */
export interface SpatialItem {
    id: string;
    type: 'balloon' | 'panel';
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/**
 * Custom RBush class with proper toBBox implementation.
 * This fixes the "Comparator is not a function" error.
 */
class SpatialRBush extends RBush<SpatialItem> {
    toBBox(item: SpatialItem) {
        return {
            minX: item.minX,
            minY: item.minY,
            maxX: item.maxX,
            maxY: item.maxY
        };
    }

    compareMinX(a: SpatialItem, b: SpatialItem) {
        return a.minX - b.minX;
    }

    compareMinY(a: SpatialItem, b: SpatialItem) {
        return a.minY - b.minY;
    }
}

/**
 * Create an RBush-compatible spatial index for balloons and panels.
 * 
 * R-tree provides O(log n) spatial queries instead of O(n) iteration,
 * which is crucial for hit testing when you have many shapes.
 * 
 * @example
 * const index = createSpatialIndex(balloons, panels);
 * const hitsAtPoint = index.search({
 *   minX: clickX, minY: clickY,
 *   maxX: clickX, maxY: clickY
 * });
 */
export function createSpatialIndex(
    balloons: Balloon[],
    panels: Panel[]
): RBush<SpatialItem> {
    const tree = new SpatialRBush();

    // Index all balloons
    const balloonItems: SpatialItem[] = balloons.map(balloon => {
        const bounds = getBalloonBounds(balloon);
        return {
            id: balloon.id,
            type: 'balloon' as const,
            minX: bounds.x,
            minY: bounds.y,
            maxX: bounds.x + bounds.width,
            maxY: bounds.y + bounds.height
        };
    });

    // Index all panels
    const panelItems: SpatialItem[] = panels.map(panel => {
        const bounds = getPanelBounds(panel);
        return {
            id: panel.id,
            type: 'panel' as const,
            minX: bounds.x,
            minY: bounds.y,
            maxX: bounds.x + bounds.width,
            maxY: bounds.y + bounds.height
        };
    });

    // Bulk load for better performance
    tree.load([...balloonItems, ...panelItems]);

    return tree;
}

/**
 * Query items at a specific point (for click detection)
 */
export function queryAtPoint(
    tree: RBush<SpatialItem>,
    x: number,
    y: number
): SpatialItem[] {
    return tree.search({
        minX: x,
        minY: y,
        maxX: x,
        maxY: y
    });
}

/**
 * Query items within a rectangular region (for box selection)
 */
export function queryInRect(
    tree: RBush<SpatialItem>,
    x: number,
    y: number,
    width: number,
    height: number
): SpatialItem[] {
    return tree.search({
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height
    });
}

/**
 * Helper to convert bounds to RBush box format
 */
export function boundsToBox(bounds: ShapeBounds) {
    return {
        minX: bounds.x,
        minY: bounds.y,
        maxX: bounds.x + bounds.width,
        maxY: bounds.y + bounds.height
    };
}
