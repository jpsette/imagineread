import React from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useTileMath } from '../hooks/useTileMath';

interface TileGridProps {
    imageId: string;
    imageWidth: number;
    imageHeight: number;
    stageScale: number;
    stageX: number;
    stageY: number;
    stageWidth: number;
    stageHeight: number;
}

// Single Tile Component to handle individual loading
const TileImage = ({ url, x, y, size, resolutionFactor }: { url: string, x: number, y: number, size: number, resolutionFactor: number }) => {
    // Custom Image Hook with Retry?
    // standard 'use-image' doesn't support retry easily.
    // Let's wrap standard img.
    const [image, status] = useImage(url, 'anonymous');
    const [retryCount, setRetryCount] = React.useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentUrl, setCurrentUrl] = React.useState(url);

    // If failed, retry after short delay
    React.useEffect(() => {
        if (status === 'failed' && retryCount < 3) {
            const timeout = setTimeout(() => {
                setRetryCount(prev => prev + 1);
                // Force URL refresh just in case of browser caching error response
                setCurrentUrl(`${url}?retry=${retryCount + 1}`);
            }, 1000 * (retryCount + 1));
            return () => clearTimeout(timeout);
        }
    }, [status, retryCount, url]);

    if (!image) return null;

    return (
        <KonvaImage
            image={image}
            x={x}
            y={y}
            width={size * resolutionFactor + 1} // +1px Overlap to fix "Seams" (Junções)
            height={size * resolutionFactor + 1} // +1px Overlap
            perfectDrawEnabled={false} // Optimization
            listening={false} // Click-through
        />
    );
};

export const TileGrid: React.FC<TileGridProps> = (props) => {
    const TILE_SIZE = 256;
    const { tiles, resolutionFactor } = useTileMath(props);

    if (!props.imageWidth || !props.imageHeight) return null;

    return (
        <Group
            listening={false}
            clipX={0}
            clipY={0}
            clipWidth={props.imageWidth}
            clipHeight={props.imageHeight}
        >
            {/* 1. Tiles Layer */}
            {tiles.map(tile => (
                <TileImage
                    key={tile.key}
                    url={tile.url}
                    x={tile.xPos}
                    y={tile.yPos}
                    size={TILE_SIZE}
                    resolutionFactor={resolutionFactor} // Passed from hook
                />
            ))}
        </Group>
    );
};
