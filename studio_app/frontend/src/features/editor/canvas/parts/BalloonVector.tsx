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

    const commonProps = {
        width: width,
        height: height,
        fill: balloon.type === 'text' ? undefined : (balloon.color || '#ffffff'),
        stroke: isSelected ? '#007AFF' : (balloon.borderColor || (balloon.type === 'text' ? undefined : '#000000')),
        strokeWidth: isSelected ? 2 : (balloon.borderWidth || 1),
        perfectDrawEnabled: false,
        shadowForStrokeEnabled: false,
        listening: true // Must listen to clicks even if just a shape, to pass events up to group
    };

    if (balloon.type === 'text') {
        // Use transparent fill to ensure hit detection works across the entire box
        return <Rect {...commonProps} fill="rgba(0,0,0,0)" stroke={isSelected ? '#007AFF' : undefined} />;
    }

    // 1.5 EXACT POLYGON (Freeform)
    if (balloon.points && balloon.points.length > 2) {
        // Normalize points to be relative to the bounding box (Group is already at x,y)
        const minX = balloon.box_2d[1];
        const minY = balloon.box_2d[0];
        const flatPoints = balloon.points.flatMap(p => [p.x - minX, p.y - minY]);

        return (
            <Line
                {...commonProps}
                points={flatPoints}
                closed={true}
                tension={balloon.roughness || 0} // Optional smoothing
                stroke={isSelected ? '#007AFF' : (balloon.borderColor || '#000000')}
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
