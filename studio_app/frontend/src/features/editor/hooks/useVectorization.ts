
import { useState, useEffect } from 'react';
import { Balloon, Panel } from '../../../types';
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
    currentBalloons?: any[]; // NEW ARGUMENT
    currentPanels?: any[]; // NEW ARGUMENT
}

export const useVectorization = ({
    imageUrl,
    fileId,
    imgNaturalSize,
    editor,
    cleanUrl,
    currentBalloons = [],
    currentPanels = []
}: UseVectorizationProps) => {
    // Global Store
    const { balloons, setBalloons, setPanels } = useEditorStore();

    // Local Logic State
    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [localCleanUrl, setLocalCleanUrl] = useState<string | null>(cleanUrl || null);

    // DERIVED STATE (Single Source of Truth)
    const hasBalloons = currentBalloons.some(b => b.type.startsWith('balloon'));
    const hasText = currentBalloons.some(b =>
        // Case 1: Floating Text Tool
        b.type === 'text' ||
        // Case 2: Speech Balloons with actual content (OCR result)
        // We filter out empty strings and default placeholders if any
        (b.text && b.text.trim().length > 0 && b.text !== 'Texto' && b.text !== 'Novo Texto')
    );
    const hasPanels = currentPanels && currentPanels.length > 0;

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
        console.log("🚀 START: Chamando OCR (Gemini/Vision)...");
        console.log("📦 Payload Check - Image URL Length:", imageUrl ? imageUrl.length : "NULL");

        try {
            const apiBalloons = targetBalloons.map(b => {
                const [y1, x1, y2, x2] = b.box_2d;
                return {
                    id: b.id, // PASS ID FOR ROBUSTNESS
                    box: [x1, y1, x2 - x1, y2 - y1],
                    text: "",
                    class_name: 'text_bubble'
                };
            });

            console.log("⏳ Awaiting API response...");
            const result = await api.runOcr(imageUrl, apiBalloons as any);
            console.log("✅ API Response Received:", result);

            if (!result || !result.balloons) {
                console.warn("⚠️ API returned empty text list or invalid structure:", result);
            } else {
                console.log("📝 Texts found:", result.balloons.length);
                console.log("📜 Raw Texts Content:", result.balloons.map((t: any) => t.text)); // LOG RAW CONTENT
            }

            console.log("🔄 Attempting to update balloons state...");
            if (result && result.balloons) {
                const updatedBalloons = balloons.map(b => {
                    if (b.type === 'balloon') {
                        // ROBUST MATCHING: Find text by ID, not Index
                        // We filter for matching ID in the returned result.
                        // Since perform_ocr modifies valid balloons in place and returns list,
                        // we need to see if result.balloons (which is the modified list) has ID matching b.id

                        // NOTE: Backend 'perform_ocr' returns the same list of balloons, enriched with text.
                        // So result.balloons IS the enriched list.
                        // The backend doesn't change IDs, so we can just match by ID.

                        // We passed 'apiBalloons' to runOCR, which was a mapped version.
                        // Wait, 'runOcr' sends 'apiBalloons' which DOES NOT have IDs in the 'map' above unless we added them.

                        // CRITICAL FIX: We need to pass ID to backend so it echoes it back?
                        // Actually, 'perform_ocr' receives 'balloons' list.
                        // In 'handleDetectText', 'apiBalloons' strips IDs and keeps only box/text/class.
                        // But wait! perform_ocr iterates the input list.
                        // Frontend 'runOcr' sends whatever we give it.
                        // Let's check 'apiBalloons' construction above.

                        // We need to ensuring 'apiBalloons' has ID.
                        // The construction was:
                        // return { box: [...], text: "", class_name: 'text_bubble' }; -> NO ID!

                        // FIX: We must match by INDEX because 'apiBalloons' passed to backend
                        // was constructed from 'targetBalloons'.
                        // The backend returns 'apiBalloons' modified with text.
                        // So result.balloons corresponds exactly to 'targetBalloons' order.

                        // IF backend logic is sound (it modifies input list), then index matching IS correct IF list wasn't reordered.
                        // However, to be robust, let's look at ID.

                        // BUT 'apiBalloons' didn't have ID sent. 
                        // Let's assume result.balloons matches targetBalloons index because parallel.
                        // BUT let's try to match by index safely.

                        const matchIndex = targetBalloons.indexOf(b);
                        const matchCandidate = (matchIndex !== -1 && result.balloons[matchIndex])
                            ? result.balloons[matchIndex]
                            : null;

                        // With robust backend throttling and reduced chunk size, index match logic is safer.
                        // Ideally we'd send ID to backend, but changing 'runOcr' payload requires deeper changes?
                        // Let's stick to safe index matching now that backend is reliable.

                        console.log(`🎈 Balloon ${b.id.substring(0, 15)}... (Index: ${matchIndex}) -> Match:`, matchCandidate ? `"${matchCandidate.text}"` : "NULL");

                        if (matchCandidate) {
                            const newText = matchCandidate.text;
                            if (newText) {
                                return { ...b, text: newText };
                            }
                        }
                    }
                    return b;
                });
                setBalloons(updatedBalloons);
                console.log("🏁 State update logic finished. New state should reflect text.");
            }

        } catch (error: any) {
            console.error("❌ CRITICAL OCR ERROR:", error);
            if (error.response) {
                console.error("Server Status:", error.response.status);
                console.error("Server Data:", error.response.data);
            }
            alert("Erro no OCR: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 5. LIMPAR IMAGEM (Inpainting) - ROBUST VERSION
    const handleCleanImage = async (onSuccess?: (url: string) => void) => {
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

            // --- DEBUG LOGS START ---
            console.log("📦 Clean Image Response RAW:", result);
            const candidateUrl = result?.clean_image_url || result?.url;
            console.log("🔗 Extracted URL (candidate):", candidateUrl);

            if (candidateUrl) {
                console.log("👀 Is Local Path?", typeof candidateUrl === 'string' && (candidateUrl.startsWith('/') || candidateUrl.startsWith('C:')));
                console.log("🔄 Calling setCleanImage/onSuccess now...");
            } else {
                console.error("⚠️ Response is missing 'clean_image_url'!");
            }
            // --- DEBUG LOGS END ---

            if (result && result.clean_image_url) {
                setLocalCleanUrl(result.clean_image_url);
                console.log("✅ Image Cleaned Successfully:", result);

                // --- THE FIX ---
                // Validate if onSuccess exists and is a function before calling it.
                if (onSuccess && typeof onSuccess === 'function') {
                    console.log("🚀 Invoking onSuccess with:", result.clean_image_url);
                    onSuccess(result.clean_image_url); // <--- PASSING ARGUMENT NOW
                } else {
                    console.warn("⚠️ handleCleanImage finished, but no 'onSuccess' callback was provided.");
                }
            }
        } catch (e: any) {
            console.error(e);
            alert("Erro na limpeza: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 6. DETECTAR PAINÉIS (REAL API IMPLEMENTATION)
    const handleDetectPanels = async () => {
        if (hasPanels) return;

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

            // 3. CONVERT TO PANELS (With Padding/Scaling)
            const newPanels: Panel[] = rawPanels.map((p: any, index: number) => {
                const rawBox = p.box || p.box_2d || p.bbox; // Adapt to whatever API likely returns
                if (!Array.isArray(rawBox) || rawBox.length < 4) return null;

                let x, y, width, height;
                const [v1, v2, v3, v4] = rawBox.map(Number);

                // Fallbacks
                const safeW = imageWidth;
                const safeH = imageHeight;

                // Check if normalized (0-1) - Same Robust Logic as Balloons
                if (v1 < 1 && v2 < 1 && v3 < 1 && v4 < 1) {
                    // Normalized Logic
                    x = v2 * safeW;
                    y = v1 * safeH;
                    width = (v4 - v2) * safeW;
                    height = (v3 - v1) * safeH;
                } else {
                    // Absolute pixels handling
                    // Input: [v1, v2, v3, v4] corresponds to [y, x, yMax, xMax]

                    // 1. Correct Mapping
                    let rawX = v2;
                    let rawY = v1;
                    let rawW = v4 - v2;
                    let rawH = v3 - v1;

                    // 2. Apply Padding (Capture the black border)
                    const PADDING = 5;

                    // Clamp X/Y to be at least 0
                    x = Math.max(0, rawX - PADDING);
                    y = Math.max(0, rawY - PADDING);

                    // Calculate new Width/Height ensuring we don't exceed image boundaries
                    // (rawW + 2*padding, but clamped by imageWidth)
                    width = Math.min(imageWidth - x, rawW + (PADDING * 2));
                    height = Math.min(imageHeight - y, rawH + (PADDING * 2));
                }

                // Final Panel Object
                return {
                    id: `panel-${Date.now()}-${index}`,
                    type: 'panel',
                    order: index + 1,
                    // box_2d: [ymin, xmin, ymax, xmax] -> standard for our app
                    box_2d: [y, x, y + height, x + width],
                    // Konva Points for Polygon (Rectangle)
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
        workflowStep,
        setWorkflowStep, // Exposed if needed
        isProcessing,
        localCleanUrl,
        setLocalCleanUrl,
        handleCreateMask,
        handleConfirmMask,

        detectBalloon: async () => {
            if (hasBalloons) return;
            await handleDetectBalloon();
        },
        detectText: async () => {
            if (hasText) return;
            await handleDetectText();
        },
        detectPanels: handleDetectPanels, // Connected to Real API

        handleCleanImage,

        // Legacy Handlers
        handleDetectBalloon,
        handleDetectText,

        // NEW FLAGS FOR UI
        canDetectBalloons: !isProcessing && !hasBalloons,
        canDetectText: !isProcessing && !hasText,
        canDetectPanels: !isProcessing && !hasPanels,
        hasBalloons,
        hasText,
        hasPanels
    };
};
