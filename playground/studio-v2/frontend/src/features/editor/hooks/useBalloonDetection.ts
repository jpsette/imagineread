import { useState } from 'react';
import { Balloon } from '@shared/types';
import { api } from '@shared/api/api';


// Redefine locally to avoid circular dependency if needed, or export from types
export type LocalWorkflowStep = 'idle' | 'mask' | 'confirmed';

interface UseBalloonDetectionProps {
    imageUrl: string;
    imgNaturalSize: { w: number; h: number };
    editor: any; // editor logic reference
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

                let isNormalized = false;
                // Check if normalized (0-1)
                if (v1 < 1 && v2 < 1 && v3 < 1 && v4 < 1) {
                    isNormalized = true;
                    x = v2 * safeW;
                    y = v1 * safeH;
                    width = (v4 - v2) * safeW;
                    height = (v3 - v1) * safeH;
                } else {
                    x = v1; y = v2; width = v3; height = v4;
                }

                // PROCESS POLYGON (Scale if needed)
                let processedPolygon = b.polygon;
                if (processedPolygon && isNormalized) {
                    processedPolygon = processedPolygon.map((p: number[]) => [
                        p[0] * safeW, // x
                        p[1] * safeH  // y
                    ]);
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
                    opacity: 1,
                    // Store the exact polygon payload hidden in the mask
                    detectedPolygon: processedPolygon
                } as Balloon;
            }).filter((item): item is Balloon => item !== null);

            if (newMasks.length > 0) {
                // Return data for chaining
                const existingNonMasks = balloons.filter(b => b.type !== 'mask');
                const combined = [...existingNonMasks, ...newMasks];

                setBalloons(combined);
                setWorkflowStep('mask');

                // FORCE VISIBILITY - REMOVED (User Request: Manual Toggle Only)
                // const { setShowMasks } = useEditorUIStore.getState();
                // setShowMasks(true);

                // AUTO-SELECT FIRST MASK
                if (newMasks[0]) {
                    editor.setSelectedBubbleId(newMasks[0].id);
                }

                return combined; // RETURNING DATA
            }
            return balloons; // Return existing if none found

        } catch (e: any) {
            console.error(e);
            alert("Erro ao detectar máscaras: " + e.message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    };

    // 3. DETECTAR BALÃO (Visual Conversion)
    const handleDetectBalloon = (currentBalloons?: Balloon[]) => {
        console.log("Detectando Balão - Convertendo...");

        // Use passed balloons (fresh) or store balloons (stale/current)
        const sourceBalloons = currentBalloons || balloons;

        const newList = sourceBalloons.flatMap(b => {
            if (b.type === 'mask') {
                // If we have exact polygon points, use them for the balloon shape
                const hasPolygon = b.detectedPolygon && b.detectedPolygon.length > 2;

                // Convert polygon points from [x, y] arrays to objects {x, y}
                let polygonPoints = hasPolygon
                    ? b.detectedPolygon!.map((p: any) => ({ x: p[0], y: p[1] }))
                    : undefined;

                // GEOMETRIC INFERENCE: Guess if it's a Box or Ellipse
                // Logic: Compare Polygon Area vs Bounding Box Area
                // NOTE: Run this BEFORE simplification to allow accurate area calculation on small shapes
                let inferredType = 'balloon'; // Default (Rounded Rect)
                let finalPoints = polygonPoints; // Will be simplified later if kept

                if (polygonPoints && polygonPoints.length > 4) {
                    // 1. Calculate Polygon Area (Shoelace Formula)
                    let area = 0;
                    for (let i = 0; i < polygonPoints.length; i++) {
                        const j = (i + 1) % polygonPoints.length;
                        area += polygonPoints[i].x * polygonPoints[j].y;
                        area -= polygonPoints[j].x * polygonPoints[i].y;
                    }
                    area = Math.abs(area) / 2;

                    // 2. Calculate Box Area
                    const width = b.box_2d[3] - b.box_2d[1];
                    const height = b.box_2d[2] - b.box_2d[0];
                    const boxArea = width * height;


                    if (boxArea > 0) {
                        const fillRatio = area / boxArea;
                        console.log(`Balloon ${b.id} Fill Ratio: ${fillRatio.toFixed(2)} (Area: ${Math.round(area)}, Box: ${Math.round(boxArea)})`);


                        // 3. Classification SIMPLIFIED (User Request)
                        // Binary Choice: Square or Circle.
                        // Cutoff: 0.80 (80%).
                        // > 0.79 -> Square/Rect (Includes 0.80)
                        // <= 0.79 -> Circle/Oval (Perfect Ellipse is ~0.785)

                        if (fillRatio > 0.79) {
                            inferredType = 'balloon-square';
                        } else {
                            inferredType = 'balloon-circle';
                        }

                        // FORCE CLEAN SHAPES:
                        // The user explicitly asked to fix "deformed" shapes.
                        // We discard the jagged YOLO polygon and let the Renderer draw a perfect CSS Shape.
                        finalPoints = undefined;
                    }
                }

                // SIMPLIFICATION: Filter points to reduce noise
                // Only simplify if we kept the polygon (implied type 'balloon')
                // SIMPLIFICATION REMOVED (finalPoints is always undefined)

                // 4. CLEAN GEOMETRIC SHAPES (User Request: "Back to Square/Oval with Perfect Lines")
                // We deliberately IGNORE the jagged YOLO polygon to ensure perfect SVG lines.

                finalPoints = undefined; // Force Konva Rect
                inferredType = 'balloon-square'; // Default to Rounded Rect strategy

                // B. Dynamic Radius Calculation (Unified Strategy)
                const width = b.box_2d[3] - b.box_2d[1];
                const height = b.box_2d[2] - b.box_2d[0];
                const minDim = Math.min(width, height);
                let dynamicRadius = 10;

                if (polygonPoints && polygonPoints.length > 4) {
                    // Use the polygon ONLY to calculate area density for shape guessing
                    let area = 0;
                    for (let i = 0; i < polygonPoints.length; i++) {
                        const j = (i + 1) % polygonPoints.length;
                        area += polygonPoints[i].x * polygonPoints[j].y;
                        area -= polygonPoints[j].x * polygonPoints[i].y;
                    }
                    area = Math.abs(area) / 2;
                    const bArea = width * height;
                    const ratio = bArea > 0 ? area / bArea : 0.8;

                    if (ratio > 0.88) {
                        // Sharp Box
                        dynamicRadius = Math.min(8, minDim * 0.1);
                    } else if (ratio > 0.75) {
                        // Standard Bubble (Rounded Rect)
                        dynamicRadius = Math.min(30, minDim * 0.25);
                    } else {
                        // Rounder (Oval-like) - But still a Rect to avoid overflow
                        dynamicRadius = Math.min(50, minDim * 0.4);
                    }
                }

                if (minDim < 40) dynamicRadius = Math.min(dynamicRadius, 6);

                const speechBalloon = {
                    ...b,
                    id: `balloon - ${b.id} `,
                    type: inferredType,
                    color: '#ffffff',
                    borderColor: '#000000',
                    borderWidth: 2,
                    borderRadius: dynamicRadius,
                    opacity: 1,
                    text: b.text || "",
                    points: finalPoints, // undefined -> Renders as perfect Rect
                    roughness: 0,
                    detectedPolygon: b.detectedPolygon // Keep debug overlay available if needed
                } as Balloon;
                return [b, speechBalloon];
            }
            return [b];
        });

        // OPTIONAL: If we want to support external state update (Chain)
        // Check if we provided custom source balloons (not supported yet in this fn scope efficiently without refactor)
        // But for 'Detect All', we rely on setBalloons updating the store.
        // However, React state updates are async. 
        // We MUST return 'newList' so the caller can pass it to the next function immediately.

        setBalloons(newList);
        return newList;
    };

    return {
        handleCreateMask,
        handleDetectBalloon,
        isProcessingBalloons
    };
};
