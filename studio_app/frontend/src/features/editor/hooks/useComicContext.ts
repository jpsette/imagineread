import { useMemo } from 'react';
import { useFileItem } from '../../dashboard/hooks/useFileItem';
import { useFolderContents } from '../../dashboard/hooks/useFolderContents';
import { FileEntry } from '../../../types';

export interface ComicContext {
    pages: FileEntry[];
    currentPageId: string;
    currentPageIndex: number;
    isLoading: boolean;
    parentId: string | null;
}

export const useComicContext = (
    currentFileId: string,
    knownParentId?: string | null
): ComicContext => {
    // 1. Get Current File Metadata (Only if we don't know the parent)
    const { data: file, isLoading: isFileLoading } = useFileItem(
        knownParentId ? null : currentFileId
    );

    // 2. Get Parent Folder Contents
    // Use knownParentId if available, otherwise derive from fetched file
    const parentId = knownParentId ?? (file?.parentId || null);

    // We only load folder if we have a parent ID
    const { data: folderContents, isLoading: isFolderLoading } = useFolderContents(parentId);

    // 3. Filter and Sort Pages
    const pages = useMemo(() => {
        if (!folderContents) return [];

        // Filter only files (images/comics)
        // Adjust filter logic based on what "pages" are. 
        // Assuming they are files with mimeType image/* or type='file'/'comic'
        // For now, let's include all 'file' and 'comic' types, excluding folders.
        return folderContents
            .filter(item => item.type === 'file' || item.type === 'comic')
            .sort((a, b) => {
                // Sort by name for now, or order if available
                return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            });
    }, [folderContents]);

    const currentPageIndex = useMemo(() => {
        return pages.findIndex(p => p.id === currentFileId);
    }, [pages, currentFileId]);

    return {
        pages,
        currentPageId: currentFileId,
        currentPageIndex,
        isLoading: isFileLoading || isFolderLoading,
        parentId
    };
};
