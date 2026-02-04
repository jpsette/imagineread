import React from 'react';
import { Layer } from 'react-konva';
import { Panel } from '@shared/types';
import { PanelShape } from '../PanelShape';
import { SimplifiedPanel } from '../parts/SimplifiedPanel';
import { SIMPLIFY_SCALE_THRESHOLD } from '../parts/SimplifiedBalloon';
import { getPanelBounds } from '../utils/boundsUtils';
import { ViewportState } from '../hooks/useViewportCulling';

interface PanelsLayerProps {
    panels: Panel[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onUpdate: (id: string, attrs: Partial<Panel>) => void;
    viewport?: ViewportState | null;
}

/**
 * Checks if a panel is visible within the viewport
 */
function isPanelVisible(panel: Panel, viewport: ViewportState, padding = 150): boolean {
    const bounds = getPanelBounds(panel);
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

export const PanelsLayer: React.FC<PanelsLayerProps> = ({
    panels,
    selectedId,
    onSelect,
    onUpdate,
    viewport = null
}) => {
    // LOD: Use simplified rendering when zoomed out
    const useSimplified = viewport ? viewport.scale < SIMPLIFY_SCALE_THRESHOLD : false;

    // Filter panels based on viewport visibility
    const panelsToRender = React.useMemo(() => {
        if (!viewport || viewport.width === 0) {
            return panels;
        }

        return panels.filter(panel => {
            if (panel.id === selectedId) {
                return true;
            }
            return isPanelVisible(panel, viewport);
        });
    }, [panels, viewport, selectedId]);

    return (
        <Layer name="panels-layer" perfectDrawEnabled={false}>
            {[...panelsToRender]
                .sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0))
                .map((panel) => {
                    const isSelected = panel.id === selectedId;

                    // LOD: Use SimplifiedPanel when zoomed out (unless selected)
                    if (useSimplified && !isSelected) {
                        return (
                            <SimplifiedPanel
                                key={panel.id}
                                panel={panel}
                                isSelected={false}
                            />
                        );
                    }

                    return (
                        <PanelShape
                            key={panel.id}
                            panel={panel}
                            isSelected={isSelected}
                            onSelect={() => onSelect(panel.id)}
                            onUpdate={(id: string, attrs: Partial<Panel>) => onUpdate(id, attrs)}
                        />
                    );
                })}
        </Layer>
    );
};
