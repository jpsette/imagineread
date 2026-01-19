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
            const cleanPayload = balloons.map(b => {
                const anyB = b as any;
                let bx = anyB.x;
                let by = anyB.y;
                let bw = anyB.width;
                let bh = anyB.height;

                // Handle box_2d fallback
                if (bx === undefined || bw === undefined) {
                    if (b.box_2d && b.box_2d.length === 4) {
                        const [y1, x1, y2, x2] = b.box_2d;
                        bx = x1;
                        by = y1;
                        bw = x2 - x1;
                        bh = y2 - y1;
                    } else {
                        return null;
                    }
                }

                // Apply Scale
                const scaleX = anyB.scaleX || 1;
                const scaleY = anyB.scaleY || 1;
                const finalW = bw * scaleX;
                const finalH = bh * scaleY;

                // Normalize to 1000
                const ymin_n = Math.round((by / imgH) * 1000);
                const xmin_n = Math.round((bx / imgW) * 1000);
                const ymax_n = Math.round(((by + finalH) / imgH) * 1000);
                const xmax_n = Math.round(((bx + finalW) / imgW) * 1000);

                return {
                    ...b,
                    box_2d: [ymin_n, xmin_n, ymax_n, xmax_n]
                };
            }).filter(Boolean);

            console.log("Payload Inpainting:", cleanPayload.length, "items");
            const result = await api.cleanPage(imageUrl, cleanPayload as any, fileId);

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
