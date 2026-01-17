import { useFileSystemStore } from '../store/useFileSystemStore';
import { api } from '../services/api';
import { FileEntry } from '../types';

export const useFileActions = () => {
    const {
        fileSystem,
        setFileSystem
    } = useFileSystemStore();

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
            // API returns { status, id, name } usually, but strict types might vary.
            // Original code reloaded data. Let's reload to be safe and consistent.
            await reloadFileSystem();
        } catch (e) {
            console.error("Failed to create folder", e);
            alert('Erro ao criar pasta');
            throw e; // Re-throw so UI knows to clear state
        }
    };

    const deleteFolder = async (id: string) => {
        try {
            await api.deleteFileSystemEntry(id);
            // Local Optimistic Update
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
            // Append to store
            // We use direct setFileSystem with spread because we have multiple items
            setFileSystem([...fileSystem, ...uploadedPages]);
        }
    };

    const uploadPDF = async (file: File, targetParentId: string) => {
        try {
            const data = await api.uploadPDF(file, targetParentId);
            const comicId = `comic-${Date.now()}`;

            const newComic: FileEntry = {
                id: comicId,
                name: file.name.replace('.pdf', ''),
                type: 'comic',
                parentId: targetParentId,
                createdAt: new Date().toISOString(),
                isPinned: false,
                order: 0,
                url: ''
            };

            const newPages: FileEntry[] = data.pages.map((p: any, index: number) => ({
                id: p.id,
                name: p.name,
                type: 'file',
                parentId: comicId,
                url: p.url,
                createdAt: new Date().toISOString(),
                order: index,
                isPinned: false
            }));

            setFileSystem([...fileSystem, newComic, ...newPages]);
            alert('Quadrinho importado com sucesso!');

        } catch (error) {
            console.error(error);
            alert('Erro ao importar PDF.');
        }
    };

    const reorderItems = async (itemIds: string[]) => {
        try {
            await api.reorderItems(itemIds);

            // Update local store order
            // We need to update the 'order' field of the items in fileSystem
            // itemIds is the list of IDs in the new order.

            // Map of id -> order index
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

    return {
        createFolder,
        deleteFolder,
        deletePages,
        uploadPages,
        uploadPDF,
        reorderItems,
        renameItem
    };
};
