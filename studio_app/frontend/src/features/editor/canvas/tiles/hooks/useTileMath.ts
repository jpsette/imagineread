import { useMemo } from 'react';

// Standard Tile Size (Must match Backend)
const TILE_SIZE = 256;

export interface TileCoordinate {
    z: number;
    x: number;
    y: number;
    key: string;
    url: string; // The backend URL to fetch
    xPos: number; // Canvas X position
    yPos: number; // Canvas Y position
}

interface UseTileMathProps {
    imageId: string;
    imageWidth: number;
    imageHeight: number;
    stageScale: number;
    stageX: number;
    stageY: number;
    stageWidth: number;
    stageHeight: number;
}

export const useTileMath = ({
    imageId,
    imageWidth,
    imageHeight,
    stageScale,
    stageX,
    stageY,
    stageWidth,
    stageHeight
}: UseTileMathProps): { tiles: TileCoordinate[]; zoomLevel: number; resolutionFactor: number } => {

    return useMemo(() => {
        if (!imageWidth || !imageHeight) return { tiles: [], zoomLevel: 0, resolutionFactor: 1 };

        // 1. Calculate Current Zoom Level (Backend Pyramid)
        // Zoom 0 = 100%
        // Zoom 1 = 50%
        // We match visual scale to nearest pyramid level.
        // If scale is 1.0 -> Level 0
        // If scale is 0.5 -> Level 1
        // If scale is 0.1 -> Level 3 or 4
        // Formula: log2(1 / scale)
        // Ensure we don't request negative levels (upscaling) -> Level 0
        let zoomLevel = Math.floor(Math.log2(1 / stageScale));
        if (zoomLevel < 0) zoomLevel = 0;

        // Cap max zoom? Maybe 4 or 5 for safety? Let's say 5 (3% scale).
        if (zoomLevel > 5) zoomLevel = 5;

        // 2. Calculate Visible Viewport in "Image Coordinates"
        // Invert the matrix transformation
        const visibleX = (-stageX) / stageScale;
        const visibleY = (-stageY) / stageScale;
        const visibleW = stageWidth / stageScale;
        const visibleH = stageHeight / stageScale;

        // 3. Scale Factor for this Level
        // Backend scales down by 2^zoomLevel.
        // So a coordinate X in original image becomes X / (2^zoom) in tile space?
        // NO. Tiles represent the *original* image cut up, but SCALED inside the file.
        // Wait, standard Deep Zoom implementation:
        // "Level 0" usually means "Full Resolution".
        // So at Level 0, 1 pixel = 1 pixel.
        // At Level 1, 1 pixel in tile = 2 pixels in original.

        const resolutionFactor = Math.pow(2, zoomLevel); // e.g. 1, 2, 4, 8

        // We need to find which tiles cover the visible area.
        // The visible area is in "Original Coordinates".
        // We need to convert Original -> Level Coordinates.

        const levelW = imageWidth / resolutionFactor;
        const levelH = imageHeight / resolutionFactor;

        // Scaled Viewport (What part of the Level Image do we need?)
        const levelVisibleX = visibleX / resolutionFactor;
        const levelVisibleY = visibleY / resolutionFactor;
        const levelVisibleW = visibleW / resolutionFactor;
        const levelVisibleH = visibleH / resolutionFactor;

        // 4. Calculate Tile Indices
        const startX = Math.floor(levelVisibleX / TILE_SIZE);
        const startY = Math.floor(levelVisibleY / TILE_SIZE);

        // Calculate MAX tiles possible for this level
        const maxTilesX = Math.ceil(levelW / TILE_SIZE);
        const maxTilesY = Math.ceil(levelH / TILE_SIZE);

        // Clamp end indices to the image bounds
        const endX = Math.min(Math.ceil((levelVisibleX + levelVisibleW) / TILE_SIZE), maxTilesX);
        const endY = Math.min(Math.ceil((levelVisibleY + levelVisibleH) / TILE_SIZE), maxTilesY);

        const tiles: TileCoordinate[] = [];

        // 5. Generate List
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                // Bounds Check: Don't request tiles outside the image
                // Max tiles in this row: ceil(levelW / TILE_SIZE)
                if (x < 0 || y < 0) continue;
                if (x * TILE_SIZE >= levelW || y * TILE_SIZE >= levelH) continue;

                // Position on the Stage (in Original Coordinates)
                // A tile at (x, y) in Level L starts at x*256 in Level L pixels.
                // In Original pixels, that is (x*256) * resolutionFactor.

                const xPos = (x * TILE_SIZE) * resolutionFactor;
                const yPos = (y * TILE_SIZE) * resolutionFactor;

                // Visual Width/Height (in Original Coordinates)
                // A 256px tile at Level 1 covers 512px of Original Image.
                // We will render it using Konva scaled up? 
                // NO. We render it 256x256 but we set scale?
                // Actually, easiest way is to stick to One Coordinate System (Original).
                // So we tell Konva: "Draw this tile at xPos, yPos with width=256*res, height=256*res".

                tiles.push({
                    z: zoomLevel,
                    x,
                    y,
                    key: `${imageId}-${zoomLevel}-${x}-${y}`,
                    url: `http://localhost:8000/tiles/${imageId}/${zoomLevel}/${x}/${y}`,
                    xPos: xPos,
                    yPos: yPos
                });
            }
        }

        return {
            tiles,
            zoomLevel,
            resolutionFactor
        };

    }, [imageId, imageWidth, imageHeight, stageScale, stageX, stageY, stageWidth, stageHeight]);
};
