/**
 * Balloon Detection Utilities
 * 
 * Pure utility functions for balloon detection and processing.
 * Extracted from useBalloonDetection hook for better maintainability and testability.
 */

import { Balloon } from '@shared/types';

// ============================================================
// TYPES
// ============================================================

export interface ImageSize {
    w: number;
    h: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface RawBalloonData {
    box?: number[];
    box_2d?: number[];
    bbox?: number[];
    polygon?: number[][];
    text?: string;
}

// ============================================================
// COORDINATE CONVERSION
// ============================================================

/**
 * Convert raw balloon data from API to normalized Balloon masks.
 * Handles both normalized (0-1) and absolute coordinate systems.
 */
export function convertRawBalloonToMask(
    raw: RawBalloonData,
    index: number,
    imageSize: ImageSize
): Balloon | null {
    const rawBox = raw.box || raw.box_2d || raw.bbox;
    if (!Array.isArray(rawBox) || rawBox.length < 4) return null;

    const [v1, v2, v3, v4] = rawBox.map(Number);
    const safeW = imageSize.w || 1000;
    const safeH = imageSize.h || 1000;

    let x: number, y: number, width: number, height: number;
    let isNormalized = false;

    // Check if normalized (0-1)
    if (v1 < 1 && v2 < 1 && v3 < 1 && v4 < 1) {
        isNormalized = true;
        x = v2 * safeW;
        y = v1 * safeH;
        width = (v4 - v2) * safeW;
        height = (v3 - v1) * safeH;
    } else {
        x = v1; y = v2; width = v3; height = v4;
    }

    // Process polygon (scale if normalized)
    let processedPolygon = raw.polygon;
    if (processedPolygon && isNormalized) {
        processedPolygon = processedPolygon.map((p: number[]) => [
            p[0] * safeW,
            p[1] * safeH
        ]);
    }

    return {
        id: `mask-${Date.now()}-${index}`,
        type: 'mask',
        text: raw.text || '',
        box_2d: [y, x, y + height, x + width],
        shape: 'rectangle',
        color: 'rgba(255, 0, 0, 0.4)',
        borderColor: 'red',
        borderWidth: 2,
        borderRadius: 4,
        opacity: 1,
        detectedPolygon: processedPolygon
    } as Balloon;
}

// ============================================================
// GEOMETRY CALCULATIONS
// ============================================================

/**
 * Calculate polygon area using Shoelace formula.
 */
export function calculatePolygonArea(points: Point[]): number {
    if (!points || points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
}

/**
 * Calculate bounding box dimensions from box_2d format [y1, x1, y2, x2].
 */
export function getBoxDimensions(box_2d: number[]): { width: number; height: number } {
    const width = box_2d[3] - box_2d[1];
    const height = box_2d[2] - box_2d[0];
    return { width, height };
}

/**
 * Calculate fill ratio (polygon area / bounding box area).
 * Used to infer balloon shape type.
 */
export function calculateFillRatio(polygonPoints: Point[], box_2d: number[]): number {
    const polygonArea = calculatePolygonArea(polygonPoints);
    const { width, height } = getBoxDimensions(box_2d);
    const boxArea = width * height;

    if (boxArea <= 0) return 0.8; // Default fallback
    return polygonArea / boxArea;
}

// ============================================================
// SHAPE INFERENCE
// ============================================================

/**
 * Infer balloon shape type based on fill ratio.
 * > 0.79 -> Square/Rect
 * <= 0.79 -> Circle/Oval
 */
export function inferBalloonType(fillRatio: number): string {
    return fillRatio > 0.79 ? 'balloon-square' : 'balloon-circle';
}

/**
 * Calculate dynamic border radius based on shape characteristics.
 */
export function calculateDynamicRadius(
    polygonPoints: Point[] | undefined,
    box_2d: number[]
): number {
    const { width, height } = getBoxDimensions(box_2d);
    const minDim = Math.min(width, height);
    let dynamicRadius = 10;

    if (polygonPoints && polygonPoints.length > 4) {
        const ratio = calculateFillRatio(polygonPoints, box_2d);

        if (ratio > 0.88) {
            // Sharp Box
            dynamicRadius = Math.min(8, minDim * 0.1);
        } else if (ratio > 0.75) {
            // Standard Bubble (Rounded Rect)
            dynamicRadius = Math.min(30, minDim * 0.25);
        } else {
            // Rounder (Oval-like)
            dynamicRadius = Math.min(50, minDim * 0.4);
        }
    }

    // Limit radius for small balloons
    if (minDim < 40) {
        dynamicRadius = Math.min(dynamicRadius, 6);
    }

    return dynamicRadius;
}

// ============================================================
// BALLOON CONVERSION
// ============================================================

/**
 * Convert a mask balloon to a speech balloon with inferred properties.
 */
export function convertMaskToSpeechBalloon(mask: Balloon): Balloon {
    // Convert polygon points to Point objects
    const polygonPoints = mask.detectedPolygon?.map((p: any) => ({
        x: p[0],
        y: p[1]
    }));

    const dynamicRadius = calculateDynamicRadius(polygonPoints, mask.box_2d);

    return {
        ...mask,
        id: `balloon-${mask.id}`,
        type: 'balloon-square', // Default to rounded rect
        color: '#ffffff',
        borderColor: '#000000',
        borderWidth: 2,
        borderRadius: dynamicRadius,
        opacity: 1,
        text: mask.text || '',
        points: undefined, // Force Konva Rect (perfect shape)
        roughness: 0,
        detectedPolygon: mask.detectedPolygon
    } as Balloon;
}
