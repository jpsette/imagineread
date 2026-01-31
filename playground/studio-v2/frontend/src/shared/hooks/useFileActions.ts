import { useQueryClient } from '@tanstack/react-query';
import { useFileSystemStore } from '@app/store/useFileSystemStore';
import { api } from '@shared/api/api';
import { FileEntry } from '@shared/types';
import { useTabStore } from '@features/tabs/stores/useTabStore';

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
            // LOCAL PROJECT DETECTION: If parentId is a filesystem path, use Electron API
            const isLocalPath = parentId.startsWith('/');

            if (isLocalPath) {
                console.log('📂 [createFolder] Local path detected, using Electron createDirectory');

                if (window.electron?.local?.createDirectory) {
                    const newFolderPath = `${parentId}/${name}`;
                    const result = await window.electron.local.createDirectory(newFolderPath);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to create folder');
                    }
                    console.log('✅ [createFolder] Local folder created:', newFolderPath);
                } else {
                    console.error('createDirectory API not available');
                    alert('Criação de pasta local não disponível.');
                    return;
                }
            } else {
                // Cloud mode: call backend API
                await api.createFolder({ name, parentId, color });
            }

            invalidate();
        } catch (e) {
            console.error("Failed to create folder", e);
            alert('Erro ao criar pasta');
            throw e;
        }
    };

    const deleteFolder = async (id: string) => {
        try {
            const isLocalPath = id.startsWith('/');

            if (isLocalPath) {
                console.log('📂 [deleteFolder] Local path detected, using Electron deletePath:', id);

                if (window.electron?.local?.deletePath) {
                    const result = await window.electron.local.deletePath(id);
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to delete local folder');
                    }
                    console.log('✅ [deleteFolder] Local folder deleted successfully');
                } else {
                    console.warn('⚠️ [deleteFolder] deletePath API not available');
                    alert('Delete não disponível. Use o Finder para excluir a pasta.');
                    return;
                }
            } else {
                await api.deleteFileSystemEntry(id);
            }

            invalidate();

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
            // Close Tabs FIRST to prevent "Zombie State"
            const { closeTab } = useTabStore.getState();
            pageIds.forEach(id => {
                closeTab(id);
            });

            // LOCAL PROJECT DETECTION: Filter out local paths
            const cloudIds = pageIds.filter(id => !id.startsWith('/'));
            const localIds = pageIds.filter(id => id.startsWith('/'));

            // Delete local files via Electron API
            if (localIds.length > 0) {
                console.log('📂 [deletePages] Deleting local files:', localIds);

                if (window.electron?.local?.deletePath) {
                    const results = await Promise.all(
                        localIds.map(id => window.electron!.local.deletePath(id))
                    );
                    const failures = results.filter(r => !r.success);
                    if (failures.length > 0) {
                        console.error('Some local files failed to delete:', failures);
                    } else {
                        console.log('✅ [deletePages] Local files deleted successfully');
                    }
                } else {
                    console.warn('⚠️ [deletePages] deletePath API not available');
                }
            }

            // Delete cloud files via backend API
            if (cloudIds.length > 0) {
                await Promise.all(cloudIds.map(id => api.deleteFileSystemEntry(id)));
            }

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

    /**
     * Import files into a LOCAL project using Electron's native dialog.
     */
    const importFilesLocal = async (targetDir: string, onCopyStart?: () => void): Promise<boolean> => {
        console.log('[importFilesLocal] Called with targetDir:', targetDir);
        if (!window.electron?.local?.selectFiles) {
            console.error('selectFiles API not available');
            return false;
        }

        const result = await window.electron.local.selectFiles();

        if (!result.success || !result.filePaths || result.filePaths.length === 0) {
            if (!result.canceled) {
                console.error('Failed to select files:', result.error);
            }
            return false;
        }

        onCopyStart?.();

        let successCount = 0;
        for (const sourcePath of result.filePaths) {
            const fileName = sourcePath.split('/').pop() || sourcePath.split('\\').pop() || 'file';
            const destPath = `${targetDir}/${fileName}`;

            const copyResult = await window.electron.local.copyFile(sourcePath, destPath);
            if (copyResult.success) {
                successCount++;
            } else {
                console.error(`Failed to copy ${fileName}:`, copyResult.error);
            }
        }

        if (successCount > 0) {
            invalidate();
            return true;
        }

        return false;
    };

    /**
     * Import a comic (PDF, CBR, images) into a LOCAL project.
     */
    const importComicLocal = async (projectPath: string, onImportStart?: () => void): Promise<boolean> => {
        console.log('[importComicLocal] Called with projectPath:', projectPath);

        if (!window.electron?.local?.selectFiles) {
            console.error('selectFiles API not available');
            return false;
        }

        const result = await window.electron.local.selectFiles();

        if (!result.success || !result.filePaths || result.filePaths.length === 0) {
            if (!result.canceled) {
                console.error('Failed to select files:', result.error);
            }
            return false;
        }

        console.log('[importComicLocal] Files selected:', result.filePaths);
        onImportStart?.();

        const API_URL = 'http://127.0.0.1:8000';
        let successCount = 0;

        for (const sourcePath of result.filePaths) {
            const ext = sourcePath.split('.').pop()?.toLowerCase();

            if (ext === 'pdf' || ext === 'cbr' || ext === 'cbz' || ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
                try {
                    const response = await fetch(`${API_URL}/import_comic`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            source_path: sourcePath,
                            project_path: projectPath
                        })
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        const error = await response.json();
                        console.error(`[importComicLocal] Failed to import:`, error);
                    }
                } catch (error) {
                    console.error(`[importComicLocal] Error importing:`, error);
                }
            } else {
                // Unknown format - copy to project root
                const fileName = sourcePath.split('/').pop() || 'file';
                const destPath = `${projectPath}/${fileName}`;
                const copyResult = await window.electron.local.copyFile(sourcePath, destPath);
                if (copyResult.success) {
                    successCount++;
                }
            }
        }

        if (successCount > 0) {
            invalidate();
            return true;
        }

        return false;
    };

    return {
        createFolder,
        deleteFolder,
        deletePages,
        uploadPages,
        uploadPDF,
        reorderItems,
        renameItem,
        togglePin,
        importFilesLocal,
        importComicLocal
    };
};
