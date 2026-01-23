import { useState } from 'react';
import { Balloon } from '../../../types';
import { api } from '../../../services/api';
import { useEditorUIStore } from '../uiStore';

// Redefine locally to avoid circular dependency if needed, or export from types
export type LocalWorkflowStep = 'idle' | 'mask' | 'confirmed';

interface UseBalloonDetectionProps {
    imageUrl: string;
    imgNaturalSize: { w: number; h: number };
    editor: any; // editor logic reference
    balloons: Balloon[];
    setBalloons: (balloons: Balloon[]) => void;
    setWorkflowStep: (step: any) => void;
    workflowStep: any;
}

export const useBalloonDetection = ({
    imageUrl,
    imgNaturalSize,
    editor,
    balloons,
    setBalloons,
    setWorkflowStep,
    workflowStep
}: UseBalloonDetectionProps) => {

    const [isProcessingBalloons, setIsProcessing] = useState(false);

    // 1. CRIAR MÁSCARA (YOLO)
    const handleCreateMask = async () => {
        setIsProcessing(true);
        try {
            console.log("Chamando YOLO...");
            const data = await api.detectBalloons(imageUrl);
            const rawBalloons = data.balloons;

            if (!rawBalloons || !Array.isArray(rawBalloons) || rawBalloons.length === 0) {
                alert('Nenhum balão encontrado.');
                return;
            }

            // Coordinate Conversion Logic
            const newMasks: Balloon[] = rawBalloons.map((b: any, index: number) => {
                const rawBox = b.box || b.box_2d || b.bbox;
                if (!Array.isArray(rawBox) || rawBox.length < 4) return null;

                let x, y, width, height;
                const [v1, v2, v3, v4] = rawBox.map(Number);
                const { w: imageWidth, h: imageHeight } = imgNaturalSize;

                // Fallbacks
                const safeW = imageWidth || 1000;
                const safeH = imageHeight || 1000;

                // Check if normalized (0-1)
                if (v1 < 1 && v2 < 1 && v3 < 1 && v4 < 1) {
                    x = v2 * safeW;
                    y = v1 * safeH;
                    width = (v4 - v2) * safeW;
                    height = (v3 - v1) * safeH;
                } else {
                    x = v1; y = v2; width = v3; height = v4;
                }

                return {
                    id: `mask - ${Date.now()} -${index} `,
                    type: 'mask',
                    text: b.text || '',
                    box_2d: [y, x, y + height, x + width],
                    shape: 'rectangle',
                    color: 'rgba(255, 0, 0, 0.4)',
                    borderColor: 'red',
                    borderWidth: 2,
                    borderRadius: 4,
                    opacity: 1
                } as unknown as Balloon;
            }).filter((item): item is Balloon => item !== null);

            if (newMasks.length > 0) {
                const existingNonMasks = balloons.filter(b => b.type !== 'mask');
                setBalloons([...existingNonMasks, ...newMasks]);
                setWorkflowStep('mask');

                // FORCE VISIBILITY
                const { setShowMasks } = useEditorUIStore.getState();
                setShowMasks(true);

                // AUTO-SELECT FIRST MASK
                if (newMasks[0]) {
                    editor.setSelectedBubbleId(newMasks[0].id);
                }
            }

        } catch (e: any) {
            console.error(e);
            alert("Erro ao detectar máscaras: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. CONFIRMAR MÁSCARA
    const handleConfirmMask = () => {
        if (workflowStep === 'mask' || balloons.some(b => b.type === 'mask')) {
            setWorkflowStep('confirmed');
            editor.setSelectedBubbleId(null);
        }
    };

    // 3. DETECTAR BALÃO (Visual Conversion)
    const handleDetectBalloon = () => {
        console.log("Detectando Balão - Convertendo...");
        const newList = balloons.flatMap(b => {
            if (b.type === 'mask') {
                const speechBalloon = {
                    ...b,
                    id: `balloon - ${b.id} `,
                    type: 'balloon',
                    color: '#ffffff',
                    borderColor: '#000000',
                    borderWidth: 2,
                    borderRadius: 10,
                    opacity: 1,
                    text: b.text || ""
                } as unknown as Balloon;
                return [b, speechBalloon];
            }
            return [b];
        });

        setBalloons(newList);
    };

    return {
        handleCreateMask,
        handleConfirmMask,
        handleDetectBalloon,
        isProcessingBalloons
    };
};
