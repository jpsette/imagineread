
import { useState, useEffect } from 'react';
import { Balloon } from '../../../types';
import { api } from '../../../services/api';
import { useEditorStore } from '../store';

// Types
export type WorkflowStep = 'idle' | 'mask' | 'confirmed';

interface UseVectorizationProps {
    imageUrl: string;
    fileId: string;
    imgNaturalSize: { w: number; h: number };
    editor: any; // The object from useEditorLogic
    cleanUrl?: string | null;
}

export const useVectorization = ({
    imageUrl,
    fileId,
    imgNaturalSize,
    editor,
    cleanUrl
}: UseVectorizationProps) => {
    // Global Store
    const { balloons, setBalloons } = useEditorStore();

    // Local Logic State
    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [localCleanUrl, setLocalCleanUrl] = useState<string | null>(cleanUrl || null);

    // View State (Managed here because actions toggle it)
    // Actually, EditorView manages toggles, but `handleCleanImage` wants to switch to clean view.
    // We will return a request to switch view or just expose a setter?
    // Let's expose the state here BUT EditorView needs it for rendering.
    // Prompt said: "Returns an object with functions and state".

    // Logic for Workflow Sync
    useEffect(() => {
        if (balloons.length > 0 && workflowStep === 'idle') {
            const hasMasks = balloons.some(b => b.type === 'mask');
            const hasBalloons = balloons.some(b => b.type === 'balloon');

            if (hasBalloons) {
                setWorkflowStep('confirmed');
            } else if (hasMasks) {
                setWorkflowStep('mask');
            }
        }
    }, [balloons, workflowStep]);

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

            // Coordinate Conversion Logic (Essential)
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
                // We need to tell UI to show masks. 
                // We'll return a "shouldShowMasks" signal or let the UI observe balloons.
                // The Prompt says EditorView manages toggles.

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
        // Hint to UI: setShowMasks(false)
    };

    // 4. DETECTAR TEXTO (OCR)
    const handleDetectText = async () => {
        const targetBalloons = balloons.filter(b => b.type === 'balloon');
        if (targetBalloons.length === 0) {
            alert("Converta as máscaras em balões primeiro.");
            return;
        }

        setIsProcessing(true);
        console.log("Chamando OCR (Gemini/Vision)...");

        try {
            const apiBalloons = targetBalloons.map(b => {
                const [y1, x1, y2, x2] = b.box_2d;
                return {
                    box: [x1, y1, x2 - x1, y2 - y1],
                    text: "",
                    class_name: 'text_bubble'
                };
            });

            const result = await api.runOcr(imageUrl, apiBalloons as any);

            if (result && result.balloons) {
                const updatedBalloons = balloons.map(b => {
                    if (b.type === 'balloon') {
                        const matchIndex = targetBalloons.indexOf(b);
                        if (matchIndex !== -1 && result.balloons[matchIndex]) {
                            const newText = result.balloons[matchIndex].text;
                            if (newText) {
                                return { ...b, text: newText };
                            }
                        }
                    }
                    return b;
                });
                setBalloons(updatedBalloons);
            }

        } catch (e: any) {
            console.error(e);
            alert("Erro no OCR: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 5. LIMPAR IMAGEM (Inpainting) - ROBUST VERSION
    const handleCleanImage = async (onSuccess?: () => void) => {
        if (!confirm("Isso irá gerar uma versão sem balões. Continuar?")) return;
        setIsProcessing(true);
        console.log("Chamando Inpainting...");
        try {
            const { w: imgW, h: imgH } = imgNaturalSize;
            if (!imgW || !imgH) {
                throw new Error("Dimensões da imagem não carregadas. Tente recarregar a página.");
            }

            const cleanPayload = balloons.map(b => {
                const anyB = b as any;
                let bx = anyB.x;
                let by = anyB.y;
                let bw = anyB.width;
                let bh = anyB.height;

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

                const scaleX = anyB.scaleX || 1;
                const scaleY = anyB.scaleY || 1;
                const finalW = bw * scaleX;
                const finalH = bh * scaleY;

                const ymin_n = Math.round((by / imgH) * 1000);
                const xmin_n = Math.round((bx / imgW) * 1000);
                const ymax_n = Math.round(((by + finalH) / imgH) * 1000);
                const xmax_n = Math.round(((bx + finalW) / imgW) * 1000);

                return {
                    ...b,
                    box_2d: [ymin_n, xmin_n, ymax_n, xmax_n]
                };
            }).filter(Boolean);

            console.log("Payload Inpainting Corrigido:", cleanPayload.map((b: any) => b.box_2d));
            const result = await api.cleanPage(imageUrl, cleanPayload as any, fileId);

            if (result && result.clean_image_url) {
                setLocalCleanUrl(result.clean_image_url);
                if (onSuccess) onSuccess();
            }
        } catch (e: any) {
            console.error(e);
            alert("Erro na limpeza: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        workflowStep,
        setWorkflowStep, // Exposed if needed
        isProcessing,
        localCleanUrl,
        setLocalCleanUrl,
        handleCreateMask,
        handleConfirmMask,
        handleDetectBalloon,
        handleDetectText,
        handleCleanImage
    };
};
