
import Konva from 'konva';
import { useEditorUIStore } from '../uiStore';
import { generatePanelPreviews } from '../utils/panelUtils';
import { Panel } from '../../../types';

interface UsePanelWorkflowProps {
    stageRef: React.RefObject<Konva.Stage>;
    panels: Panel[];
}

export const usePanelWorkflow = ({ stageRef, panels }: UsePanelWorkflowProps) => {
    const { setShowPreview, setPreviewImages } = useEditorUIStore();

    const handleSeparatePanels = async () => {
        console.log("🎬 Initiating Panel Separation...");

        if (!stageRef.current) {
            console.warn("⚠️ Stage ref is null");
            return;
        }

        // Call the utility function
        const croppedImages = generatePanelPreviews(stageRef.current, panels);

        if (croppedImages.length > 0) {
            console.log(`✅ Success! ${croppedImages.length} panels cropped.`);
            setPreviewImages(croppedImages);
            setShowPreview(true);
        } else {
            console.warn("⚠️ No panels were cropped. Check stage ref or panel data.");
        }
    };


    /**
     * Opens the Gallery.
     * If previews are empty (e.g. after reload), it attempts to regenerate them on the fly.
     */
    const handleOpenGallery = () => {
        const { previewImages, setPreviewImages, setShowPreview } = useEditorUIStore.getState();

        // 1. If we already have images, just open
        if (previewImages && previewImages.length > 0) {
            setShowPreview(true);
            return;
        }

        // 2. If no images but we have panels, Regenerate
        if (panels && panels.length > 0) {
            console.log("♻️ Regenerating Gallery Previews...");
            if (stageRef.current) {
                const regenerated = generatePanelPreviews(stageRef.current, panels);
                if (regenerated.length > 0) {
                    setPreviewImages(regenerated);
                    useEditorUIStore.getState().setShowPreview(true); // Using store directly to ensure update
                } else {
                    alert("Não foi possível gerar as pré-visualizações. Verifique se a imagem está carregada.");
                }
            } else {
                console.warn("Stage not ready yet.");
            }
        } else {
            // No panels to show
            setShowPreview(true); // Open empty modal (consistent with UI)
        }
    };

    return {
        handleSeparatePanels,
        handleOpenGallery
    };
};
