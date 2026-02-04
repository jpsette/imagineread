import { Balloon, Panel } from '@shared/types';

/**
 * Bounds extracted from any shape
 */
export interface ShapeBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Extracts bounds from a Balloon
 * Uses runtime x/y/width/height if available, otherwise falls back to box_2d
 */
export function getBalloonBounds(balloon: Balloon): ShapeBounds {
    // Prefer runtime Konva coordinates
    if (balloon.x !== undefined && balloon.y !== undefined &&
        balloon.width !== undefined && balloon.height !== undefined) {
        return {
            x: balloon.x,
            y: balloon.y,
            width: balloon.width,
            height: balloon.height
        };
    }

    // Fallback to box_2d [ymin, xmin, ymax, xmax]
    const [ymin, xmin, ymax, xmax] = balloon.box_2d;
    return {
        x: xmin,
        y: ymin,
        width: xmax - xmin,
        height: ymax - ymin
    };
}

/**
 * Extracts bounds from a Panel
 * Uses box_2d [top, left, bottom, right]
 */
export function getPanelBounds(panel: Panel): ShapeBounds {
    const [top, left, bottom, right] = panel.box_2d;
    return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
}

/**
 * Generic bounds extractor that works with either Balloon or Panel
 */
export function getShapeBounds(shape: Balloon | Panel): ShapeBounds {
    if ('type' in shape && shape.type === 'panel') {
        return getPanelBounds(shape as Panel);
    }
    return getBalloonBounds(shape as Balloon);
}
