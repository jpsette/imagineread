import React from 'react';
import { useEditorUIStore } from '../../uiStore';

// Components
import { VectorizeMenu } from '../menus/VectorizeMenu';
import { EditorSidebar } from '../EditorSidebar';
import { TranslateMenu } from '../menus/TranslateMenu';
import { AnimateMenu } from '../menus/AnimateMenu';

// Types passed down from Logic Hooks to avoid re-initializing them here
interface EditorLeftPanelProps {
    vectorization: any; // The return type of useVectorization hook
    editProps: any; // Props for EditorSidebar (Delete logic etc)
    handleSeparatePanels: () => void;
    previewImages: string[];
    onOpenPanelGallery: () => void;
}

export const EditorLeftPanel: React.FC<EditorLeftPanelProps> = ({
    vectorization,
    editProps,
    handleSeparatePanels,
    previewImages,
    onOpenPanelGallery
}) => {
    const { activeMode } = useEditorUIStore();

    return (
        <aside className="w-80 border-r border-zinc-800 bg-zinc-900 flex flex-col z-10 transition-all duration-300 ease-in-out">
            {activeMode === 'vectorize' && (
                <VectorizeMenu
                    workflowStep={vectorization.workflowStep}
                    isProcessing={vectorization.isProcessing}
                    onCreateMask={vectorization.handleCreateMask}
                    onConfirmMask={vectorization.handleConfirmMask}
                    onDetectBalloon={vectorization.detectBalloon}
                    onDetectText={vectorization.detectText}
                    onCleanImage={vectorization.handleCleanImage}
                    canDetectBalloons={vectorization.canDetectBalloons}
                    canDetectText={vectorization.canDetectText}
                    canDetectPanels={vectorization.canDetectPanels}
                    hasBalloons={vectorization.hasBalloons}
                    hasText={vectorization.hasText}
                    hasPanels={vectorization.hasPanels}
                    onDetectPanels={vectorization.detectPanels}
                    onSeparatePanels={handleSeparatePanels}
                    isPanelsConfirmed={true}
                    onConfirmPanels={() => { }}
                    onOpenPanelGallery={onOpenPanelGallery}
                />
            )}

            {activeMode === 'edit' && (
                <EditorSidebar
                    editProps={editProps}
                />
            )}

            {activeMode === 'translate' && <TranslateMenu />}
            {activeMode === 'animate' && <AnimateMenu />}
        </aside>
    );
};
