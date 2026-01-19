import Konva from 'konva';

/**
 * Generates exact pixel crops based on Panel Data.
 * SUPPORTS POLYGONAL CLIPPING: Respects trapezoids and irregular shapes using transparency.
 */
export const generatePanelPreviews = (stage: Konva.Stage | null, panels: any[]): string[] => {
    if (!stage || !panels || panels.length === 0) {
        return [];
    }

    const previews: string[] = [];

    try {
        // 1. SELECT SOURCE IMAGE
        let imageNode = stage.findOne('.clean-image') as Konva.Image;
        if (!imageNode) {
            imageNode = stage.findOne('.base-image') as Konva.Image;
        }

        if (!imageNode) {
            console.error("No source image found.");
            return [];
        }

        const nativeImage = imageNode.image();
        if (!nativeImage || !(nativeImage instanceof HTMLImageElement)) {
            console.error("Source image is not ready.");
            return [];
        }

        // 2. PROCESS PANELS
        panels.forEach((panel) => {
            let cropX = 0, cropY = 0, cropW = 0, cropH = 0;
            let points: number[] = [];

            // A. DETERMINE GEOMETRY
            // Case 1: Manual Points (Polygon/Trapezoid) - HIGHEST PRIORITY
            if (panel.points && Array.isArray(panel.points) && panel.points.length >= 4) {
                points = panel.points;
                const xs = points.filter((_, i) => i % 2 === 0);
                const ys = points.filter((_, i) => i % 2 === 1);
                const minX = Math.min(...xs);
                const minY = Math.min(...ys);
                const maxX = Math.max(...xs);
                const maxY = Math.max(...ys);

                cropX = minX;
                cropY = minY;
                cropW = maxX - minX;
                cropH = maxY - minY;
            }
            // Case 2: Rectangle (Transformer or Raw Box)
            else {
                // Determine Rect Coords
                if (typeof panel.x === 'number') {
                    const sX = panel.scaleX || 1;
                    const sY = panel.scaleY || 1;
                    cropX = panel.x; cropY = panel.y;
                    cropW = panel.width * sX; cropH = panel.height * sY;
                } else if (Array.isArray(panel.box_2d)) {
                    const [y1, x1, y2, x2] = panel.box_2d;
                    cropX = x1; cropY = y1; cropW = x2 - x1; cropH = y2 - y1;
                }
                // Generate rectangular points for consistency
                points = [cropX, cropY, cropX + cropW, cropY, cropX + cropW, cropY + cropH, cropX, cropY + cropH];
            }

            // Sanity Check
            if (cropW <= 0 || cropH <= 0) return;

            // B. DRAW AND CLIP
            const canvas = document.createElement('canvas');
            canvas.width = cropW;
            canvas.height = cropH;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // 1. Define Path relative to the crop canvas (0,0)
                ctx.beginPath();
                if (points.length >= 2) {
                    // Move points to be relative to the bounding box top-left (cropX, cropY)
                    ctx.moveTo(points[0] - cropX, points[1] - cropY);
                    for (let i = 2; i < points.length; i += 2) {
                        ctx.lineTo(points[i] - cropX, points[i + 1] - cropY);
                    }
                }
                ctx.closePath();

                // 2. Clip: This makes everything outside the path transparent
                ctx.clip();

                // 3. Draw Image
                // We draw the slice of the original image starting at cropX, cropY
                // onto the full size of our new canvas (0, 0)
                ctx.drawImage(
                    nativeImage,
                    cropX, cropY, cropW, cropH,  // Source Slice
                    0, 0, cropW, cropH   // Destination
                );

                const dataUrl = canvas.toDataURL('image/png'); // PNG is required for transparency
                previews.push(dataUrl);
            }
        });
    } catch (error) {
        console.error("Error generating panel previews:", error);
    }

    return previews;
};
