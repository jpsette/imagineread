import React, { useRef, useMemo } from 'react';
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

    // Library creation via modal
    setIsCreatingFolder: (v: boolean) => void;

    // Actions
    onDeleteFolder: (id: string) => void;
    onImportFiles: (files: File[]) => void;
    onImportFilesLocal?: () => void; // For local projects - uses native dialog

    isImporting?: boolean;
    onTogglePin: (item: FileEntry) => void;
    onEditItem: (item: FileEntry) => void;
}

import { useFolderContents } from './hooks/useFolderContents'; // NEW HOOK
import { useProjectSelection } from './components/ProjectDetail/hooks/useProjectSelection';

import { useProjectNavigation } from './components/ProjectDetail/hooks/useProjectNavigation';
import { ProjectItemCard } from './components/ProjectDetail/ProjectItemCard';
import { ProjectHeader } from './components/ProjectDetail/ProjectHeader';

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
    project, currentFolderId, fileSystem: fullFileSystem, searchTerm,
    onOpenItem, onOpenComic, onBack,
    setIsCreatingFolder,
    onDeleteFolder, onImportFiles, onImportFilesLocal, onTogglePin,
    onEditItem, isImporting = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- DATA FETCHING (Independent) ---
    const rootId = project?.rootFolderId;
    const targetParent = currentFolderId || rootId || null;

    // We fetch contents for the CURRENT view (folder or root)
    const { data: fetchedItems } = useFolderContents(targetParent || null, project || null);

    // --- SELECTION STATE ---
    const { selectedIds, toggleSelection } = useProjectSelection();



    // --- SAFETY CHECK ---
    const safeFileSystem = fetchedItems || []; // Use Fetched Data for DISPLAY

    // --- NAVIGATION LOGIC ---
    const { handleNavigate } = useProjectNavigation({
        fileSystem: safeFileSystem,
        currentFolderId: targetParent,
        onOpenItem,
        onOpenComic
    });


    // --- LOGIC TO GET ITEMS ---
    // Since useFolderContents ALREADY filters by parentId, we just filter by search
    const items = safeFileSystem
        .filter(i => i.name.toLowerCase().includes(searchTerm?.toLowerCase() || ''));

    // --- BREADCRUMB LOGIC ---
    const breadcrumbs = useMemo(() => {
        if (!project) return [];
        const path: { id: string, name: string }[] = [];

        // For LOCAL projects, parse the filesystem path to build breadcrumbs
        const isLocalProject = !!project.localPath;

        if (isLocalProject && currentFolderId && currentFolderId.startsWith('/')) {
            // currentFolderId is a filesystem path like /Users/jp/.../Star Wars/Ashoka
            // project.localPath is /Users/jp/.../Star Wars
            // We need to extract the relative path
            const projectRoot = project.localPath!; // Safe because isLocalProject is true

            if (currentFolderId !== projectRoot && currentFolderId.startsWith(projectRoot)) {
                // Get relative path after project root
                const relativePath = currentFolderId.slice(projectRoot.length + 1);
                const segments = relativePath.split('/').filter(Boolean);

                // Build breadcrumb path incrementally
                let cumulativePath = projectRoot;
                for (const segment of segments) {
                    cumulativePath = `${cumulativePath}/${segment}`;
                    path.push({ id: cumulativePath, name: segment });
                }
            }
        } else {
            // CLOUD mode: use fullFileSystem to find folders
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

    // --- SMART COVER LOGIC ---
    const getFolderCover = (folderId: string) => {
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
    };

    // Get cover image for local comics (first page from .origin folder)
    const getComicCover = (item: FileEntry) => {
        // Cast to any to access localPath which may not be in type definition
        const anyItem = item as any;

        // Check if it's a PDF file (by extension or mimeType)
        const isPDF = item.name?.toLowerCase().endsWith('.pdf') ||
            item.mimeType?.includes('pdf');

        // For PDF files, the .origin folder is in the PARENT directory
        if (isPDF && anyItem.localPath) {
            const parentPath = anyItem.localPath.substring(0, anyItem.localPath.lastIndexOf('/'));
            return `media://${parentPath}/.origin/page_001.jpg`;
        }

        if (isPDF && item.id.startsWith('/')) {
            const parentPath = item.id.substring(0, item.id.lastIndexOf('/'));
            return `media://${parentPath}/.origin/page_001.jpg`;
        }

        // For local comics (folder type), derive cover from first page in .origin folder
        if (anyItem.localPath) {
            return `media://${anyItem.localPath}/.origin/page_001.jpg`;
        }

        // For items with an id that looks like a path (legacy folder-based comics)
        if (item.id.startsWith('/') && (item.type === 'comic' || item.isComic)) {
            return `media://${item.id}/.origin/page_001.jpg`;
        }

        return undefined;
    };

    // Breadcrumb navigation handler
    const handleBreadcrumbClick = (id: string) => {
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
    }

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
            {/* ... header ... */}
            <ProjectHeader
                onBack={onBack}
                breadcrumbs={breadcrumbs}
                onBreadcrumbClick={handleBreadcrumbClick}
                totalItems={items.length}
            />

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 pb-20">

                    {/* CARD 1: CREATE LIBRARY (Opens Modal) */}
                    <Card onClick={() => setIsCreatingFolder(true)}
                        className="h-72 border border-dashed border-border-color hover:border-accent-blue/50 hover:bg-surface-hover cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group bg-surface/30 opacity-70 hover:opacity-100">
                        <div className="p-4 rounded-full bg-surface text-text-muted group-hover:bg-accent-blue group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-inner">
                            <Folder size={32} />
                        </div>
                        <span className="text-xs font-bold text-text-muted group-hover:text-accent-blue uppercase tracking-wider transition-colors">Nova Biblioteca</span>
                    </Card>

                    {/* CARD 2: IMPORT */}
                    <Card onClick={() => {
                        console.log('[ProjectDetail] Import clicked');
                        console.log('[ProjectDetail] project?.localPath:', project?.localPath);
                        console.log('[ProjectDetail] onImportFilesLocal:', typeof onImportFilesLocal);
                        // Use native Electron dialog for local projects
                        if (project?.localPath && onImportFilesLocal) {
                            console.log('[ProjectDetail] Calling onImportFilesLocal');
                            onImportFilesLocal();
                        } else {
                            console.log('[ProjectDetail] Using fileInputRef');
                            fileInputRef.current?.click();
                        }
                    }}
                        className="h-72 border border-dashed border-border-color hover:border-purple-500/50 hover:bg-surface-hover cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group bg-surface/30 opacity-70 hover:opacity-100">
                        <div className="p-4 rounded-full bg-surface text-text-muted group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-inner">
                            <Upload size={32} />
                        </div>
                        <span className="text-xs font-bold text-text-muted group-hover:text-purple-400 uppercase tracking-wider transition-colors">Importar</span>
                    </Card>

                    {/* DATA ITEMS */}

                    {/* DATA ITEMS */}
                    {items.map(item => {
                        // FIX: Use backend-provided coverUrl if available (Lazy Loading support)
                        // For comics (PDF/CBZ), use first page as cover
                        const isComicOrPDF = item.type === 'comic' || item.isComic || item.mimeType?.startsWith('application/');
                        const coverImage = item.coverUrl ||
                            (item.type === 'folder' ? getFolderCover(item.id) :
                                (isComicOrPDF ? getComicCover(item) : item.url));
                        const isSelected = selectedIds.has(item.id);

                        const handleClick = (e: React.MouseEvent) => {
                            // 1. Handle Selection (Ctrl/Meta click)
                            if (e.ctrlKey || e.metaKey) {
                                e.stopPropagation();
                                toggleSelection(item.id);
                                return;
                            }

                            // 2. Navigation
                            handleNavigate(item);
                        };

                        return (
                            <ProjectItemCard
                                key={item.id}
                                item={item}
                                coverImage={coverImage}
                                isSelected={isSelected}
                                isRenaming={false} // Always false now

                                // Rename flow (Delegated)
                                onEditItem={onEditItem}

                                // Actions
                                onClick={handleClick}
                                onDelete={onDeleteFolder}
                                onTogglePin={() => onTogglePin(item)}

                                // Data
                                childrenCount={safeFileSystem.filter(f => f.parentId === item.id).length}

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
                onChange={(e) => e.target.files && onImportFiles(Array.from(e.target.files))}
            />
        </div>
    );
};
