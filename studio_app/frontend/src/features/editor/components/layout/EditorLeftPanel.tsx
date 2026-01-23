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
    cleanUrl?: string | null;
}

export const EditorLeftPanel: React.FC<EditorLeftPanelProps> = ({
    vectorization,
    editProps,
    handleSeparatePanels,
    previewImages,
    onOpenPanelGallery,
    cleanUrl }) => {
    const { activeMode } = useEditorUIStore();

    return (
        <aside className="absolute left-4 top-24 bottom-24 w-fit z-40 bg-transparent flex flex-col pointer-events-none">
            {/* DOCK CONTAINER */}
            <div className="w-[350px] bg-black/60 backdrop-blur-md rounded-2xl border border-glass-border shadow-glow-sm flex flex-col items-center py-4 overflow-hidden pointer-events-auto h-full">

                {/* Content Area - Logic to switch between icons mode (collapsed) and full mode (expanded) is handled via CSS/Group hover for now 
                    or we keep it simple: The panel IS the dock. 
                    
                    However, `VectorizeMenu` and `EditorSidebar` are complex components. 
                    If we squeeze them into a dock, they might break.
                    
                    Strategy:
                    The "Dock" should likely be a container that expands on hover or click.
                    Given the complexity of `EditorSidebar` (tool grid), a 64px width won't suffice unless we redesign `EditorSidebar` completely.
                    
                    Alternative Plan for "Floating Dock":
                    Keep the panel width (e.g. 280px) but make it floating and separated from the edge.
                    Glass background, rounded corners.
                    
                    Let's go with "Floating Panel" rather than "Tiny Icon Dock" to preserve the `EditorSidebar` layout without deep rewrites.
                */}

                <div className="w-full h-full bg-transparent px-4">
                    {activeMode === 'vectorize' && (
                        <VectorizeMenu
                            workflowStep={vectorization.workflowStep}
                            isProcessing={vectorization.isProcessing}
                            // Granular Loading
                            isProcessingBalloons={vectorization.isProcessingBalloons}
                            isProcessingCleaning={vectorization.isProcessingCleaning}
                            isProcessingPanels={vectorization.isProcessingPanels}
                            isProcessingOcr={vectorization.isProcessingOcr}
                            onCreateMask={vectorization.handleCreateMask}
                            onConfirmMask={vectorization.handleConfirmMask}
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
                </div>
            </div>
        </aside>
    );
};
