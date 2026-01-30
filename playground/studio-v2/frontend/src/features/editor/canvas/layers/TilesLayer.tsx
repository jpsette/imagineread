import React from 'react';
import { Layer } from 'react-konva';
import { TileGrid } from '../tiles/components/TileGrid';

interface TilesLayerProps {
    imgOriginal: HTMLImageElement | undefined;
    activeTileId: string;
    stageScale: number;
    stageX: number;
    stageY: number;
    stageWidth: number;
    stageHeight: number;
}

export const TilesLayer: React.FC<TilesLayerProps> = ({
    imgOriginal,
    activeTileId,
    stageScale,
    stageX,
    stageY,
    stageWidth,
    stageHeight
}) => {
    // Only render if image is present
    if (!imgOriginal) return null;

    return (
        <Layer listening={false} perfectDrawEnabled={false}>
            <TileGrid
                imageId={activeTileId}
                imageWidth={imgOriginal.naturalWidth}
                imageHeight={imgOriginal.naturalHeight}
                stageScale={stageScale}
                stageX={stageX}
                stageY={stageY}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
            />
        </Layer>
    );
};
