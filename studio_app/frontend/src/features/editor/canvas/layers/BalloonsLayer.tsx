import React from 'react';
import { Layer } from 'react-konva';
import { Balloon } from '@shared/types';
import { BalloonShape } from '../BalloonShape';
import { SimplifiedBalloon, SIMPLIFY_SCALE_THRESHOLD } from '../parts/SimplifiedBalloon';
import { getBalloonBounds } from '../utils/boundsUtils';
import { ViewportState } from '../hooks/useViewportCulling';

interface BalloonsLayerProps {
    balloons: Balloon[];
    selectedId: string | null;
    selectedIds: string[];
    editingId?: string | null;
    showMasks: boolean;
    showBalloons: boolean;
    showText: boolean;
    vertexEditingEnabled: boolean;
    curveEditingEnabled: boolean;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, attrs: Partial<Balloon>) => void;
    onEditRequest: (balloon: Balloon) => void;
    setEditingId: (id: string | null) => void;
    viewport?: ViewportState | null;
}

/**
 * Checks if a balloon is visible within the viewport
 */
function isBalloonVisible(balloon: Balloon, viewport: ViewportState, padding = 150): boolean {
    const bounds = getBalloonBounds(balloon);
    const { x: vpX, y: vpY, width, height, scale } = viewport;

    const vpLeft = -vpX / scale - padding;
    const vpRight = (-vpX + width) / scale + padding;
    const vpTop = -vpY / scale - padding;
    const vpBottom = (-vpY + height) / scale + padding;

    return (
        bounds.x + bounds.width > vpLeft &&
        bounds.x < vpRight &&
        bounds.y + bounds.height > vpTop &&
        bounds.y < vpBottom
    );
}

export const BalloonsLayer: React.FC<BalloonsLayerProps> = ({
    balloons,
    selectedId,
    selectedIds,
    editingId,
    showMasks,
    showBalloons,
    showText,
    vertexEditingEnabled,
    curveEditingEnabled,
    onSelect,
    onUpdate,
    onEditRequest,
    setEditingId,
    viewport = null
}) => {
    // LOD: Use simplified rendering when zoomed out
    const useSimplified = viewport ? viewport.scale < SIMPLIFY_SCALE_THRESHOLD : false;

    // Filter balloons based on viewport visibility
    const balloonsToRender = React.useMemo(() => {
        if (!viewport || viewport.width === 0) {
            return balloons;
        }

        return balloons.filter(balloon => {
            if (selectedIds.includes(balloon.id) || balloon.id === selectedId || balloon.id === editingId) {
                return true;
            }
            return isBalloonVisible(balloon, viewport);
        });
    }, [balloons, viewport, selectedIds, selectedId, editingId]);

    return (
        <Layer name="balloons-layer" perfectDrawEnabled={false}>
            {balloonsToRender.map((balloon) => {
                const isMask = balloon.type === 'mask';
                const shouldShowShape = isMask ? showMasks : showBalloons;
                const isSelected = selectedIds.includes(balloon.id) || balloon.id === selectedId;
                const isEditing = editingId === balloon.id;

                // LOD: Use SimplifiedBalloon when zoomed out (unless selected/editing)
                if (useSimplified && !isSelected && !isEditing) {
                    if (!shouldShowShape) return null;
                    return (
                        <SimplifiedBalloon
                            key={balloon.id}
                            balloon={balloon}
                            isSelected={false}
                        />
                    );
                }

                // Full rendering for normal zoom or selected/editing balloons
                const shouldShowVertexOverlay = isMask ? showMasks : vertexEditingEnabled;

                return (
                    <BalloonShape
                        key={balloon.id}
                        balloon={balloon}
                        isSelected={isSelected}
                        // @ts-ignore
                        isEditing={isEditing}
                        showBalloon={shouldShowShape}
                        showText={showText}
                        showMaskOverlay={shouldShowVertexOverlay}
                        curveEditingEnabled={curveEditingEnabled}
                        onSelect={() => onSelect(balloon.id)}
                        onChange={(newAttrs: Partial<Balloon>) => onUpdate(balloon.id, newAttrs)}
                        onEditRequest={() => onEditRequest(balloon)}
                        // @ts-ignore
                        onEditingBlur={() => setEditingId(null)}
                    />
                );
            })}
        </Layer>
    );
};
