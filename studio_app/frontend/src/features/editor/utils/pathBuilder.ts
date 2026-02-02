/**
 * Path Builder Utility
 * 
 * Generates SVG path data for balloon shapes.
 * Replicates the iOS Swift buildPath logic for consistent rendering.
 */

import { Balloon } from '@shared/types';

// ============================================================================
// Types
// ============================================================================

interface BoundingRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Build SVG path data for a balloon
 */
export function buildPath(balloon: Balloon): string {
    // If custom points exist, use bezier path
    if (balloon.points && balloon.points.length > 2) {
        return buildBezierPath(balloon);
    }

    // Otherwise use shape preset
    return buildShapePath(balloon);
}

// ============================================================================
// Shape Presets
// ============================================================================

function buildShapePath(balloon: Balloon): string {
    const rect = getBoundingRect(balloon);

    switch (balloon.shape) {
        case 'ellipse':
            return buildEllipsePath(rect);
        case 'rectangle':
            return buildRectanglePath(rect, balloon.borderRadius ?? 8);
        case 'cloud':
            return buildCloudPath(rect);
        case 'scream':
            return buildScreamPath(rect);
        default:
            return buildEllipsePath(rect);
    }
}

function buildEllipsePath(rect: BoundingRect): string {
    const rx = rect.width / 2;
    const ry = rect.height / 2;
    const cx = rect.x + rx;
    const cy = rect.y + ry;

    // SVG ellipse as path (two arcs)
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} Z`;
}

function buildRectanglePath(rect: BoundingRect, cornerRadius: number): string {
    const { x, y, width, height } = rect;
    const r = Math.min(cornerRadius, width / 2, height / 2);

    return `
    M ${x + r} ${y}
    H ${x + width - r}
    Q ${x + width} ${y} ${x + width} ${y + r}
    V ${y + height - r}
    Q ${x + width} ${y + height} ${x + width - r} ${y + height}
    H ${x + r}
    Q ${x} ${y + height} ${x} ${y + height - r}
    V ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    Z
  `.replace(/\s+/g, ' ').trim();
}

function buildCloudPath(rect: BoundingRect): string {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const rx = rect.width / 2;
    const ry = rect.height / 2;

    let d = '';
    const bumps = 8;

    for (let i = 0; i < bumps; i++) {
        const angle1 = i * (2 * Math.PI / bumps);
        const angle2 = (i + 1) * (2 * Math.PI / bumps);
        const midAngle = (angle1 + angle2) / 2;

        const r1 = rx * (0.8 + 0.2 * Math.sin(i * 1.5));
        const r2 = ry * (0.8 + 0.2 * Math.cos(i * 1.5));

        const x1 = cx + r1 * Math.cos(angle1);
        const y1 = cy + r2 * Math.sin(angle1);
        const x2 = cx + r1 * Math.cos(angle2);
        const y2 = cy + r2 * Math.sin(angle2);

        const bumpR = (r1 + r2) / 2 * 1.15;
        const cpX = cx + bumpR * Math.cos(midAngle);
        const cpY = cy + bumpR * Math.sin(midAngle);

        if (i === 0) {
            d = `M ${x1} ${y1}`;
        }

        d += ` Q ${cpX} ${cpY} ${x2} ${y2}`;
    }

    return d + ' Z';
}

function buildScreamPath(rect: BoundingRect): string {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const rx = rect.width / 2;
    const ry = rect.height / 2;

    let d = '';
    const spikes = 12;

    for (let i = 0; i < spikes; i++) {
        const angle = i * (2 * Math.PI / spikes);
        const isSpike = i % 2 === 0;
        const radius = isSpike ? 1.0 : 0.7;

        const x = cx + rx * radius * Math.cos(angle);
        const y = cy + ry * radius * Math.sin(angle);

        if (i === 0) {
            d = `M ${x} ${y}`;
        } else {
            d += ` L ${x} ${y}`;
        }
    }

    return d + ' Z';
}

// ============================================================================
// Custom Bezier Path
// ============================================================================

function buildBezierPath(balloon: Balloon): string {
    const { points, vertexHandles } = balloon;
    if (!points || points.length === 0) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
        const prevHandle = vertexHandles?.[i - 1];
        const currHandle = vertexHandles?.[i];

        const handleOut = prevHandle?.handleOut;
        const handleIn = currHandle?.handleIn;

        if (handleOut && handleIn) {
            // Cubic Bézier
            d += ` C ${handleOut.x} ${handleOut.y}, ${handleIn.x} ${handleIn.y}, ${points[i].x} ${points[i].y}`;
        } else if (handleOut) {
            // Quadratic
            d += ` Q ${handleOut.x} ${handleOut.y}, ${points[i].x} ${points[i].y}`;
        } else {
            // Line
            d += ` L ${points[i].x} ${points[i].y}`;
        }
    }

    // Close path back to first point
    const lastHandle = vertexHandles?.[points.length - 1];
    const firstHandle = vertexHandles?.[0];

    if (lastHandle?.handleOut && firstHandle?.handleIn) {
        d += ` C ${lastHandle.handleOut.x} ${lastHandle.handleOut.y}, ${firstHandle.handleIn.x} ${firstHandle.handleIn.y}, ${points[0].x} ${points[0].y}`;
    } else {
        d += ' Z';
    }

    return d;
}

// ============================================================================
// Tail Path
// ============================================================================

export function buildTailPath(balloon: Balloon): string {
    if (!balloon.tailTip) return '';

    const rect = getBoundingRect(balloon);
    const baseWidth = balloon.tailWidth ?? 20;
    const baseY = rect.y + rect.height * 0.8;
    const midX = rect.x + rect.width / 2;

    const { tailTip, tailControl } = balloon;

    if (tailControl) {
        // Curved tail with control point
        return `
      M ${midX - baseWidth / 2} ${baseY}
      Q ${tailControl.x} ${tailControl.y}, ${tailTip.x} ${tailTip.y}
      Q ${tailControl.x} ${tailControl.y}, ${midX + baseWidth / 2} ${baseY}
      Z
    `.replace(/\s+/g, ' ').trim();
    }

    // Simple triangular tail
    return `M ${midX - baseWidth / 2} ${baseY} L ${tailTip.x} ${tailTip.y} L ${midX + baseWidth / 2} ${baseY} Z`;
}

// ============================================================================
// Helpers
// ============================================================================

function getBoundingRect(balloon: Balloon): BoundingRect {
    const [ymin, xmin, ymax, xmax] = balloon.box_2d;
    return {
        x: xmin,
        y: ymin,
        width: xmax - xmin,
        height: ymax - ymin,
    };
}

/**
 * Get the center point of a balloon's bounding box
 */
export function getBalloonCenter(balloon: Balloon): { x: number; y: number } {
    const rect = getBoundingRect(balloon);
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
    };
}

/**
 * Get bounding rect from balloon (exported for use in components)
 */
export function getBalloonRect(balloon: Balloon): BoundingRect {
    return getBoundingRect(balloon);
}
