import { useCallback } from 'react';
import { FileEntry } from '../../../../types';

interface UseProjectNavigationProps {
    fileSystem: FileEntry[];
    currentFolderId: string | null;
    onOpenItem: (item: FileEntry) => void;
    onOpenComic: (comicId: string) => void;
}

export const useProjectNavigation = ({
    fileSystem,
    currentFolderId,
    onOpenItem,
    onOpenComic
}: UseProjectNavigationProps) => {

    const handleNavigate = useCallback((item: FileEntry) => {
        // Check for Explicit OR Implicit Comic (Lazy Loading)
        const isComic = item.type === 'comic' || item.isComic;

        if (isComic) {
            onOpenComic(item.id);
            return;
        }

        if (item.type === 'folder') {
            const children = fileSystem.filter(f => f.parentId === item.id);
            const hasPages = children.some(f => f.type === 'file');
            const hasSubFolders = children.some(f => f.type === 'folder');

            if (hasPages && !hasSubFolders) {
                onOpenComic(item.id);
            } else {
                onOpenItem(item);
            }
        }
        else {
            const parentId = currentFolderId || item.parentId;
            if (parentId) onOpenComic(parentId);
        }
    }, [fileSystem, currentFolderId, onOpenItem, onOpenComic]);

    return {
        handleNavigate
    };
};
