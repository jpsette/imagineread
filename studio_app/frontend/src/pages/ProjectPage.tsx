import React, { useState } from 'react';
import ProjectDetail from '../features/dashboard/ProjectDetail';
import { useUIStore } from '../store/useUIStore';
import { useProjectStore } from '../store/useProjectStore';
import { useFileSystemStore } from '../store/useFileSystemStore';
import { useFileActions } from '../hooks/useFileActions';
import { PROJECT_THEMES } from '../constants/theme';

const ProjectPage: React.FC = () => {
    // Global Stores
    const { projects, currentProjectId } = useProjectStore();
    const {
        fileSystem,
        currentFolderId,
        setCurrentFolderId,
        setOpenedComicId,
    } = useFileSystemStore();
    const { setView } = useUIStore();

    // Actions
    const { createFolder, deleteFolder, deletePages, uploadPages, uploadPDF } = useFileActions();

    // Local View State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState(PROJECT_THEMES[0].bg);
    const [loading, setLoading] = useState(false); // Local loading state for uploads

    // Derived Data
    const currentProject = projects.find(p => p.id === currentProjectId) || null;

    // Glue Handlers
    const handleCreateFolderWrapper = async () => {
        if (!newFolderName) return;

        const targetParentId = currentFolderId || currentProject?.rootFolderId;
        if (!targetParentId) {
            console.error("No target parent found for folder creation");
            return;
        }

        setLoading(true);
        try {
            await createFolder(newFolderName, targetParentId);
            setIsCreatingFolder(false);
            setNewFolderName('');
            setNewFolderColor(PROJECT_THEMES[0].bg);
        } catch (e) {
            // Error logged in hook
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (currentFolderId) {
            // Check if we are at the root folder of the current project
            if (currentProject && currentFolderId === currentProject.rootFolderId) {
                setView('dashboard');
                return;
            }

            const current = fileSystem.find(f => f.id === currentFolderId);
            // If parent is null or matches root logic
            if (!current?.parentId) {
                setView('dashboard');
            } else {
                setCurrentFolderId(current.parentId);
            }
        } else {
            setView('dashboard');
        }
    };

    const handleImportFiles = async (files: File[]) => {
        const pdfs = files.filter(f => f.type === 'application/pdf');
        const images = files.filter(f => f.type.startsWith('image/'));

        setLoading(true);
        try {
            // Process sequentially or parallel, hooks handle their own errors/alerts
            for (const pdf of pdfs) {
                const targetParentId = currentFolderId || currentProject?.rootFolderId || 'root';
                await uploadPDF(pdf, targetParentId);
            }

            if (images.length > 0) {
                const targetParentId = currentFolderId || currentProject?.rootFolderId;
                if (targetParentId) {
                    await uploadPages(images, targetParentId);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePagesWrapper = (ids: string[]) => {
        if (confirm('Tem certeza que deseja excluir os itens selecionados?')) {
            deletePages(ids);
        }
    };

    return (
        <div className="w-full h-full">
            <ProjectDetail
                project={currentProject}
                currentFolderId={currentFolderId}
                fileSystem={fileSystem as any} // Cast if types slightly mismatch strictness, or ensure types match
                onOpenItem={(node) => setCurrentFolderId(node.id)}
                onOpenComic={setOpenedComicId}
                onDeleteFolder={(id, e) => {
                    e?.stopPropagation();
                    if (confirm('Tem certeza que deseja excluir esta pasta e todo seu conteúdo?')) {
                        deleteFolder(id);
                    }
                }}
                loading={loading}
                error={null}
                searchTerm=""
                sortOrder="az"
                isCreatingFolder={isCreatingFolder}
                setIsCreatingFolder={setIsCreatingFolder}
                newItemName={newFolderName}
                setNewItemName={setNewFolderName}
                newItemColor={newFolderColor}
                setNewItemColor={setNewFolderColor}
                editingFolder={null}
                setEditingFolder={() => { }}
                editName=""
                setEditName={() => { }}
                editColor=""
                setEditColor={() => { }}
                PROJECT_THEMES={PROJECT_THEMES}
                onCreateFolder={handleCreateFolderWrapper}
                onUpdateFolder={() => { }}
                onStartEditingFolder={() => { }}
                onTogglePin={() => { }}
                onImportFiles={handleImportFiles}
                onDeletePages={handleDeletePagesWrapper}
                onBack={handleBack}
                onRefresh={() => { /* Reload via hook or store re-init? */ }}
            />
        </div>
    );
};

export default ProjectPage;
