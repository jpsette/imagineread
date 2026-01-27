import { useState, useEffect, useMemo } from 'react';
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
    isFetching?: boolean; // New Prop
}

export const useVectorization = ({
    imageUrl,
    fileId,
    imgNaturalSize,
    editor,
    cleanUrl,
    currentBalloons = [],
    currentPanels = [],
    isFetching = false
}: UseVectorizationProps) => {

    // --- GLOBAL STORE ---
    const { balloons, setBalloons } = useEditorStore();

    // --- LOCAL STATE ---
    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');

    // RESET STATE ON FILE CHANGE (Hard Reset)
    // Fix: Unconditionally reset to 'idle' when ID changes.
    // The previous 'smart reset' failed because 'hasBalloons' was stale (from previous page).
    // The correct state will be restored by the Auto-Advance effect once new data arrives.
    useEffect(() => {
        setWorkflowStep('idle');
    }, [fileId]);

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

    // --- DERIVED STATE ---
    // --- DERIVED STATE ---
    // Fix: Robust check for balloon types (speech, thought, etc.) vs strict 'balloon' prefix
    const hasBalloons = currentBalloons.some(b =>
        ['speech', 'thought', 'whisper', 'shout', 'balloon-square', 'balloon-circle', 'balloon-thought', 'balloon-shout'].includes(b.type) ||
        b.type.startsWith('balloon')
    );

    const hasMasks = currentBalloons.some(b => b.type === 'mask');

    // Fix: Ensure we catch both explicit 'text' type AND legacy text usage if applicable
    const hasText = currentBalloons.some(b =>
        b.type === 'text' ||
        (b.text && b.text.trim().length > 0 && b.text !== 'Texto' && b.text !== 'Novo Texto')
    );
    const hasPanels = currentPanels && currentPanels.length > 0;

    // --- EFFECT: WORKFLOW SYNC ---
    useEffect(() => {
        // Fix: Block auto-advance if we are fetching new data (balloons might be stale!)
        if (!isFetching && balloons.length > 0 && workflowStep === 'idle') {
            const hasMasks = balloons.some(b => b.type === 'mask');
            const hasBalloons = balloons.some(b => b.type === 'balloon');

            if (hasBalloons) {
                setWorkflowStep('confirmed');
            } else if (hasMasks) {
                setWorkflowStep('mask');
            }
        }
    }, [balloons, workflowStep, isFetching]);

    return useMemo(() => ({
        // State
        workflowStep,
        setWorkflowStep,
        isProcessing: isBusy,
        localCleanUrl,
        setLocalCleanUrl,

        // Actions
        handleCreateMask,
        handleConfirmMask,
        handleDetectBalloon,
        detectPanels,
        handleCleanImage,
        detectText,

        // Wrappers
        detectBalloon: async () => {
            if (hasMasks && !hasBalloons) {
                console.log("🎭 Masks found, converting to balloons...");
                handleDetectBalloon();
            } else if (!hasMasks && !hasBalloons) {
                console.log("🔍 No masks, running YOLO...");
                await handleCreateMask();
            }
        },
        handleDetectText: detectText,

        // Flags
        canDetectBalloons: !isBusy && !hasBalloons,
        canDetectText: !isBusy && !hasText,
        canDetectPanels: !isBusy && !hasPanels,
        hasBalloons,
        hasText,
        hasPanels,

        // Granular Processing States
        isProcessingPanels,
        isProcessingBalloons,
        isProcessingOcr,
        isProcessingCleaning
    }), [
        // Dependencies
        workflowStep,
        isBusy,
        localCleanUrl,
        handleCreateMask,
        handleConfirmMask, // Assuming stable
        handleDetectBalloon, // Assuming stable
        detectPanels, // Assuming stable
        handleCleanImage,
        detectText,
        hasMasks,
        hasBalloons,
        hasText,
        hasPanels,
        isProcessingPanels,
        isProcessingBalloons,
        isProcessingOcr,
        isProcessingCleaning
    ]);
};
