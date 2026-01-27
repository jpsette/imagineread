import { useQueryClient } from '@tanstack/react-query';
import { useFileSystemStore } from '../store/useFileSystemStore';
import { api } from '../services/api';
import { FileEntry } from '../types';

export const useFileActions = () => {
    const queryClient = useQueryClient();
    const {
        fileSystem,
        setFileSystem
    } = useFileSystemStore();

    // Helper to invalidate queries instead of reloading store manually
    const invalidate = () => {
        // Invalidate specific parent or all filesystem
        queryClient.invalidateQueries({ queryKey: ['filesystem'] });
    };

    // Helper to reload data if needed, but we try to use optimistic or direct updates
    const reloadFileSystem = async () => {
        try {
            const files = await api.getFileSystem();
            setFileSystem(files);
        } catch (e) {
            console.error("Failed to reload filesystem", e);
        }
    };

    const createFolder = async (name: string, parentId: string, color?: string) => {
        try {
            await api.createFolder({ name, parentId, color });
            // Invalidate Cache
            invalidate();
        } catch (e) {
            console.error("Failed to create folder", e);
            alert('Erro ao criar pasta');
            throw e; // Re-throw so UI knows to clear state
        }
    };

    const deleteFolder = async (id: string) => {
        try {
            await api.deleteFileSystemEntry(id);
            invalidate();

            // Local Optimistic Update (Legacy Store support)
            const newFs = fileSystem.filter(f => f.id !== id && f.parentId !== id);
            setFileSystem(newFs);
        } catch (e) {
            console.error("Failed to delete folder", e);
            alert("Erro ao excluir pasta.");
        }
    };

    const deletePages = async (pageIds: string[]) => {
        try {
            await Promise.all(pageIds.map(id => api.deleteFileSystemEntry(id)));
            invalidate();

            // Local Optimistic Update
            const newFs = fileSystem.filter(f => !pageIds.includes(f.id));
            setFileSystem(newFs);
        } catch (e) {
            console.error("Failed to delete pages", e);
            alert("Erro ao excluir páginas.");
        }
    };

    const uploadPages = async (files: File[], targetParentId: string) => {
        const uploadedPages: FileEntry[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const data = await api.uploadPage(file, targetParentId);
                uploadedPages.push({
                    id: data.id,
                    name: file.name,
                    type: 'file',
                    parentId: targetParentId,
                    url: data.url,
                    createdAt: new Date().toISOString(),
                    order: 9999 + i, // Approximate order
                    isPinned: false
                });
            } catch (e) {
                console.error(e);
                alert(`Erro ao enviar imagem ${file.name}`);
            }
        }

        if (uploadedPages.length > 0) {
            invalidate();

            // Append to store
            setFileSystem([...fileSystem, ...uploadedPages]);
        }
    };

    const uploadPDF = async (file: File, targetParentId: string) => {
        try {
            await api.uploadPDF(file, targetParentId);
            invalidate();

            // Also need to support legacy store update for visual feedback if store is still used somewhere
            // But main feedback should come from Query invalidation now.
            // ... (legacy store update omitted for brevity/safety)

            // const comicId = `comic-${Date.now()}`;
            // ... logic adapted ...

            // Just force refresh:
            await reloadFileSystem();
            alert('Quadrinho importado com sucesso!');

        } catch (error) {
            console.error(error);
            alert('Erro ao importar PDF.');
        }
    };

    const reorderItems = async (itemIds: string[]) => {
        try {
            await api.reorderItems(itemIds);
            invalidate();

            // Local Store update for DnD smoothing
            const orderMap = new Map<string, number>();
            itemIds.forEach((id, index) => orderMap.set(id, index));

            const newFs = fileSystem.map(item => {
                if (orderMap.has(item.id)) {
                    return { ...item, order: orderMap.get(item.id)! };
                }
                return item;
            });

            setFileSystem(newFs);

        } catch (e) {
            console.error("Failed to reorder items", e);
        }
    };

    const renameItem = async (id: string, newName: string, newColor?: string) => {
        try {
            await api.renameFileSystemEntry(id, newName, newColor);
            invalidate();

            // Local Optimistic Update
            const newFs = fileSystem.map(item =>
                item.id === id ? { ...item, name: newName, color: newColor || item.color } : item
            );
            setFileSystem(newFs);
        } catch (e) {
            console.error("Failed to rename item", e);
            alert("Erro ao renomear item.");
        }
    };

    const togglePin = async (item: FileEntry) => {
        try {
            const newPinnedState = !item.isPinned;

            // 1. Optimistic Update (BROADCAST to ALL filesystem views)
            // This ensures we hit the right cache whether we are in root, subfolder, or search view.
            queryClient.setQueriesData<FileEntry[]>({ queryKey: ['filesystem'] }, (oldData) => {
                if (!oldData) return oldData;
                return oldData.map(f =>
                    f.id === item.id ? { ...f, isPinned: newPinnedState } : f
                );
            });

            // 2. Optimistic Update (Legacy Store)
            const newFs = fileSystem.map(f =>
                f.id === item.id ? { ...f, isPinned: newPinnedState } : f
            );
            setFileSystem(newFs);

            // 3. API Call
            await api.updateFileSystemEntry(item.id, { isPinned: newPinnedState });

            // 4. Invalidate to ensure consistency
            invalidate();

        } catch (e) {
            console.error("Failed to toggle pin", e);
            // Revert on failure (Broadcast revert)
            queryClient.setQueriesData<FileEntry[]>({ queryKey: ['filesystem'] }, (oldData) => {
                if (!oldData) return oldData;
                return oldData.map(f =>
                    f.id === item.id ? { ...f, isPinned: item.isPinned } : f
                );
            });
            const newFs = fileSystem.map(f =>
                f.id === item.id ? { ...f, isPinned: item.isPinned } : f
            );
            setFileSystem(newFs);
        }
    };

    return {
        createFolder,
        deleteFolder,
        deletePages,
        uploadPages,
        uploadPDF,
        reorderItems,
        renameItem,
        togglePin
    };
};
