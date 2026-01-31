import Konva from 'konva';

/**
 * Generates exact pixel crops based on Panel Data.
 * SUPPORTS POLYGONAL CLIPPING: Respects trapezoids and irregular shapes using transparency.
 * SUPPORTS WYSIWYG V3: Captures Stage + Balloons + CANVAS TEXT (Proxying HTML Text).
 */
export const generatePanelPreviews = (stage: Konva.Stage | null, panels: any[]): string[] => {
    if (!stage || !panels || panels.length === 0) {
        return [];
    }

    const previews: string[] = [];

    try {
        // 1. SELECT UI LAYERS TO HIDE
        const panelsLayer = stage.findOne('.panels-layer') as Konva.Layer;
        const transformers = stage.find('Transformer');

        // 2. SELECT TEXT PROXY NODES TO SHOW
        // These are 'Konva.Text' nodes hidden behind the HTML overlay.
        // We need to SHOW them for the snapshot, because toCanvas() can't see the HTML overlay.
        const textProxies = stage.find('.export-text-canvas');

        // SAVE STATE
        const wasPanelsVisible = panelsLayer ? panelsLayer.visible() : true;
        // We don't need to save text proxies state because they are ALWAYS hidden by default.

        // 3. PREPARE FOR SNAPSHOT
        // HIDE UI
        if (panelsLayer) panelsLayer.hide();
        transformers.forEach(tr => tr.hide());

        // SHOW TEXT PROXIES
        textProxies.forEach(node => node.show());

        // RESET TRANSFORM (Zoom/Pan)
        const stageScale = stage.scale();
        const stagePos = stage.position();

        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });

        // 4. PROCESS PANELS
        panels.forEach((panel) => {
            let cropX = 0, cropY = 0, cropW = 0, cropH = 0;
            let points: number[] = [];

            // A. DETERMINE GEOMETRY
            if (panel.points && Array.isArray(panel.points) && panel.points.length >= 4) {
                points = panel.points;
                const xs = points.filter((_, i) => i % 2 === 0);
                const ys = points.filter((_, i) => i % 2 === 1);
                cropX = Math.min(...xs);
                cropY = Math.min(...ys);
                cropW = Math.max(...xs) - cropX;
                cropH = Math.max(...ys) - cropY;
            } else {
                if (typeof panel.x === 'number') {
                    const sX = panel.scaleX || 1;
                    const sY = panel.scaleY || 1;
                    cropX = panel.x; cropY = panel.y;
                    cropW = panel.width * sX; cropH = panel.height * sY;
                } else if (Array.isArray(panel.box_2d)) {
                    const [y1, x1, y2, x2] = panel.box_2d;
                    cropX = x1; cropY = y1; cropW = x2 - x1; cropH = y2 - y1;
                }
                points = [cropX, cropY, cropX + cropW, cropY, cropX + cropW, cropY + cropH, cropX, cropY + cropH];
            }

            if (cropW <= 0 || cropH <= 0) return;

            // B. SNAPSHOT THE **STAGE**
            const sourceCanvas = stage.toCanvas({
                x: cropX,
                y: cropY,
                width: cropW,
                height: cropH,
                pixelRatio: 1
            });

            // C. CLIP & DRAW
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = cropW;
            finalCanvas.height = cropH;
            const ctx = finalCanvas.getContext('2d');

            if (ctx) {
                ctx.beginPath();
                if (points.length >= 2) {
                    ctx.moveTo(points[0] - cropX, points[1] - cropY);
                    for (let i = 2; i < points.length; i += 2) {
                        ctx.lineTo(points[i] - cropX, points[i + 1] - cropY);
                    }
                }
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(sourceCanvas, 0, 0);
                previews.push(finalCanvas.toDataURL('image/png'));
            }
        });

        // 5. RESTORE STATE
        stage.scale(stageScale);
        stage.position(stagePos);

        if (panelsLayer) panelsLayer.visible(wasPanelsVisible);
        transformers.forEach(tr => tr.show());

        // Hide Text Proxies again
        textProxies.forEach(node => node.hide());

        stage.batchDraw();

    } catch (error) {
        console.error("Error generating panel previews:", error);
    }

    return previews;
};
