import { useState, useCallback } from 'react';

interface UseProjectRenamingProps {
    onRenameFolder: (id: string, newName: string, newColor?: string) => void;
}

export const useProjectRenaming = ({ onRenameFolder }: UseProjectRenamingProps) => {
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [renamingColor, setRenamingColor] = useState('');

    const initiateRename = useCallback((id: string, name: string, color: string) => {
        setRenamingId(id);
        setRenameValue(name);
        setRenamingColor(color);
    }, []);

    const cancelRename = useCallback(() => {
        setRenamingId(null);
        setRenameValue('');
        setRenamingColor('');
    }, []);

    const submitRename = useCallback(() => {
        if (renamingId && renameValue.trim()) {
            onRenameFolder(renamingId, renameValue.trim(), renamingColor);
            cancelRename();
        } else {
            cancelRename();
        }
    }, [renamingId, renameValue, renamingColor, onRenameFolder, cancelRename]);

    return {
        renamingId,
        renameValue,
        setRenameValue,
        renamingColor,
        setRenamingColor,
        initiateRename,
        cancelRename,
        submitRename
    };
};
