/**
 * Balloon Converter Utility
 * Converts YOLO detections to editable balloon format (one-way)
 * Keeps YOLO and Balloon systems decoupled
 */

import { Balloon, DetectedBalloon } from "../types";

export interface ImageSize {
    w: number;
    h: number;
}

/**
 * Calculates optimal font size based on balloon dimensions and text length
 * Prevents text overflow by auto-adjusting
 */
function calculateOptimalFontSize(
    balloonWidth: number,
    balloonHeight: number,
    textLength: number
): number {
    if (!textLength) return 10; // Default for empty

    // Use balloon area to determine base size
    const balloonArea = balloonWidth * balloonHeight;

    // Base font size scaled by balloon size
    let fontSize = Math.sqrt(balloonArea / 100); // Area-based sizing

    // Adjust based on text density
    const charsPerArea = textLength / balloonArea;

    if (charsPerArea > 0.02) {
        // Very dense text
        fontSize *= 0.6;
    } else if (charsPerArea > 0.01) {
        // Dense text
        fontSize *= 0.75;
    } else if (charsPerArea > 0.005) {
        // Medium text
        fontSize *= 0.9;
    }

    // Additional constraints for very long text
    if (textLength > 150) {
        fontSize = Math.min(fontSize, 7);
    } else if (textLength > 100) {
        fontSize = Math.min(fontSize, 8);
    } else if (textLength > 50) {
        fontSize = Math.min(fontSize, 10);
    }

    // Clamp to reasonable range - slightly higher minimum
    return Math.max(6, Math.min(12, Math.floor(fontSize)));
}

/**
 * Converts YOLO detections to editable balloons
 * @param detections - YOLO detection results (DetectedBalloon[])
 * @param imgNaturalSize - Image natural dimensions
 * @returns Array of Balloon objects ready for editing
 */
export function yoloToBalloons(
    detections: DetectedBalloon[],
    imgNaturalSize: ImageSize
): Balloon[] {
    const scaleX = 1000 / imgNaturalSize.w;
    const scaleY = 1000 / imgNaturalSize.h;

    return detections.map((detection, index) => {
        const [x, y, w, h] = detection.box;

        // Convert to 0-1000 scale for SVG viewBox
        const x1 = x * scaleX;
        const y1 = y * scaleY;
        const x2 = (x + w) * scaleX;
        const y2 = (y + h) * scaleY;

        const balloonWidth = x2 - x1;
        const balloonHeight = y2 - y1;
        const textLength = (detection.text || '').length;

        // Calculate optimal font size
        const optimalFontSize = calculateOptimalFontSize(
            balloonWidth,
            balloonHeight,
            textLength
        );

        return {
            id: `balloon-${Date.now()}-${index}`,
            text: detection.text || '',
            box_2d: [y1, x1, y2, x2], // [ymin, xmin, ymax, xmax]
            shape: 'rectangle',
            type: 'speech',
            customFontSize: optimalFontSize,
            borderRadius: 20,
            borderWidth: 1,
            tailWidth: 40,
            roughness: 1,
            tailTip: null
        };
    });
}
