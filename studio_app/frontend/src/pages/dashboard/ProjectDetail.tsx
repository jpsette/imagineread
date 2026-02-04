/**
 * ProjectDetail
 * 
 * Displays the contents of a project (folders, comics, files).
 * Supports both cloud and local projects with proper breadcrumb navigation.
 * 
 * OPTIMIZED: Added React.memo, useCallback for handlers, and cleaned up debug logs.
 * CAUTION: This component has complex logic - changes were made conservatively.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { Folder, Upload } from 'lucide-react';
import { Card } from '@shared/ui/Card';
import { Project, FileEntry } from '@shared/types';

interface ProjectDetailProps {
    project: Project | null;
    currentFolderId: string | null;
    fileSystem: FileEntry[];
    searchTerm: string;
    onOpenItem: (item: FileEntry) => void;
    onOpenComic: (comicId: string) => void;
    onBack: () => void;
    setIsCreatingFolder: (v: boolean) => void;
    onDeleteFolder: (id: string) => void;
    onImportFiles: (files: File[]) => void;
    onImportFilesLocal?: () => void;
    isImporting?: boolean;
    onTogglePin: (item: FileEntry) => void;
    onEditItem: (item: FileEntry) => void;
}

import { useFolderContents } from './hooks/useFolderContents';
import { useProjectSelection } from './components/ProjectDetail/hooks/useProjectSelection';
import { useProjectNavigation } from './components/ProjectDetail/hooks/useProjectNavigation';
import { ProjectItemCard } from './components/ProjectDetail/ProjectItemCard';
import { ProjectHeader } from './components/ProjectDetail/ProjectHeader';

const ProjectDetailComponent: React.FC<ProjectDetailProps> = ({
    project, currentFolderId, fileSystem: fullFileSystem, searchTerm,
    onOpenItem, onOpenComic, onBack,
    setIsCreatingFolder,
    onDeleteFolder, onImportFiles, onImportFilesLocal, onTogglePin,
    onEditItem, isImporting = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- DATA FETCHING ---
    const rootId = project?.rootFolderId;
    const targetParent = currentFolderId || rootId || null;
    const { data: fetchedItems } = useFolderContents(targetParent || null, project || null);

    // --- SELECTION STATE ---
    const { selectedIds, toggleSelection } = useProjectSelection();

    // --- SAFETY CHECK ---
    const safeFileSystem = fetchedItems || [];

    // --- NAVIGATION ---
    const { handleNavigate } = useProjectNavigation({
        fileSystem: safeFileSystem,
        currentFolderId: targetParent,
        onOpenItem,
        onOpenComic
    });

    // --- ITEMS (filtered by search) ---
    const items = useMemo(() =>
        safeFileSystem.filter(i => i.name.toLowerCase().includes(searchTerm?.toLowerCase() || '')),
        [safeFileSystem, searchTerm]
    );

    // --- BREADCRUMB LOGIC ---
    const breadcrumbs = useMemo(() => {
        if (!project) return [];
        const path: { id: string, name: string }[] = [];

        const isLocalProject = !!project.localPath;

        if (isLocalProject && currentFolderId && currentFolderId.startsWith('/')) {
            const projectRoot = project.localPath!;

            if (currentFolderId !== projectRoot && currentFolderId.startsWith(projectRoot)) {
                const relativePath = currentFolderId.slice(projectRoot.length + 1);
                const segments = relativePath.split('/').filter(Boolean);

                let cumulativePath = projectRoot;
                for (const segment of segments) {
                    cumulativePath = `${cumulativePath}/${segment}`;
                    path.push({ id: cumulativePath, name: segment });
                }
            }
        } else {
            const buildPath = (currentId: string | null) => {
                if (!currentId) return;
                if (currentId === project.rootFolderId) return;

                const folder = fullFileSystem.find(f => f.id === currentId);
                if (folder) {
                    path.unshift({ id: folder.id, name: folder.name });
                    if (folder.parentId) buildPath(folder.parentId);
                }
            };

            if (currentFolderId && currentFolderId !== project.rootFolderId) {
                buildPath(currentFolderId);
            }
        }

        return [
            { id: project.localPath || project.rootFolderId || 'root', name: project.name },
            ...path
        ];
    }, [currentFolderId, project, fullFileSystem]);

    // --- COVER IMAGE HELPERS (memoized) ---
    const getFolderCover = useCallback((folderId: string) => {
        const folderChildren = safeFileSystem.filter(f => f.parentId === folderId);
        const sortedChildren = [...folderChildren].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );

        const image = sortedChildren.find(f =>
            (f.type === 'file') && (
                f.mimeType?.startsWith('image/') ||
                f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
                f.url
            )
        );
        return image?.url;
    }, [safeFileSystem]);

    const getComicCover = useCallback((item: FileEntry) => {
        const anyItem = item as any;

        const isPDF = item.name?.toLowerCase().endsWith('.pdf') ||
            item.mimeType?.includes('pdf');

        if (isPDF && anyItem.localPath) {
            const parentPath = anyItem.localPath.substring(0, anyItem.localPath.lastIndexOf('/'));
            return `media://${parentPath}/.origin/page_001.jpg`;
        }

        if (isPDF && item.id.startsWith('/')) {
            const parentPath = item.id.substring(0, item.id.lastIndexOf('/'));
            return `media://${parentPath}/.origin/page_001.jpg`;
        }

        if (anyItem.localPath) {
            return `media://${anyItem.localPath}/.origin/page_001.jpg`;
        }

        if (item.id.startsWith('/') && (item.type === 'comic' || item.isComic)) {
            return `media://${item.id}/.origin/page_001.jpg`;
        }

        return undefined;
    }, []);

    // --- HANDLERS (memoized to prevent re-renders) ---
    const handleBreadcrumbClick = useCallback((id: string) => {
        if (id === project?.rootFolderId) {
            const folderEntry = safeFileSystem.find(f => f.id === id);
            if (folderEntry) onOpenItem(folderEntry);
            else {
                onOpenItem({ id: id, name: 'Root', type: 'folder', parentId: null } as FileEntry);
            }
        } else {
            const folderEntry = safeFileSystem.find(f => f.id === id);
            if (folderEntry) onOpenItem(folderEntry);
        }
    }, [project?.rootFolderId, safeFileSystem, onOpenItem]);

    const handleCreateLibrary = useCallback(() => {
        setIsCreatingFolder(true);
    }, [setIsCreatingFolder]);

    const handleImportClick = useCallback(() => {
        if (project?.localPath && onImportFilesLocal) {
            onImportFilesLocal();
        } else {
            fileInputRef.current?.click();
        }
    }, [project?.localPath, onImportFilesLocal]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onImportFiles(Array.from(e.target.files));
        }
    }, [onImportFiles]);

    // --- ITEM CLICK HANDLER (memoized factory) ---
    const createItemClickHandler = useCallback((item: FileEntry) => (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.stopPropagation();
            toggleSelection(item.id);
            return;
        }
        handleNavigate(item);
    }, [toggleSelection, handleNavigate]);

    // --- CHILDREN COUNT LOOKUP (memoized) ---
    const childrenCountMap = useMemo(() => {
        const map: Record<string, number> = {};
        items.forEach(item => {
            map[item.id] = safeFileSystem.filter(f => f.parentId === item.id).length;
        });
        return map;
    }, [items, safeFileSystem]);

    // --- EMPTY STATE ---
    if (!project && !currentFolderId && items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4">
                <div className="p-6 rounded-full bg-surface shadow-inner">
                    <Folder size={48} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Selecione um projeto para começar</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-app-bg text-text-primary overflow-hidden">
            <ProjectHeader
                onBack={onBack}
                breadcrumbs={breadcrumbs}
                onBreadcrumbClick={handleBreadcrumbClick}
                totalItems={items.length}
            />

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 pb-20">

                    {/* CREATE LIBRARY CARD */}
                    <Card
                        onClick={handleCreateLibrary}
                        className="h-72 border border-dashed border-border-color hover:border-accent-blue/50 hover:bg-surface-hover cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group bg-surface/30 opacity-70 hover:opacity-100"
                    >
                        <div className="p-4 rounded-full bg-surface text-text-muted group-hover:bg-accent-blue group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-inner">
                            <Folder size={32} />
                        </div>
                        <span className="text-xs font-bold text-text-muted group-hover:text-accent-blue uppercase tracking-wider transition-colors">Nova Biblioteca</span>
                    </Card>

                    {/* IMPORT CARD */}
                    <Card
                        onClick={handleImportClick}
                        className="h-72 border border-dashed border-border-color hover:border-purple-500/50 hover:bg-surface-hover cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group bg-surface/30 opacity-70 hover:opacity-100"
                    >
                        <div className="p-4 rounded-full bg-surface text-text-muted group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-inner">
                            <Upload size={32} />
                        </div>
                        <span className="text-xs font-bold text-text-muted group-hover:text-purple-400 uppercase tracking-wider transition-colors">Importar</span>
                    </Card>

                    {/* DATA ITEMS */}
                    {items.map(item => {
                        const isComicOrPDF = item.type === 'comic' || item.isComic || item.mimeType?.startsWith('application/');
                        const coverImage = item.coverUrl ||
                            (item.type === 'folder' ? getFolderCover(item.id) :
                                (isComicOrPDF ? getComicCover(item) : item.url));
                        const isSelected = selectedIds.has(item.id);

                        return (
                            <ProjectItemCard
                                key={item.id}
                                item={item}
                                coverImage={coverImage}
                                isSelected={isSelected}
                                isRenaming={false}
                                onEditItem={onEditItem}
                                onClick={createItemClickHandler(item)}
                                onDelete={onDeleteFolder}
                                onTogglePin={() => onTogglePin(item)}
                                childrenCount={childrenCountMap[item.id] || 0}
                            />
                        );
                    })}
                </div>
            </div>

            {/* IMPORT LOADING OVERLAY */}
            {isImporting && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-surface border border-accent-blue/30 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                        <div className="text-center">
                            <p className="text-white font-bold text-lg">Importando...</p>
                            <p className="text-text-muted text-sm">Processando seus arquivos</p>
                        </div>
                    </div>
                </div>
            )}

            <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileInputChange}
            />
        </div>
    );
};

// Memoized export with custom comparison for stable props
export const ProjectDetail = React.memo(ProjectDetailComponent);
