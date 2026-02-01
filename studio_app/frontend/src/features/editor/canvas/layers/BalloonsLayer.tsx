import React from 'react';
import { Layer } from 'react-konva';
import { Balloon } from '@shared/types';
import { BalloonShape } from '../BalloonShape';

interface BalloonsLayerProps {
    balloons: Balloon[];
    selectedId: string | null;
    selectedIds: string[];
    editingId?: string | null;
    showMasks: boolean;
    showBalloons: boolean;
    showText: boolean;
    vertexEditingEnabled: boolean; // Toggle for vertex editing on balloons
    curveEditingEnabled: boolean; // Toggle for curve editing on balloons
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, attrs: Partial<Balloon>) => void;
    onEditRequest: (balloon: Balloon) => void;
    setEditingId: (id: string | null) => void;
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
    setEditingId
}) => {
    return (
        <Layer name="balloons-layer" perfectDrawEnabled={false}>
            {balloons.map((balloon) => {
                // Logic: Is this a mask or a balloon?
                const isMask = balloon.type === 'mask';
                const shouldShowShape = isMask ? showMasks : showBalloons;

                // Show vertex overlay: for masks use showMasks, for balloons use vertexEditingEnabled
                const shouldShowVertexOverlay = isMask ? showMasks : vertexEditingEnabled;

                return (
                    <BalloonShape
                        key={balloon.id}
                        balloon={balloon}
                        isSelected={selectedIds.includes(balloon.id) || balloon.id === selectedId}
                        // @ts-ignore
                        isEditing={editingId === balloon.id}
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
