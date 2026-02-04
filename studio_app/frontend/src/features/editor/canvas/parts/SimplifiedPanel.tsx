import React from 'react';
import { Line } from 'react-konva';
import { Panel } from '@shared/types';

interface SimplifiedPanelProps {
    panel: Panel;
    isSelected?: boolean;
}

/**
 * Simplified panel shape for rendering when zoomed out.
 * 
 * Uses a simple Line polygon instead of the full PanelShape.
 * No hit detection, no drag handles, minimal stroke.
 */
export const SimplifiedPanel: React.FC<SimplifiedPanelProps> = ({
    panel,
    isSelected = false
}) => {
    const strokeColor = isSelected ? '#3b82f6' : 'rgba(255, 200, 100, 0.5)';
    const fillColor = isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 200, 100, 0.08)';

    return (
        <Line
            points={panel.points}
            stroke={strokeColor}
            strokeWidth={1}
            fill={fillColor}
            closed={true}
            listening={false}
            perfectDrawEnabled={false}
        />
    );
};
