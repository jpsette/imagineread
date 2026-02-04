/**
 * DashboardScreen
 * 
 * Main dashboard screen with project management, file explorer, and modals.
 * 
 * REFACTORED: Uses extracted hooks for handlers and modal state.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '../../../layouts/MainLayout';
import DraggableWindow from '@shared/ui/DraggableWindow';
import { LazyExplorer } from '../components/LazyExplorer/LazyExplorer';
import ProjectManager from '../ProjectManager';
import { ProjectDetail } from '../ProjectDetail';
import { RenameItemModal } from '../components/RenameItemModal';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateLibraryModal } from '../components/CreateLibraryModal';
import { DictionaryManager } from '@features/dictionary';
import { api } from '@shared/api/api';

// Stores & Hooks
import { useProjectStore } from '@app/store/useProjectStore';
import { useUIStore } from '@app/store/useUIStore';
import { useProjects, useLocalProjectsLoader, useDashboardHandlers, useModalState } from '../hooks';

// Types & Constants
import { PROJECT_THEMES } from '../../../constants/theme';

export const DashboardScreen: React.FC = () => {
    // === GLOBAL STORES ===
    const { currentProjectId, setCurrentProjectId } = useProjectStore();

    // === PERSISTENCE: Load Local Projects ===
    useLocalProjectsLoader();

    // === DATA FETCHING ===
    const { data: projectsData } = useProjects();
    const projects = projectsData || [];

    const { data: fullFileSystem } = useQuery({
        queryKey: ['filesystem', 'full'],
        queryFn: () => api.getFileSystem(),
        staleTime: 1000 * 60 * 5,
    });

    // === UI STORE ===
    const {
        showExplorer, setShowExplorer,
        showManager, setShowManager,
        showDictionary, setShowDictionary,
        view, setView,
        isCreatingProject, setIsCreatingProject
    } = useUIStore();

    // === LOCAL STATE ===
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [expandedProjects] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');

    // === EXTRACTED HOOKS ===
    const modals = useModalState();

    const handlers = useDashboardHandlers({
        projects,
        currentFolderId,
        setCurrentFolderId
    });

    // === RENDER ===
    return (
        <MainLayout isInEditor={false}>
            {/* EXPLORER WINDOW */}
            {showExplorer && (
                <DraggableWindow
                    title="Explorador de Arquivos (Lazy)"
                    onClose={() => setShowExplorer(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 20, y: 80 }}
                    initialSize={{ width: 300, height: 600 }}
                >
                    <LazyExplorer
                        projects={projects}
                        currentProjectId={currentProjectId}
                        currentFolderId={currentFolderId}
                        PROJECT_THEMES={PROJECT_THEMES}
                        onSelectProject={(id) => {
                            setCurrentProjectId(id);
                            setCurrentFolderId(null);
                            setView('project');
                            if (!showManager) setShowManager(true);
                        }}
                        onSelectFolder={(id) => {
                            setCurrentFolderId(id);
                            setView('project');
                            if (!showManager) setShowManager(true);
                        }}
                        onEditProject={(p) => modals.openRenameModal(p, true)}
                        onDeleteProject={handlers.handleDeleteProject}
                        onPinProject={handlers.togglePinProject}
                        onEditFolder={(folder) => modals.openRenameModal(folder)}
                        onDeleteFolder={handlers.handleDeleteFolder}
                        expandedProjects={expandedProjects}
                    />
                </DraggableWindow>
            )}

            {/* PROJECT MANAGER WINDOW */}
            {showManager && (
                <DraggableWindow
                    title={view === 'dashboard' ? 'Gerenciador de Projetos' : `Projeto: ${projects.find(p => p.id === currentProjectId)?.name || '...'}`}
                    onClose={() => setShowManager(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 340, y: 80 }}
                    initialSize={{ width: 960, height: 600 }}
                >
                    {view === 'dashboard' ? (
                        <ProjectManager
                            projects={projects}
                            PROJECT_THEMES={PROJECT_THEMES}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            sortOrder={sortOrder}
                            setSortOrder={setSortOrder}
                            isCreatingProject={isCreatingProject}
                            setIsCreatingProject={setIsCreatingProject}
                            newItemName={handlers.newItemName}
                            setNewItemName={handlers.setNewItemName}
                            newItemColor={handlers.newItemColor}
                            setNewItemColor={handlers.setNewItemColor}
                            onCreateProject={handlers.handleCreateProject}
                            onUpdateProject={handlers.handleUpdateProject}
                            onDeleteProject={handlers.handleDeleteProject}
                            onSelectProject={handlers.handleSelectProject}
                            onTogglePin={handlers.togglePinProject}
                            onEditProject={(p) => modals.openRenameModal(p, true)}
                        />
                    ) : (
                        <ProjectDetail
                            project={projects.find(p => p.id === currentProjectId) || null}
                            currentFolderId={currentFolderId}
                            fileSystem={fullFileSystem || []}
                            searchTerm={searchTerm}
                            setIsCreatingFolder={modals.setIsCreatingFolder}
                            onOpenItem={handlers.handleOpenItem}
                            onOpenComic={handlers.handleOpenComic}
                            onDeleteFolder={handlers.handleDeleteFolder}
                            onImportFiles={handlers.handleImportFiles}
                            onImportFilesLocal={handlers.handleImportFilesLocal}
                            onTogglePin={handlers.togglePin}
                            onBack={handlers.handleBack}
                            onEditItem={(item) => modals.openRenameModal(item)}
                            isImporting={handlers.isImporting}
                        />
                    )}
                </DraggableWindow>
            )}

            {/* GLOSSARY WINDOW */}
            {showDictionary && (
                <DraggableWindow
                    title="📖 Glossário de Termos"
                    onClose={() => setShowDictionary(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 200, y: 100 }}
                    initialSize={{ width: 900, height: 550 }}
                >
                    <DictionaryManager />
                </DraggableWindow>
            )}

            {/* RENAME MODAL */}
            <RenameItemModal
                item={modals.itemToRename}
                onClose={modals.closeRenameModal}
                onRename={(id, name, color) => {
                    if (modals.itemToRename?.type === 'project') {
                        handlers.handleUpdateProject(id, { name, color });
                    } else {
                        handlers.renameItem(id, name, color);
                    }
                }}
                projectThemes={PROJECT_THEMES}
            />

            {/* CREATE PROJECT MODAL */}
            <CreateProjectModal
                isOpen={isCreatingProject}
                onClose={() => setIsCreatingProject(false)}
                onCreate={handlers.handleCreateProject}
                newName={handlers.newItemName}
                setNewName={handlers.setNewItemName}
                newColor={handlers.newItemColor}
                setNewColor={handlers.setNewItemColor}
                projectThemes={PROJECT_THEMES}
            />

            {/* CREATE LIBRARY MODAL */}
            <CreateLibraryModal
                isOpen={modals.isCreatingFolder}
                onClose={modals.closeCreateFolderModal}
                onCreate={async (name, color) => {
                    const success = await handlers.handleCreateFolder(name, color);
                    if (success) modals.closeCreateFolderModal();
                }}
            />

            {/* Hidden File Inputs */}
            <input
                type="file"
                ref={handlers.fileInputRef}
                className="hidden"
                multiple
                onChange={handlers.onFileChange}
                accept="image/*,application/pdf"
            />

            <input
                type="file"
                ref={handlers.folderInputRef}
                className="hidden"
                multiple
                // @ts-ignore
                webkitdirectory=""
                onChange={handlers.onFolderChange}
            />
        </MainLayout>
    );
};
