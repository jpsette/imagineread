/**
 * useBalloonDetection
 * 
 * Hook for balloon detection and conversion workflow.
 * Uses utility functions from balloonDetectionUtils for pure logic.
 */

import { useState } from 'react';
import { Balloon } from '@shared/types';
import { api } from '@shared/api/api';
import {
    convertRawBalloonToMask,
    convertMaskToSpeechBalloon,
    ImageSize
} from './balloonDetectionUtils';

// Redefine locally to avoid circular dependency
export type LocalWorkflowStep = 'idle' | 'mask' | 'confirmed';

interface UseBalloonDetectionProps {
    imageUrl: string;
    imgNaturalSize: ImageSize;
    editor: any;
    balloons: Balloon[];
    setBalloons: (balloons: Balloon[]) => void;
    setWorkflowStep: (step: any) => void;
}

export const useBalloonDetection = ({
    imageUrl,
    imgNaturalSize,
    editor,
    balloons,
    setBalloons,
    setWorkflowStep,
}: UseBalloonDetectionProps) => {

    const [isProcessingBalloons, setIsProcessing] = useState(false);

    // 1. CREATE MASK (YOLO)
    const handleCreateMask = async () => {
        setIsProcessing(true);
        try {
            console.log("Chamando YOLO...");
            const data = await api.detectBalloons(imageUrl);
            const rawBalloons = data.balloons;

            if (!rawBalloons || !Array.isArray(rawBalloons) || rawBalloons.length === 0) {
                alert('Nenhum balão encontrado.');
                return balloons;
            }

            // Convert raw data to mask balloons using utility function
            const newMasks: Balloon[] = rawBalloons
                .map((raw: any, index: number) => convertRawBalloonToMask(raw, index, imgNaturalSize))
                .filter((item): item is Balloon => item !== null);

            if (newMasks.length > 0) {
                const existingNonMasks = balloons.filter(b => b.type !== 'mask');
                const combined = [...existingNonMasks, ...newMasks];

                setBalloons(combined);
                setWorkflowStep('mask');

                // Auto-select first mask
                if (newMasks[0]) {
                    editor.setSelectedBubbleId(newMasks[0].id);
                }

                return combined;
            }
            return balloons;

        } catch (e: any) {
            console.error(e);
            alert("Erro ao detectar máscaras: " + e.message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. DETECT BALLOON (Visual Conversion)
    const handleDetectBalloon = (currentBalloons?: Balloon[]) => {
        console.log("Detectando Balão - Convertendo...");

        const sourceBalloons = currentBalloons || balloons;

        const newList = sourceBalloons.flatMap(b => {
            if (b.type === 'mask') {
                // Convert mask to speech balloon using utility function
                const speechBalloon = convertMaskToSpeechBalloon(b);
                return [b, speechBalloon];
            }
            return [b];
        });

        setBalloons(newList);
        return newList;
    };

    return {
        handleCreateMask,
        handleDetectBalloon,
        isProcessingBalloons
    };
};
