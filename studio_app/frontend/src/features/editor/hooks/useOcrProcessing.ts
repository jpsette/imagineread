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

    const detectText = async () => {
        const targetBalloons = balloons.filter(b => b.type === 'balloon');
        if (targetBalloons.length === 0) {
            alert("Converta as máscaras em balões primeiro.");
            return;
        }

        setIsProcessing(true);
        console.log("🚀 START: Chamando OCR...");

        try {
            // Prepare payload
            const apiBalloons = targetBalloons.map(b => {
                const [y1, x1, y2, x2] = b.box_2d;
                return {
                    id: b.id,
                    box: [x1, y1, x2 - x1, y2 - y1],
                    text: "",
                    class_name: 'text_bubble'
                };
            });

            console.log("⏳ Awaiting API response...");
            const result = await api.runOcr(imageUrl, apiBalloons as any);
            console.log("✅ API Response Received:", result);

            if (result && result.balloons) {
                const updatedBalloons = balloons.map(b => {
                    if (b.type === 'balloon') {
                        // Match logic (robust index matching)
                        const matchIndex = targetBalloons.indexOf(b);
                        const matchCandidate = (matchIndex !== -1 && result.balloons[matchIndex])
                            ? result.balloons[matchIndex]
                            : null;

                        if (matchCandidate && matchCandidate.text) {
                            return { ...b, text: matchCandidate.text };
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
