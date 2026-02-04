import React from 'react';
import { Rect, Ellipse } from 'react-konva';
import { Balloon } from '@shared/types';
import { getBalloonBounds } from '../utils/boundsUtils';

interface SimplifiedBalloonProps {
    balloon: Balloon;
    isSelected?: boolean;
}

/**
 * Simplified balloon shape for rendering when zoomed out.
 * 
 * When scale < threshold, we render this lightweight version instead of
 * the full BalloonShape with text, vertex editors, and complex paths.
 * This dramatically improves performance when viewing many balloons at once.
 * 
 * Features:
 * - Simple geometric shapes (Rect/Ellipse)
 * - No text rendering
 * - No vertex editing handles
 * - Minimal stroke/fill
 */
export const SimplifiedBalloon: React.FC<SimplifiedBalloonProps> = ({
    balloon,
    isSelected = false
}) => {
    const bounds = getBalloonBounds(balloon);

    // Determine shape type
    const isEllipse = balloon.shape === 'ellipse' || balloon.shape === 'cloud';

    // Colors based on selection state
    const strokeColor = isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)';
    const fillColor = isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.1)';

    // Common props
    const commonProps = {
        listening: false, // Disable hit detection for performance
        perfectDrawEnabled: false,
    };

    if (isEllipse) {
        return (
            <Ellipse
                x={bounds.x + bounds.width / 2}
                y={bounds.y + bounds.height / 2}
                radiusX={bounds.width / 2}
                radiusY={bounds.height / 2}
                stroke={strokeColor}
                strokeWidth={1}
                fill={fillColor}
                {...commonProps}
            />
        );
    }

    return (
        <Rect
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
            stroke={strokeColor}
            strokeWidth={1}
            fill={fillColor}
            cornerRadius={balloon.borderRadius || 8}
            {...commonProps}
        />
    );
};

/**
 * Threshold scale below which SimplifiedBalloon should be used.
 * At 40% zoom or less, details aren't visible anyway.
 */
export const SIMPLIFY_SCALE_THRESHOLD = 0.4;

/**
 * Hook to determine if simplified rendering should be used
 */
export function useShouldSimplify(scale: number): boolean {
    return scale < SIMPLIFY_SCALE_THRESHOLD;
}
