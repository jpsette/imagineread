
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

    return {
        handleSeparatePanels
    };
};
