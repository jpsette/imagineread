/**
 * BalloonShape Component
 * 
 * Renders a single balloon as SVG with path and text.
 * Handles animation state (visible/hidden) for sequential reveal.
 */

import React, { useMemo } from 'react';
import { Balloon } from '@shared/types';
import { buildPath, getBalloonRect } from '@features/editor/utils/pathBuilder';

interface BalloonShapeProps {
    balloon: Balloon;
    isVisible: boolean;
    /** Scale factor for coordinate mapping (pageSize / displaySize) */
    scale: number;
}

export const BalloonShape: React.FC<BalloonShapeProps> = ({
    balloon,
    isVisible,
    scale,
}) => {
    const rect = useMemo(() => getBalloonRect(balloon), [balloon]);
    const pathData = useMemo(() => buildPath(balloon), [balloon]);

    // Scale coordinates for display
    const displayRect = {
        x: rect.x * scale,
        y: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
    };

    // Calculate font size proportionally
    const baseFontSize = balloon.fontSize || 11;
    const scaledFontSize = Math.max(6, baseFontSize * scale);

    return (
        <g
            className="balloon-shape"
            style={{
                opacity: isVisible ? (balloon.opacity ?? 1) : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.5)',
                transformOrigin: `${displayRect.x + displayRect.width / 2}px ${displayRect.y + displayRect.height / 2}px`,
                transition: 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        >
            {/* Balloon Shape */}
            <path
                d={pathData}
                fill={balloon.color ?? '#FFFFFF'}
                stroke={balloon.borderColor ?? '#000000'}
                strokeWidth={(balloon.borderWidth ?? 2) * scale}
                transform={`scale(${scale})`}
            />

            {/* Text Content */}
            <foreignObject
                x={displayRect.x}
                y={displayRect.y}
                width={displayRect.width}
                height={displayRect.height}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: (balloon.textAlign as React.CSSProperties['textAlign']) || 'center',
                        fontSize: `${scaledFontSize}px`,
                        lineHeight: balloon.lineHeight || 1.2,
                        color: balloon.textColor || '#000000',
                        fontFamily: balloon.fontFamily || 'Comic Neue, Arial, sans-serif',
                        fontWeight: balloon.fontStyle?.includes('bold') ? 'bold' : 'normal',
                        fontStyle: balloon.fontStyle?.includes('italic') ? 'italic' : 'normal',
                        padding: `${displayRect.height * 0.1}px`,
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                    }}
                >
                    {balloon.text || ''}
                </div>
            </foreignObject>
        </g>
    );
};
