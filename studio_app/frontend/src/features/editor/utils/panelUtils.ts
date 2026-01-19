import Konva from 'konva';

/**
 * Generates exact pixel crops using Data Coordinates (Math-based).
 * This is the stable method. It respects manual resizing by applying scale factors.
 */
export const generatePanelPreviews = (stage: Konva.Stage | null, panels: any[]): string[] => {
    if (!stage || !panels || panels.length === 0) {
        return [];
    }

    const previews: string[] = [];

    try {
        // 1. SELECT SOURCE IMAGE
        // Priority: Clean Image > Base Image
        let imageNode = stage.findOne('.clean-image') as Konva.Image;

        if (!imageNode) {
            imageNode = stage.findOne('.base-image') as Konva.Image;
        }

        if (!imageNode) {
            console.error("No source image found (.clean-image or .base-image).");
            return [];
        }

        const nativeImage = imageNode.image();
        if (!nativeImage || !(nativeImage instanceof HTMLImageElement)) {
            console.error("Source image is not ready.");
            return [];
        }

        // 2. PROCESS PANELS (Data-Based Calculation)
        panels.forEach((panel) => {
            // DATA-DRIVEN STRATEGY (Stable)
            let x = 0, y = 0, w = 0, h = 0;

            if (typeof panel.x === 'number') {
                // If the user resized the panel manually, Konva updates scaleX/scaleY
                const sX = panel.scaleX || 1;
                const sY = panel.scaleY || 1;

                x = panel.x;
                y = panel.y;
                w = panel.width * sX;
                h = panel.height * sY;
            } else if (Array.isArray(panel.box_2d)) {
                // Fallback for raw API data
                const [y1, x1, y2, x2] = panel.box_2d;
                x = x1;
                y = y1;
                w = x2 - x1;
                h = y2 - y1;
            }

            // Sanity Check
            if (w <= 0 || h <= 0) return;

            // Create canvas crop
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Draw strictly based on the calculated numbers
                ctx.drawImage(
                    nativeImage,
                    x, y, w, h,  // Source Crop
                    0, 0, w, h   // Destination
                );

                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                previews.push(dataUrl);
            }
        });
    } catch (error) {
        console.error("Error generating panel previews:", error);
    }

    return previews;
};
