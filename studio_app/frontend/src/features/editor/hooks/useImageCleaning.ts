import { useState } from 'react';
import { Balloon } from '../../../types';
import { api } from '../../../services/api';

interface UseImageCleaningProps {
    imageUrl: string;
    fileId: string;
    imgNaturalSize: { w: number; h: number };
    balloons: Balloon[];
    cleanUrl?: string | null;
}

export const useImageCleaning = ({
    imageUrl,
    fileId,
    imgNaturalSize,
    balloons,
    cleanUrl
}: UseImageCleaningProps) => {

    const [isProcessingCleaning, setIsProcessing] = useState(false);
    const [localCleanUrl, setLocalCleanUrl] = useState<string | null>(cleanUrl || null);

    const handleCleanImage = async (onSuccess?: (url: string) => void) => {
        if (!confirm("Isso irá gerar uma versão sem balões. Continuar?")) return;

        setIsProcessing(true);
        console.log("Chamando Inpainting...");

        try {
            const { w: imgW, h: imgH } = imgNaturalSize;
            if (!imgW || !imgH) {
                throw new Error("Dimensões da imagem não carregadas. Tente recarregar a página.");
            }

            // Prepare Payload (Convert to 1000x1000 relative coordinates)
            // Prepare Payload (Convert to 1000x1000 relative coordinates)
            const cleanPayload = balloons.map(b => {
                // 1. PRIORITIZE BOX_2D (Source of Truth from DB/Store)
                let ymin_n: number, xmin_n: number, ymax_n: number, xmax_n: number;

                if (b.box_2d && b.box_2d.length === 4) {
                    const [y1, x1, y2, x2] = b.box_2d;
                    // Direct Normalization from box_2d (Absolute Coords)
                    ymin_n = Math.round((y1 / imgH) * 1000);
                    xmin_n = Math.round((x1 / imgW) * 1000);
                    ymax_n = Math.round((y2 / imgH) * 1000);
                    xmax_n = Math.round((x2 / imgW) * 1000);
                } else if (b.x !== undefined && b.y !== undefined && b.width !== undefined && b.height !== undefined) {
                    // Fallback to Konva Props (Legacy/Visual)
                    const finalW = b.width * (b.scaleX || 1);
                    const finalH = b.height * (b.scaleY || 1);
                    ymin_n = Math.round((b.y / imgH) * 1000);
                    xmin_n = Math.round((b.x / imgW) * 1000);
                    ymax_n = Math.round(((b.y + finalH) / imgH) * 1000);
                    xmax_n = Math.round(((b.x + finalW) / imgW) * 1000);
                } else {
                    return null; // Invalid Item
                }

                // 2. NORMALIZE POLYGON POINTS (Critical Fix)
                // Convert Absolute Pixels -> 1000x1000 Relative Space
                let normalizedPoints = undefined;
                if (b.points && b.points.length > 2) {
                    normalizedPoints = b.points.map(p => ({
                        x: Math.round((p.x / imgW) * 1000),
                        y: Math.round((p.y / imgH) * 1000)
                    }));
                }

                return {
                    ...b,
                    box_2d: [ymin_n, xmin_n, ymax_n, xmax_n],
                    points: normalizedPoints // Backend now receives correctly scaled polygon
                };
            }).filter(Boolean);

            console.log("Payload Inpainting:", cleanPayload.length, "items");
            const result = await api.cleanPage(imageUrl, cleanPayload as any, fileId);

            // ADAPTER PATTERN: The API returns a raw backend response (clean_image_url).
            // We use it directly here to update local state, which flows into our system as 'cleanUrl'.
            if (result && result.clean_image_url) {
                setLocalCleanUrl(result.clean_image_url);
                console.log("✅ Image Cleaned Successfully:", result.clean_image_url);

                if (onSuccess && typeof onSuccess === 'function') {
                    onSuccess(result.clean_image_url);
                }
            }
        } catch (e: any) {
            console.error(e);
            alert("Erro na limpeza: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        handleCleanImage,
        localCleanUrl,
        setLocalCleanUrl,
        isProcessingCleaning
    };
};
