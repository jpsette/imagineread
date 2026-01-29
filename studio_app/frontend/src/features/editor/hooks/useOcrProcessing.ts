import { useState } from 'react';
import { Balloon } from '../../../types';
import { api } from '../../../services/api';

interface UseOcrProcessingProps {
    imageUrl: string;
    balloons: Balloon[];
    setBalloons: (balloons: Balloon[]) => void;
}

export const useOcrProcessing = ({
    imageUrl,
    balloons,
    setBalloons
}: UseOcrProcessingProps) => {

    const [isProcessingOcr, setIsProcessing] = useState(false);

    const detectText = async (currentBalloons?: Balloon[]) => {
        // Use passed balloons or store balloons
        const sourceBalloons = currentBalloons || balloons;

        // FIX: Include ALL balloon sub-types (square, circle, etc.)
        // Previously strict 'balloon' check caused ignoring inferred shapes
        const targetBalloons = sourceBalloons.filter(b =>
            b.type === 'balloon' ||
            b.type === 'balloon-square' ||
            b.type === 'balloon-circle' ||
            b.type === 'balloon-thought' ||
            b.type === 'balloon-shout'
        );

        if (targetBalloons.length === 0) {
            alert("Converta as máscaras em balões primeiro.");
            return;
        }

        setIsProcessing(true);
        console.log("🚀 START: Chamando OCR...");

        try {

            // Prepare payload with Sanitization
            const apiBalloons = targetBalloons.map(b => {
                // Ensure integer coordinates
                const [y1, x1, y2, x2] = b.box_2d.map(coord => Math.round(coord));

                // Sanitize ID (Trim spaces that might have crept in)
                const cleanId = b.id.trim();

                return {
                    id: cleanId,
                    box: [x1, y1, x2 - x1, y2 - y1], // [x, y, w, h]
                    text: "",
                    class_name: 'text_bubble'
                };
            });

            console.log("🚀 OCR Payload:", {
                image: imageUrl,
                sampleBox: apiBalloons[0]?.box,
                count: apiBalloons.length
            });

            const result = await api.runOcr(imageUrl, apiBalloons as any);
            console.log("✅ OCR Raw Result:", result);

            if (result && result.balloons) {
                // 1. Create a Map of NORMALIZED ID -> Text
                const responseMap = new Map<string, string>();
                result.balloons.forEach((b: any) => {
                    if (b.id && b.text) {
                        responseMap.set(String(b.id).trim(), b.text);
                    }
                });

                console.log(`🗺️ OCR Map Entries:`, Array.from(responseMap.entries()));

                // 2. Update balloons using NORMALIZED ID matching
                // 2. Update balloons using NORMALIZED ID matching
                // CRITICAL: We must map over the FULL source list, not just targetBalloons
                const updatedBalloons = sourceBalloons.map(b => {
                    // Check if it is ANY balloon type (balloon, balloon-square, etc.)
                    const isBalloon = b.type.startsWith('balloon');

                    if (isBalloon) {
                        const cleanId = b.id.trim();
                        if (responseMap.has(cleanId)) {
                            const detectedText = responseMap.get(cleanId);
                            console.log(`🎯 Match found for ${cleanId}: "${detectedText?.substring(0, 10)}..."`);
                            return { ...b, text: detectedText || "" };
                        } else {
                            // Only warn if it was in the target set (check if type is supported)
                            console.warn(`⚠️ No OCR match for balloon: ${cleanId}`);
                        }
                    }
                    return b;
                });

                setBalloons(updatedBalloons);
            }

        } catch (error: any) {
            console.error("❌ CRITICAL OCR ERROR:", error);
            alert("Erro no OCR: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        detectText,
        isProcessingOcr
    };
};
