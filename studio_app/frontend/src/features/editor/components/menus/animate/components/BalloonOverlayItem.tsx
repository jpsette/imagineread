/**
 * BalloonOverlayItem
 * 
 * Individual balloon overlay in the animation workspace.
 * Memoized for performance - only re-renders when its specific props change.
 */

import React from 'react';
import { Balloon } from '@shared/types';

interface BalloonRenderData {
    left: number;
    top: number;
    width: number;
    height: number;
    textScale: number;
    borderWidth: number;
    borderRadius: number;
}

interface BalloonOverlayItemProps {
    balloon: Balloon;
    renderData: BalloonRenderData;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onDragStart?: (e: React.MouseEvent) => void;
    onScaleStart?: (e: React.MouseEvent) => void;
}

const BalloonOverlayItemComponent: React.FC<BalloonOverlayItemProps> = ({
    balloon,
    renderData,
    isSelected,
    onClick,
    onDragStart,
    onScaleStart
}) => {
    // Determine shape-based border radius
    let borderRadius: string | number = renderData.borderRadius;
    if (balloon.shape === 'ellipse' || balloon.type === 'balloon-circle') {
        borderRadius = '50%';
    }

    return (
        <div
            className="absolute"
            style={{
                left: `calc(50% + ${renderData.left}px)`,
                top: `calc(50% + ${renderData.top}px)`,
                width: renderData.width,
                height: renderData.height,
                backgroundColor: balloon.color || '#ffffff',
                borderRadius: borderRadius,
                border: isSelected
                    ? `2px solid #3b82f6`
                    : `${renderData.borderWidth}px solid ${balloon.borderColor || '#000000'}`,
                overflow: 'hidden',
                cursor: isSelected ? 'move' : 'pointer',
                boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
                zIndex: isSelected ? 10 : 1,
                position: 'relative'
            }}
            onClick={onClick}
            onMouseDown={isSelected ? onDragStart : undefined}
        >
            {/* Text wrapper - positioned absolutely to allow overflow before clipping */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${renderData.textScale})`,
                    // Use ORIGINAL balloon dimensions
                    width: balloon.textWidth || (balloon.box_2d[3] - balloon.box_2d[1]),
                    height: balloon.textHeight || (balloon.box_2d[2] - balloon.box_2d[0]),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: `${Math.round((balloon.box_2d[2] - balloon.box_2d[0]) * 0.05)}px`,
                    fontSize: `${balloon.fontSize || 11}px`,
                    lineHeight: balloon.lineHeight || 1.2,
                    color: balloon.textColor || '#000000',
                    fontFamily: balloon.fontFamily || 'Comic Neue, Arial, sans-serif',
                    fontWeight: balloon.fontStyle?.includes('bold') ? 'bold' : 'normal',
                    fontStyle: balloon.fontStyle?.includes('italic') ? 'italic' : 'normal',
                    textAlign: (balloon.textAlign as React.CSSProperties['textAlign']) || 'center',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    boxSizing: 'border-box'
                }}
            >
                {balloon.text || '...'}
            </div>

            {/* Scale handle for selected balloon */}
            {isSelected && onScaleStart && (
                <div
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-se-resize shadow-sm"
                    style={{ zIndex: 20 }}
                    onMouseDown={onScaleStart}
                    title="Redimensionar balão (staging)"
                />
            )}
        </div>
    );
};

export const BalloonOverlayItem = React.memo(BalloonOverlayItemComponent, (prev, next) => {
    // Only re-render if these specific props change
    if (prev.balloon !== next.balloon) return false;
    if (prev.isSelected !== next.isSelected) return false;
    if (prev.renderData.left !== next.renderData.left) return false;
    if (prev.renderData.top !== next.renderData.top) return false;
    if (prev.renderData.width !== next.renderData.width) return false;
    if (prev.renderData.height !== next.renderData.height) return false;
    if (prev.renderData.textScale !== next.renderData.textScale) return false;
    return true;
});

BalloonOverlayItem.displayName = 'BalloonOverlayItem';
