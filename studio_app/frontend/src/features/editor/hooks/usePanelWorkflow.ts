
import Konva from 'konva';
import Konva from 'konva';
import { toast } from 'sonner';
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
        const { setPreviewImages, setShowPreview } = useEditorUIStore.getState();

        if (panels && panels.length > 0) {
            console.log("♻️ Regenerating Gallery Previews...");
            if (stageRef.current) {
                try {
                    // FORCE REGENERATION - Ignore cache
                    const regenerated = generatePanelPreviews(stageRef.current, panels);

                    if (regenerated.length > 0) {
                        setPreviewImages(regenerated);
                        useEditorUIStore.getState().setShowPreview(true);
                    } else {
                        toast.error("Não foi possível gerar as pré-visualizações. Tente novamente.");
                    }
                } catch (error) {
                    console.error("Gallery Generation Error:", error);
                    toast.error(`Erro ao gerar galeria: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
                }
            } else {
                toast.error("O Canvas ainda não está pronto. Aguarde...");
            }
        } else {
            // No panels defined, show empty gallery or whatever default behavior
            setShowPreview(true);
        }
    };

    return {
        handleSeparatePanels,
        handleOpenGallery
    };
};
