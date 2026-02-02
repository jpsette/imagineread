/**
 * Mobile Export Utility
 * 
 * Exports project data to a format compatible with the ImagineRead iOS app.
 * Follows the schema defined in MOBILE_EXPORT_SPEC.md
 */

import { Balloon, Panel, FileEntry } from '@shared/types';

// ============================================================================
// Mobile Export Interfaces
// ============================================================================

export interface MobileExport {
    id: string;
    name: string;
    pages: MobilePage[];
    thumbnailUrl?: string;
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    description?: string;
}

export interface MobilePage {
    imageUrl: string;
    balloons: MobileBalloon[];
    panels: MobilePanel[];
    pageNumber?: number;
    originalSize?: { width: number; height: number };
}

export interface MobileBalloon {
    id: string;
    text: string;
    box2d: number[]; // [ymin, xmin, ymax, xmax]
    shape: string;
    type: string;
    points?: { x: number; y: number }[];
    vertexHandles?: {
        handleIn?: { x: number; y: number };
        handleOut?: { x: number; y: number };
    }[];
    tailTip?: { x: number; y: number };
    tailControl?: { x: number; y: number };
    tailCurve?: number;
    color?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    animationDelay?: number;
    animationDuration?: number;
    animationType?: string;
}

export interface MobilePanel {
    id: string;
    order: number;
    points: number[]; // [x1, y1, x2, y2, ...]
    box2d: number[];  // [ymin, xmin, ymax, xmax]
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert a Studio Balloon to Mobile format
 */
export function convertBalloon(b: Balloon, index: number): MobileBalloon {
    return {
        id: b.id,
        text: b.text || '',
        box2d: b.box_2d,
        shape: b.shape,
        type: b.type,

        // Geometry
        points: b.points?.map(p => ({ x: p.x, y: p.y })),
        vertexHandles: b.vertexHandles?.map(h => ({
            handleIn: h.handleIn ? { x: h.handleIn.x, y: h.handleIn.y } : undefined,
            handleOut: h.handleOut ? { x: h.handleOut.x, y: h.handleOut.y } : undefined,
        })),
        tailTip: b.tailTip ? { x: b.tailTip.x, y: b.tailTip.y } : undefined,
        tailControl: b.tailControl ? { x: b.tailControl.x, y: b.tailControl.y } : undefined,
        tailCurve: typeof b.tailCurve === 'number' ? b.tailCurve : undefined,

        // Style
        color: b.color,
        borderColor: b.borderColor,
        borderWidth: b.borderWidth,
        opacity: b.opacity,
        textColor: b.textColor,
        fontSize: b.fontSize,
        fontFamily: b.fontFamily,

        // Transform
        rotation: b.rotation,
        scaleX: b.scaleX,
        scaleY: b.scaleY,

        // Animation (auto-calculated based on balloon order)
        animationDelay: 0.3 * index,
        animationDuration: 0.4,
        animationType: 'fadeIn',
    };
}

/**
 * Convert a Studio Panel to Mobile format
 */
export function convertPanel(p: Panel): MobilePanel {
    return {
        id: p.id,
        order: p.order,
        points: p.points,
        box2d: p.box_2d,
    };
}

/**
 * Build the full Mobile Export structure from project data
 */
export function exportForMobile(
    projectId: string,
    projectName: string,
    pages: FileEntry[]
): MobileExport {
    const now = new Date().toISOString();

    return {
        id: projectId,
        name: projectName,
        createdAt: now,
        updatedAt: now,
        pages: pages
            .filter(f => f.type === 'file' && f.url)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((file, pageIndex) => ({
                // Use relative path for images in the ZIP
                imageUrl: `images/page_${String(pageIndex + 1).padStart(3, '0')}.png`,
                pageNumber: pageIndex,
                balloons: (file.balloons || []).map((b, i) => convertBalloon(b, i)),
                panels: (file.panels || []).map(convertPanel),
            })),
    };
}

/**
 * Get the list of image URLs to download for the export
 * Returns array of { url, filename } pairs
 */
export function getImageManifest(pages: FileEntry[]): { url: string; filename: string }[] {
    return pages
        .filter(f => f.type === 'file' && f.url)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((file, index) => ({
            url: file.cleanUrl || file.url,
            filename: `page_${String(index + 1).padStart(3, '0')}.png`,
        }));
}
