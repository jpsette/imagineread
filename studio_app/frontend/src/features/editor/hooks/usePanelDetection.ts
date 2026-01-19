import { useState } from 'react';
import { api } from '../../../services/api';
import { Panel } from '../../../types';
import { useEditorStore } from '../store';

interface UsePanelDetectionProps {
    imageUrl: string;
    imgNaturalSize: { w: number; h: number };
}

export const usePanelDetection = ({ imageUrl, imgNaturalSize }: UsePanelDetectionProps) => {
    // Local state for this specific process
    const [isProcessingPanels, setIsProcessing] = useState(false);

    // Access Global Store to update panels
    const { setPanels } = useEditorStore();

    const detectPanels = async () => {
        if (!imageUrl) return;

        setIsProcessing(true);
        console.log("Detecting Panels (Real API)...");

        try {
            const data = await api.detectPanels(imageUrl); // Calls POST /analisar-quadros
            const rawPanels = data.panels;

            if (!rawPanels || !Array.isArray(rawPanels) || rawPanels.length === 0) {
                alert('Nenhum quadro encontrado.');
                return;
            }

            const { w: imageWidth, h: imageHeight } = imgNaturalSize;
            if (!imageWidth || !imageHeight) throw new Error("Dimensões da imagem não disponíveis");

            // CONVERT TO PANELS (Preserving PADDING=0 Logic)
            const newPanels: Panel[] = rawPanels.map((p: any, index: number) => {
                const rawBox = p.box || p.box_2d || p.bbox;
                if (!Array.isArray(rawBox) || rawBox.length < 4) return null;

                let x, y, width, height;
                const [v1, v2, v3, v4] = rawBox.map(Number);

                // Fallbacks
                const safeW = imageWidth;
                const safeH = imageHeight;

                // Check if normalized (0-1)
                if (v1 < 1 && v2 < 1 && v3 < 1 && v4 < 1) {
                    // Normalized Logic
                    x = v2 * safeW;
                    y = v1 * safeH;
                    width = (v4 - v2) * safeW;
                    height = (v3 - v1) * safeH;
                } else {
                    // Absolute pixels handling
                    const rawX = v2;
                    const rawY = v1;
                    const rawW = v4 - v2;
                    const rawH = v3 - v1;

                    // CRITICAL: Keep PADDING at 0 as requested by user
                    const PADDING = 0;

                    // Clamp X/Y to be at least 0
                    x = Math.max(0, rawX - PADDING);
                    y = Math.max(0, rawY - PADDING);

                    // Calculate new Width/Height ensuring we don't exceed image boundaries
                    width = Math.min(imageWidth - x, rawW + (PADDING * 2));
                    height = Math.min(imageHeight - y, rawH + (PADDING * 2));
                }

                // Final Panel Object
                return {
                    id: `panel-${Date.now()}-${index}`,
                    type: 'panel',
                    order: index + 1,
                    box_2d: [y, x, y + height, x + width],
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
