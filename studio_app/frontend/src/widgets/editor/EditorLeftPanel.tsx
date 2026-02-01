import React from 'react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';

// Components
import { VectorizeMenu } from '@features/editor/components/menus/VectorizeMenu';
import { LeftSidebar } from './LeftSidebar';
import { TranslateMenu } from '@features/editor/components/menus/TranslateMenu';
import { AnimateMenu } from '@features/editor/components/menus/AnimateMenu';
import { FloatingPanel } from '@shared/components/FloatingPanel';

// Types passed down from Logic Hooks to avoid re-initializing them here
interface EditorLeftPanelProps {
    vectorization: any; // The return type of useVectorization hook
    onOpenPanelGallery: () => void;
    cleanUrl?: string | null;
    isCleaned?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
}

export const EditorLeftPanel = React.memo<EditorLeftPanelProps>(({
    vectorization,
    onOpenPanelGallery,
    cleanUrl,
    isCleaned,
    isLoading
}) => {
    const { activeMode } = useEditorUIStore();

    return (
        <FloatingPanel
            defaultPosition={{ x: 16, y: 96 }}
            defaultSize={{ width: 300, height: 800 }}
            minWidth={250}
            maxWidth={350}
            minHeight={250}
        >
            <div className="w-full h-full bg-black/60 backdrop-blur-md rounded-2xl border border-glass-border shadow-glow-sm flex flex-col items-center overflow-hidden pointer-events-auto">
                <div className="w-full h-full bg-transparent px-4 pt-2 overflow-y-auto custom-scrollbar">
                    {activeMode === 'vectorize' && (
                        <VectorizeMenu
                            workflowStep={vectorization.workflowStep}
                            isProcessing={vectorization.isProcessing}
                            // Granular Loading
                            isLoading={isLoading}
                            isProcessingBalloons={vectorization.isProcessingBalloons}
                            isProcessingCleaning={vectorization.isProcessingCleaning}
                            isProcessingPanels={vectorization.isProcessingPanels}
                            isProcessingOcr={vectorization.isProcessingOcr}
                            handleDetectAll={vectorization.handleDetectAll} // NEW HERO ACTION
                            onCreateMask={vectorization.handleCreateMask}
                            // onConfirmMask removed (Legacy)
                            onDetectBalloon={vectorization.detectBalloon}
                            onDetectText={vectorization.detectText}
                            onCleanImage={vectorization.handleCleanImage}
                            initialCleanUrl={cleanUrl}
                            canDetectBalloons={vectorization.canDetectBalloons}
                            canDetectText={vectorization.canDetectText}
                            canDetectPanels={vectorization.canDetectPanels}
                            hasBalloons={vectorization.hasBalloons}
                            hasText={vectorization.hasText}
                            hasPanels={vectorization.hasPanels}
                            onDetectPanels={vectorization.detectPanels}
                            isPanelsConfirmed={true}
                            onConfirmPanels={() => { }}
                            onOpenPanelGallery={onOpenPanelGallery}
                            onAddPanel={() => {
                                // Add Panel Logic
                                const { setPanels, panels } = useEditorStore.getState();
                                const newId = `panel-${Date.now()}`;
                                const newPanel: any = {
                                    id: newId,
                                    type: 'panel',
                                    order: panels.length + 1,
                                    box_2d: [100, 100, 500, 500], // Default Box
                                    points: [100, 100, 500, 100, 500, 500, 100, 500] // Default Rect
                                };
                                setPanels((prev: any[]) => [...prev, newPanel]);
                            }}
                            isCleaned={isCleaned}
                        />
                    )}

                    {activeMode === 'edit' && (
                        <LeftSidebar onOpenPanelGallery={onOpenPanelGallery} />
                    )}

                    {activeMode === 'translate' && <TranslateMenu />}
                    {activeMode === 'animate' && <AnimateMenu />}
                </div>
            </div>
        </FloatingPanel>
    );
});
