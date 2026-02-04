import React from 'react';
import { useEditorUIStore } from '@features/editor/uiStore';
import { useEditorStore } from '@features/editor/store';

// Components
import { VectorizeMenu } from '@features/editor/components/menus/VectorizeMenu';
import { LeftSidebar } from './LeftSidebar';
import { TranslateMenu } from '@features/editor/components/menus/TranslateMenu';
import { AnimateMenu } from '@features/editor/components/menus/AnimateMenu';
import { FloatingPanel } from '@shared/components/FloatingPanel';
import { TranslateLoadingOverlay } from '@features/editor/components/TranslateLoadingOverlay';

// Hooks
import { useTranslation } from '@features/editor/hooks/useTranslation';

// Types passed down from Logic Hooks to avoid re-initializing them here
interface EditorLeftPanelProps {
    vectorization: any; // The return type of useVectorization hook
    onOpenPanelGallery: () => void;
    onCenterPage?: () => void;
    cleanUrl?: string | null;
    isCleaned?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
    fileId?: string;  // For translation language detection
}

export const EditorLeftPanel = React.memo<EditorLeftPanelProps>(({
    vectorization,
    onOpenPanelGallery,
    onCenterPage,
    cleanUrl,
    isCleaned,
    isLoading,
    fileId
}) => {
    const { activeMode } = useEditorUIStore();
    const { balloons, setBalloons } = useEditorStore();

    // Translation hook
    const {
        translateAll,
        switchToLanguage,
        isTranslating,
        translatingFromLang,
        translatingToLang,
        activeLanguage,
        hasTranslations,
        translations,
        selectedGlossaryId,
        setSelectedGlossaryId
    } = useTranslation({
        fileId: fileId || '',
        balloons,
        setBalloons
    });

    return (
        <FloatingPanel
            defaultPosition={{ x: 16, y: 96 }}
            defaultSize={{ width: 300, height: 800 }}
            minWidth={250}
            maxWidth={350}
            minHeight={250}
        >
            <div className="w-full h-full bg-panel-bg rounded-2xl border border-border-color shadow-xl flex flex-col items-center overflow-hidden pointer-events-auto">
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
                            // onAddPanel and onAddMask removed - now using setActiveTool via store
                            isCleaned={isCleaned}
                        />
                    )}

                    {activeMode === 'edit' && (
                        <LeftSidebar onOpenPanelGallery={onOpenPanelGallery} onCenterPage={onCenterPage} />
                    )}

                    {activeMode === 'translate' && (
                        <TranslateMenu
                            fileId={fileId}
                            balloons={balloons}
                            isTranslating={isTranslating}
                            onStartTranslate={translateAll}
                            onSwitchLanguage={switchToLanguage}
                            onCenterPage={onCenterPage}
                            activeLanguage={activeLanguage}
                            hasTranslations={hasTranslations}
                            translations={translations}
                            selectedGlossaryId={selectedGlossaryId}
                            onSelectGlossary={setSelectedGlossaryId}
                        />
                    )}
                    {activeMode === 'animate' && <AnimateMenu />}
                </div>
            </div>

            {/* Translation Loading Overlay */}
            <TranslateLoadingOverlay
                isTranslating={isTranslating}
                sourceLang={translatingFromLang}
                targetLang={translatingToLang}
            />
        </FloatingPanel>
    );
});

