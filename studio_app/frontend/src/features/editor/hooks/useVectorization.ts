import { useState, useEffect } from 'react';
import { useEditorStore } from '../store';

// Imported Specialized Hooks
import { usePanelDetection } from './usePanelDetection';
import { useBalloonDetection } from './useBalloonDetection';
import { useOcrProcessing } from './useOcrProcessing';
import { useImageCleaning } from './useImageCleaning';

// Types
export type WorkflowStep = 'idle' | 'mask' | 'confirmed';

interface UseVectorizationProps {
    imageUrl: string;
    fileId: string;
    imgNaturalSize: { w: number; h: number };
    editor: any;
    cleanUrl?: string | null;
    currentBalloons?: any[];
    currentPanels?: any[];
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

    // --- GLOBAL STORE ---
    const { balloons, setBalloons } = useEditorStore();

    // --- LOCAL STATE ---
    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');

    // --- 1. HOOK: PANELS ---
    const { detectPanels, isProcessingPanels } = usePanelDetection({
        imageUrl,
        imgNaturalSize
    });

    // --- 2. HOOK: BALLOONS (YOLO) ---
    const {
        handleCreateMask,
        handleConfirmMask,
        handleDetectBalloon,
        isProcessingBalloons
    } = useBalloonDetection({
        imageUrl,
        imgNaturalSize,
        editor,
        balloons,
        setBalloons,
        workflowStep,
        setWorkflowStep
    });

    // --- 3. HOOK: OCR (TEXT) ---
    const { detectText, isProcessingOcr } = useOcrProcessing({
        imageUrl,
        balloons,
        setBalloons
    });

    // --- 4. HOOK: CLEANING (INPAINTING) ---
    const {
        handleCleanImage,
        localCleanUrl,
        setLocalCleanUrl,
        isProcessingCleaning
    } = useImageCleaning({
        imageUrl,
        fileId,
        imgNaturalSize,
        balloons,
        cleanUrl
    });

    // --- UNIFIED LOADING STATE ---
    const isBusy = isProcessingPanels || isProcessingBalloons || isProcessingOcr || isProcessingCleaning;

    // --- EFFECT: RESET ON NEW IMAGE ---
    // REMOVED: This was causing a race condition wiping data loaded by useEditorLogic.
    // Lifecycle management is now centralized in useEditorLogic.ts

    /* 
    useEffect(() => {
       ... removed destructive logic ...
    }, ...);
    */

    // --- DERIVED STATE ---
    const hasBalloons = currentBalloons.some(b => b.type.startsWith('balloon'));
    const hasMasks = currentBalloons.some(b => b.type === 'mask'); // Added helper check
    const hasText = currentBalloons.some(b =>
        b.type === 'text' ||
        (b.text && b.text.trim().length > 0 && b.text !== 'Texto' && b.text !== 'Novo Texto')
    );
    const hasPanels = currentPanels && currentPanels.length > 0;

    // --- EFFECT: WORKFLOW SYNC ---
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

    return {
        // State
        workflowStep,
        setWorkflowStep,
        isProcessing: isBusy,
        localCleanUrl,
        setLocalCleanUrl,

        // Actions (Direct access if needed)
        handleCreateMask,
        handleConfirmMask,
        handleDetectBalloon,
        detectPanels,
        handleCleanImage,
        detectText,

        // Wrappers (Smart Logic)
        detectBalloon: async () => {
            // FIX: Smart switching between Detection and Conversion
            if (hasMasks && !hasBalloons) {
                console.log("🎭 Masks found, converting to balloons...");
                handleDetectBalloon(); // Convert
            } else if (!hasMasks && !hasBalloons) {
                console.log("🔍 No masks, running YOLO...");
                await handleCreateMask(); // Detect
            }
        },
        handleDetectText: detectText,

        // Flags
        canDetectBalloons: !isBusy && !hasBalloons,
        canDetectText: !isBusy && !hasText,
        canDetectPanels: !isBusy && !hasPanels,
        hasBalloons,
        hasText,
        hasPanels
    };
};
