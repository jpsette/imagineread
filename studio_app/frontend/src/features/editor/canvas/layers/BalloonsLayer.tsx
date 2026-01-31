import React from 'react';
import { Layer } from 'react-konva';
import { Balloon } from '@shared/types';
import { BalloonShape } from '../BalloonShape';

interface BalloonsLayerProps {
    balloons: Balloon[];
    selectedId: string | null;
    editingId?: string | null;
    showMasks: boolean;
    showBalloons: boolean;
    showText: boolean;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, attrs: Partial<Balloon>) => void;
    onEditRequest: (balloon: Balloon) => void;
    setEditingId: (id: string | null) => void;
}

export const BalloonsLayer: React.FC<BalloonsLayerProps> = ({
    balloons,
    selectedId,
    editingId,
    showMasks,
    showBalloons,
    showText,
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

                return (
                    <BalloonShape
                        key={balloon.id}
                        balloon={balloon}
                        isSelected={balloon.id === selectedId}
                        // @ts-ignore
                        isEditing={editingId === balloon.id}
                        // VISIBILITY PROPS
                        showBalloon={shouldShowShape}
                        showText={showText}
                        showMaskOverlay={showMasks}

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
