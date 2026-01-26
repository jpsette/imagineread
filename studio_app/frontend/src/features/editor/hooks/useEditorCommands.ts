import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEditorStore } from '../store';
import { useEditorUIStore } from '../uiStore';
import { api } from '../../../services/api';
import { commandManager } from '../commands/CommandManager';
import { AddBalloonCommand, RemoveBalloonCommand, UpdateBalloonCommand } from '../commands/balloonCommands';
import { Balloon } from '../../../types';

interface UseEditorCommandsProps {
    fileId: string;
}

export const useEditorCommands = ({ fileId }: UseEditorCommandsProps) => {
    const queryClient = useQueryClient();
    const { selectedId: selectedBubbleId, setSelectedId: setSelectedBubbleId } = useEditorUIStore();

    // --- MANUAL SAVE ---
    const saveChanges = async () => {
        const toastId = toast.loading('Salvando alterações...');
        try {
            const currentBalloons = useEditorStore.getState().balloons;
            const currentPanels = useEditorStore.getState().panels;
            const cleanImageUrl = useEditorUIStore.getState().cleanImageUrl;

            await api.updateFileData(fileId, {
                balloons: currentBalloons,
                panels: currentPanels,
                cleanUrl: cleanImageUrl || undefined,
            });

            // Invalidate Cache
            queryClient.invalidateQueries({ queryKey: ['file', fileId] });

            const store = useEditorStore.getState();
            store.setIsDirty(false);
            store.setIsSaved(true);

            toast.success('Salvo com sucesso!', { id: toastId });
        } catch (e: any) {
            console.error("Manual save error", e);
            toast.error(`Erro ao salvar: ${e.message}`, { id: toastId });
        }
    };

    // --- BALLOON ACTIONS ---
    const updateBubble = useCallback((id: string, updates: Partial<Balloon>) => {
        commandManager.execute(new UpdateBalloonCommand(id, updates));
    }, []);

    const handleAddBalloon = useCallback(() => {
        const newId = `manual-${Date.now()}`;
        const newBubble: Balloon = {
            id: newId,
            text: '',
            box_2d: [400, 400, 600, 600],
            shape: 'rectangle',
            type: 'speech',
            customFontSize: 12,
            borderRadius: 20,
            borderWidth: 1,
            tailWidth: 20,
            roughness: 1,
            tailTip: { x: 550, y: 650 },
            tailControl: { x: 525, y: 625 }
        };

        commandManager.execute(new AddBalloonCommand(newBubble));
        setSelectedBubbleId(newId);
    }, [setSelectedBubbleId]);

    const handleDeleteBalloon = useCallback(() => {
        if (!selectedBubbleId) return;
        commandManager.execute(new RemoveBalloonCommand(selectedBubbleId));
        setSelectedBubbleId(null);
    }, [selectedBubbleId, setSelectedBubbleId]);

    const addTailToSelected = useCallback(() => {
        if (!selectedBubbleId) return;
        const currentBalloons = useEditorStore.getState().balloons;
        const bubble = currentBalloons.find(b => b.id === selectedBubbleId);
        if (!bubble) return;

        if (bubble.tailTip) {
            // Remove Tail
            commandManager.execute(new UpdateBalloonCommand(selectedBubbleId, { tailTip: null }));
        } else {
            // Add Tail
            const [, xmin, ymax] = bubble.box_2d; // [ymin, xmin, ymax, xmax]
            const xmax = bubble.box_2d[3];

            const centerX = xmin + (xmax - xmin) / 2;
            const bottomY = ymax;

            commandManager.execute(new UpdateBalloonCommand(selectedBubbleId, {
                tailTip: { x: centerX + 50, y: bottomY + 100 },
                tailCurve: null
            }));
        }
    }, [selectedBubbleId]);

    // --- VIEW ACTIONS ---
    const handleZoom = useCallback((delta: number) => {
        const currentZoom = useEditorUIStore.getState().zoom;
        const newZoom = Math.max(0.1, Math.min(5, currentZoom + delta));
        useEditorUIStore.getState().setZoom(newZoom);
    }, []);

    const getSelectedBubble = useCallback(() => {
        return useEditorStore.getState().balloons.find(b => b.id === selectedBubbleId);
    }, [selectedBubbleId]);

    return {
        saveChanges,
        updateBubble,
        handleAddBalloon,
        handleDeleteBalloon,
        addTailToSelected,
        handleZoom,
        getSelectedBubble
    };
};
