import React from 'react';
import { WorkflowStep } from '../../hooks/useVectorization';
import { useEditorUIStore } from '../../uiStore';

// Sub-Components
import { Step1Mask } from './vectorize/Step1Mask';
import { Step2Balloons } from './vectorize/Step2Balloons';
import { Step3Text } from './vectorize/Step3Text';
import { Step4Cleaning } from './vectorize/Step4Cleaning';
import { Step5Structure } from './vectorize/Step5Structure';

interface VectorizeMenuProps {
    // State from Hook (Logic)
    workflowStep: WorkflowStep;
    isProcessing: boolean;
    // Granular Loading
    isProcessingBalloons: boolean;
    isProcessingCleaning: boolean;
    isProcessingPanels: boolean;
    isProcessingOcr: boolean;

    // Actions from Hook (Logic)
    onCreateMask: () => void;
    onConfirmMask: () => void;
    onDetectBalloon: () => void;
    onDetectText: () => void;
    onCleanImage: (onSuccess?: (url: string) => void) => void;

    // Flags
    canDetectBalloons: boolean;
    canDetectText: boolean;
    canDetectPanels?: boolean;
    hasBalloons: boolean;
    hasText: boolean;
    hasPanels?: boolean;
    onDetectPanels?: () => void;

    // Panel Logic
    isPanelsConfirmed?: boolean;
    onConfirmPanels?: () => void;

    // Gallery
    onOpenPanelGallery?: () => void;
    initialCleanUrl?: string | null;
    isCleaned?: boolean; // Backend flag indicating if file was previously cleaned
    // Loading State from Parent
    isLoading?: boolean;
}

export const VectorizeMenu: React.FC<VectorizeMenuProps> = ({
    workflowStep,
    isProcessing,
    isLoading = false,
    // Destructure Granular Flags
    isProcessingBalloons,
    isProcessingCleaning,
    isProcessingPanels,
    isProcessingOcr,

    onCreateMask,
    onConfirmMask,
    onDetectBalloon,
    onDetectText,
    onCleanImage,
    canDetectBalloons,
    canDetectText,
    canDetectPanels,
    hasBalloons,
    hasText,
    hasPanels,
    onDetectPanels,
    isPanelsConfirmed,
    onConfirmPanels,
    onOpenPanelGallery,
    initialCleanUrl,
    isCleaned
}) => {

    // --- STORE HOOKS ---
    const { cleanImageUrl } = useEditorUIStore();

    // --- DERIVED STATE ---
    const hasCleanImage = !!(isCleaned || cleanImageUrl || initialCleanUrl);

    return (
        <div className={`flex flex-col gap-1 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>

            <Step1Mask
                workflowStep={workflowStep}
                isProcessingBalloons={isProcessingBalloons}
                isProcessing={isProcessing}
                isLoading={isLoading}
                onCreateMask={onCreateMask}
                onConfirmMask={onConfirmMask}
            />

            <div className="h-px bg-[#333] w-full my-2"></div>

            <Step2Balloons
                hasBalloons={hasBalloons}
                canDetectBalloons={canDetectBalloons}
                isProcessingBalloons={isProcessingBalloons}
                isLoading={isLoading}
                onDetectBalloon={onDetectBalloon}
            />

            <Step3Text
                hasText={hasText}
                canDetectText={canDetectText}
                isProcessingOcr={isProcessingOcr}
                isLoading={isLoading}
                onDetectText={onDetectText}
            />

            <div className="h-px bg-[#333] w-full my-2"></div>

            <Step4Cleaning
                hasCleanImage={hasCleanImage}
                isProcessingCleaning={isProcessingCleaning}
                isProcessing={isProcessing}
                isLoading={isLoading}
                onCleanImage={onCleanImage}
            />

            <div className="h-px bg-[#333] w-full my-2"></div>

            <Step5Structure
                hasPanels={hasPanels}
                canDetectPanels={canDetectPanels}
                isPanelsConfirmed={isPanelsConfirmed}
                isProcessingPanels={isProcessingPanels}
                onDetectPanels={onDetectPanels}
                onConfirmPanels={onConfirmPanels}
                onOpenPanelGallery={onOpenPanelGallery}
            />

        </div>
    );
};
