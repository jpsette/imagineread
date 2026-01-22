import React from 'react';
import { Rect, Path } from 'react-konva';
import { Balloon } from '../../../../types';
import { BALLOON_PATHS } from '../utils/balloonPaths';

interface BalloonVectorProps {
    balloon: Balloon;
    width: number;
    height: number;
    isSelected: boolean;
    visible: boolean;
}

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

    // 1. TEXT TOOL (Transparent Rect)
    if (balloon.type === 'text') {
        return <Rect {...commonProps} fill={undefined} stroke={isSelected ? '#007AFF' : undefined} />;
    }

    // 2. SQUARE / DEFAULT
    if (balloon.type === 'balloon-square' || balloon.type === 'balloon') {
        return <Rect {...commonProps} cornerRadius={10} />;
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

    // Default Fallback
    return <Rect {...commonProps} cornerRadius={10} />;
};
