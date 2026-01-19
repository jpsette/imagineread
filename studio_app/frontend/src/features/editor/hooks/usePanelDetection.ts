import { useState } from 'react';
import { api } from '../../../services/api';
import { Panel } from '../../../types';
import { useEditorStore } from '../store';

interface UsePanelDetectionProps {
    imageUrl: string;
    imgNaturalSize: { w: number; h: number };
}

export const usePanelDetection = ({ imageUrl, imgNaturalSize }: UsePanelDetectionProps) => {
    const [isProcessingPanels, setIsProcessing] = useState(false);
    const { setPanels } = useEditorStore();

    const detectPanels = async () => {
        if (!imageUrl) return;

        setIsProcessing(true);
        console.log("Detecting Panels (Real API)...");

        try {
            const data = await api.detectPanels(imageUrl);
            const rawPanels = data.panels;

            if (!rawPanels || !Array.isArray(rawPanels) || rawPanels.length === 0) {
                alert('Nenhum quadro encontrado.');
                return;
            }

            const { w: imageWidth, h: imageHeight } = imgNaturalSize;
            if (!imageWidth || !imageHeight) throw new Error("Dimensões da imagem não disponíveis");

            // --- CONFIGURATION ---
            // INSET: How many pixels to shrink the box inwards.
            // 4px is usually the sweet spot to kill white borders/gutters.
            const INSET = 5;

            const newPanels: Panel[] = rawPanels.map((p: any, index: number) => {
                const rawBox = p.box || p.box_2d || p.bbox;
                if (!Array.isArray(rawBox) || rawBox.length < 4) return null;

                let x, y, width, height;
                const [v1, v2, v3, v4] = rawBox.map(Number);

                // Normalization Check
                if (v1 < 1 && v2 < 1 && v3 < 1 && v4 < 1) {
                    // Normalized coords logic (rarely used by YOLO usually, but supported)
                    const rawX = v2 * imageWidth;
                    const rawY = v1 * imageHeight;
                    const rawW = (v4 - v2) * imageWidth;
                    const rawH = (v3 - v1) * imageHeight;

                    x = rawX + INSET;
                    y = rawY + INSET;
                    width = rawW - (INSET * 2);
                    height = rawH - (INSET * 2);
                } else {
                    // Absolute pixels logic
                    const rawX = v2;
                    const rawY = v1;
                    const rawW = v4 - v2;
                    const rawH = v3 - v1;

                    // APPLY INSET TO TIGHTEN THE CROP
                    // Increase X/Y (move right/down)
                    // Decrease Width/Height (shrink size)
                    x = rawX + INSET;
                    y = rawY + INSET;
                    width = rawW - (INSET * 2);
                    height = rawH - (INSET * 2);
                }

                // Safety Clamp (Don't let inset invert the shape or go out of bounds)
                x = Math.max(0, x);
                y = Math.max(0, y);
                width = Math.max(1, width);
                height = Math.max(1, height);

                // Final Panel Object
                return {
                    id: `panel-${Date.now()}-${index}`,
                    type: 'panel',
                    order: index + 1,
                    // box_2d is kept as fallback reference
                    box_2d: [y, x, y + height, x + width],
                    // POINTS are the source of truth for the Editor
                    points: [x, y, x + width, y, x + width, y + height, x, y + height]
                };
            }).filter((item): item is Panel => item !== null);

            if (newPanels.length > 0) {
                setPanels(newPanels);
            } else {
                alert("API retornou vazia.");
            }

        } catch (e: any) {
            console.error("Panel detection failed", e);
            alert("Erro ao detectar quadros: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        detectPanels,
        isProcessingPanels
    };
};
