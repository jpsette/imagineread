import React from 'react';
import { Rect, Path, Line, Image } from 'react-konva';
import useImage from 'use-image';
import { Balloon } from '@shared/types';
import { BALLOON_PATHS } from '../utils/balloonPaths';

interface BalloonVectorProps {
    balloon: Balloon;
    width: number;
    height: number;
    isSelected: boolean;
    visible: boolean;
}

// Sub-component to handle SVG image loading
const SvgImage: React.FC<{
    dataUrl: string;
    width: number;
    height: number;
    isSelected: boolean;
}> = ({ dataUrl, width, height, isSelected }) => {
    const [image] = useImage(dataUrl);

    return (
        <>
            <Image
                image={image}
                width={width}
                height={height}
                perfectDrawEnabled={false}
            />
            {/* Selection border */}
            {isSelected && (
                <Rect
                    width={width}
                    height={height}
                    stroke="#007AFF"
                    strokeWidth={2}
                    fill="transparent"
                    listening={false}
                />
            )}
        </>
    );
};

export const BalloonVector: React.FC<BalloonVectorProps> = ({
    balloon,
    width,
    height,
    isSelected,
    visible
}) => {
    // If explicitly hidden via prop, don't render anything
    if (!visible) return null;

    // Helper: Get dash array from borderStyle with custom sizing
    const getDash = (): number[] | undefined => {
        const style = balloon.borderStyle;
        if (!style || style === 'solid') return undefined;

        const sw = balloon.borderWidth ?? 1;
        const size = balloon.dashSize ?? (style === 'dashed' ? sw * 4 : sw);
        const gap = balloon.dashGap ?? (style === 'dashed' ? sw * 2 : sw);

        return [size, gap];
    };

    // Stroke alignment offset calculation
    const strokeW = balloon.borderWidth ?? 1;
    const strokeAlign = balloon.strokeAlign || 'center';
    // For inner: we need to inset the shape by half stroke, and use strokeScaleEnabled=false
    // For outer: we need to outset the shape by half stroke
    // For center: default behavior (stroke straddles the edge)
    const strokeOffset = strokeAlign === 'inner' ? strokeW / 2 : strokeAlign === 'outer' ? -strokeW / 2 : 0;

    const commonProps = {
        fill: balloon.type === 'text' ? undefined : (balloon.color || '#ffffff'),
        stroke: balloon.borderColor || (balloon.type === 'text' ? undefined : '#000000'),
        strokeWidth: strokeW,
        dash: getDash(),
        perfectDrawEnabled: false,
        shadowForStrokeEnabled: false,
        listening: true,
        // Inner/outer stroke: inset/outset position and dimensions
        x: strokeOffset,
        y: strokeOffset,
        width: width - strokeOffset * 2,
        height: height - strokeOffset * 2
    };

    if (balloon.type === 'text') {
        // Use transparent fill to ensure hit detection works across the entire box
        return <Rect {...commonProps} fill="rgba(0,0,0,0)" stroke={undefined} dash={undefined} />;
    }

    // 1.5 EXACT POLYGON (Freeform) - with optional bezier curves
    if (balloon.points && balloon.points.length > 2) {
        const minX = balloon.box_2d[1];
        const minY = balloon.box_2d[0];
        const pts = balloon.points.map(p => ({ x: p.x - minX, y: p.y - minY }));
        const cps = balloon.curveControlPoints || [];

        // Check if we have any curve control points
        const hasCurves = cps.some(cp => cp !== null);

        if (hasCurves && cps.length === pts.length) {
            // Generate SVG path with quadratic bezier curves
            const relativeCps = cps.map(cp =>
                cp ? { x: cp.x - minX, y: cp.y - minY } : null
            );

            let d = `M ${pts[0].x + strokeOffset} ${pts[0].y + strokeOffset}`;
            for (let i = 0; i < pts.length; i++) {
                const nextI = (i + 1) % pts.length;
                const p2 = pts[nextI];
                const cp = relativeCps[i];

                if (cp) {
                    d += ` Q ${cp.x + strokeOffset} ${cp.y + strokeOffset} ${p2.x + strokeOffset} ${p2.y + strokeOffset}`;
                } else {
                    d += ` L ${p2.x + strokeOffset} ${p2.y + strokeOffset}`;
                }
            }
            d += ' Z';

            return (
                <Path
                    data={d}
                    fill={balloon.color || '#ffffff'}
                    stroke={balloon.borderColor || '#000000'}
                    strokeWidth={strokeW}
                    dash={getDash()}
                    perfectDrawEnabled={false}
                    shadowForStrokeEnabled={false}
                    listening={true}
                />
            );
        }

        // No curves - use Line (faster)
        const flatPoints = pts.flatMap(p => [p.x + strokeOffset, p.y + strokeOffset]);
        return (
            <Line
                {...commonProps}
                points={flatPoints}
                closed={true}
                tension={balloon.roughness || 0}
                stroke={balloon.borderColor || '#000000'}
                fill={balloon.color || '#ffffff'}
            />
        );
    }

    // 2. SQUARE / DEFAULT / UNIFIED STRATEGY
    if (balloon.type === 'balloon-square' || balloon.type === 'balloon') {
        const radius = typeof balloon.borderRadius === 'number' ? balloon.borderRadius : 10;
        return <Rect {...commonProps} cornerRadius={radius} />;
    }

    // 3. CIRCLE (Pill Shape)
    if (balloon.type === 'balloon-circle') {
        return <Rect {...commonProps} cornerRadius={Math.min(width, height) / 2} />;
    }

    // 4. THOUGHT BUBBLE (Path)
    if (balloon.type === 'balloon-thought') {
        return (
            <Path
                {...commonProps}
                data={BALLOON_PATHS.thought}
                scaleX={width / 100}
                scaleY={height / 100}
                width={undefined} height={undefined}
            />
        );
    }

    // 5. SHOUT BUBBLE (Path)
    if (balloon.type === 'balloon-shout') {
        const strokeWidth = isSelected ? 2 : (balloon.borderWidth || 2);
        return (
            <Path
                {...commonProps}
                strokeWidth={strokeWidth}
                data={BALLOON_PATHS.shout}
                scaleX={width / 100}
                scaleY={height / 100}
                width={undefined} height={undefined}
            />
        );
    }

    // 6. CUSTOM SVG - Complete SVG as Data URL (NEW - for complex SVGs)
    if (balloon.type === 'balloon-custom' && balloon.svgDataUrl) {
        return (
            <SvgImage
                dataUrl={balloon.svgDataUrl}
                width={width}
                height={height}
                isSelected={isSelected}
            />
        );
    }

    // 7. CUSTOM SVG - Path only (legacy)
    if (balloon.type === 'balloon-custom' && balloon.customSvg) {
        // Default viewBox if missing is 100x100
        const vw = balloon.svgViewBox?.width || 100;
        const vh = balloon.svgViewBox?.height || 100;

        return (
            <Path
                {...commonProps}
                data={balloon.customSvg}
                scaleX={width / vw}
                scaleY={height / vh}
                width={undefined} height={undefined}
            />
        );
    }

    // Default Fallback
    const fallbackRadius = typeof balloon.borderRadius === 'number' ? balloon.borderRadius : 10;

    return (
        <>
            <Rect {...commonProps} cornerRadius={fallbackRadius} />
        </>
    );
};
