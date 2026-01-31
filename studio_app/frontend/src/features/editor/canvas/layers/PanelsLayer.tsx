import React from 'react';
import { Layer } from 'react-konva';
import { Panel } from '@shared/types';
import { PanelShape } from '../PanelShape';

interface PanelsLayerProps {
    panels: Panel[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, attrs: Partial<Panel>) => void;
}

export const PanelsLayer: React.FC<PanelsLayerProps> = ({
    panels,
    selectedId,
    onSelect,
    onUpdate
}) => {
    return (
        <Layer name="panels-layer" perfectDrawEnabled={false}>
            {/* Z-INDEX LOGIC: Sort panels so selected one renders last (on top) */}
            {[...panels]
                .sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0))
                .map((panel) => (
                    <PanelShape
                        key={panel.id}
                        panel={panel}
                        isSelected={panel.id === selectedId}
                        onSelect={() => onSelect(panel.id)}
                        onUpdate={(id: string, attrs: Partial<Panel>) => onUpdate(id, attrs)}
                    />
                ))}
        </Layer>
    );
};
