import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';
import { Balloon, EditorTool } from '@shared/types'; // Imports from src/types

interface UseCanvasToolsProps {
    activeTool: EditorTool;
    setActiveTool: (tool: EditorTool) => void;
    onSelect: (id: string | null) => void;
    onBalloonAdd: (balloon: Balloon) => void;
    setEditingId: (id: string | null) => void;
    imgOriginal: HTMLImageElement | undefined;
}

export const useCanvasTools = ({
    activeTool,
    setActiveTool,
    onSelect,
    onBalloonAdd,
    setEditingId,
    imgOriginal
}: UseCanvasToolsProps) => {

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        // If clicking on an empty area
        const clickedOnEmpty = e.target === stage;

        // 1. Deselect if just clicking background
        if (clickedOnEmpty && activeTool === 'select') {
            onSelect(null);
            setEditingId(null); // Exit editing mode to restore Stage dragging
            return;
        }

        // Guard: Need image loaded to place things relative to it
        // Also guard: Only proceed if we clicked on empty space (not on another balloon)
        if (!imgOriginal || !clickedOnEmpty) return;

        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        const pos = transform.point(stage.getPointerPosition() || { x: 0, y: 0 });

        // 2. Create Text
        if (activeTool === 'text') {
            const newBalloon: Balloon = {
                id: uuidv4(),
                type: 'text',
                shape: 'rectangle',
                text: 'Novo Texto',
                fontSize: 20,
                direction: 'UP',
                tail_box_2d: [0, 0, 0, 0],
                box_2d: [Math.round(pos.y), Math.round(pos.x), Math.round(pos.y + 50), Math.round(pos.x + 150)],
                color: undefined
            };
            onBalloonAdd(newBalloon);
            onSelect(newBalloon.id);
            setActiveTool('select');
            setEditingId(newBalloon.id);
            return;
        }

        // 3. Create Balloon Shapes
        if (activeTool.startsWith('balloon-')) {
            const w = 150;
            const h = 100;

            const newBalloon: Balloon = {
                id: uuidv4(),
                type: activeTool as any,
                shape: 'rectangle',
                text: activeTool === 'balloon-thought' ? '...' : (activeTool === 'balloon-shout' ? 'AAAA!' : ''),
                color: '#ffffff',
                borderColor: '#000000',
                borderWidth: activeTool === 'balloon-shout' ? 3 : 1,
                fontSize: 14,
                box_2d: [
                    Math.round(pos.y - h / 2),
                    Math.round(pos.x - w / 2),
                    Math.round(pos.y + h / 2),
                    Math.round(pos.x + w / 2)
                ],
                direction: 'UP',
                tail_box_2d: [0, 0, 0, 0]
            };

            onBalloonAdd(newBalloon);
            onSelect(newBalloon.id);
            setActiveTool('select');
        }
    };

    return { handleStageClick };
};
