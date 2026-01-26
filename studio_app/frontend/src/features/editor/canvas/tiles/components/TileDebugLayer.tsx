import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { useTileMath } from '../hooks/useTileMath';

interface TileDebugLayerProps {
    imageId: string;
    imageWidth: number;
    imageHeight: number;
    stageScale: number;
    stageX: number;
    stageY: number;
    stageWidth: number;
    stageHeight: number;
}

export const TileDebugLayer: React.FC<TileDebugLayerProps> = (props) => {
    // 256 is standardized in the hook
    const TILE_SIZE = 256;

    // Use the Math Hook
    const { tiles, zoomLevel, resolutionFactor } = useTileMath(props);

    if (!props.imageWidth || !props.imageHeight) return null;

    return (
        <Group listening={false}>
            {tiles.map((tile: any) => ( // Use explicit type or any temporarily to unblock
                <Group
                    key={tile.key}
                    x={tile.xPos}
                    y={tile.yPos}
                >
                    {/* Outline of the Tile */}
                    <Rect
                        width={TILE_SIZE * resolutionFactor}
                        height={TILE_SIZE * resolutionFactor}
                        stroke="red"
                        strokeWidth={2 / props.stageScale} // Keep line width constant visuals
                        dash={[5, 5]}
                    />

                    {/* Info Text */}
                    <Text
                        text={`Z:${tile.z} (${tile.x},${tile.y})`}
                        fill="red"
                        fontSize={20 * resolutionFactor} // Scale text so it stays readable relative to tile
                        padding={5}
                    />
                </Group>
            ))}

            {/* Global Info */}
            <Text
                text={`Zoom Level: ${zoomLevel} | ResFactor: ${resolutionFactor}`}
                x={-props.stageX / props.stageScale + 10}
                y={-props.stageY / props.stageScale + 10}
                fill="yellow"
                fontSize={24 / props.stageScale}
            />
        </Group>
    );
};
