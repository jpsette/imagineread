import React, { useRef, useMemo, useState } from 'react';
import { Folder, ArrowLeft, Upload, ChevronRight, Image as ImageIcon, Pin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Project, FileEntry } from '../../types';

interface ProjectDetailProps {
    project: Project | null;
    currentFolderId: string | null;
    fileSystem: FileEntry[];
    searchTerm: string;
    onOpenItem: (item: FileEntry) => void;
    onOpenComic: (comicId: string) => void;
    onBack: () => void;

    // Controlled State Props
    isCreatingFolder: boolean;
    setIsCreatingFolder: (v: boolean) => void;
    newFolderName: string;
    setNewFolderName: (v: string) => void;
    newFolderColor: string;
    setNewFolderColor: (v: string) => void;

    // Actions
    onCreateFolder: () => void;
    onDeleteFolder: (id: string) => void;
    onImportFiles: (files: File[]) => void;

    PROJECT_THEMES?: any;
    sortOrder?: any; // Ignored for now
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
    project, currentFolderId, fileSystem, searchTerm, PROJECT_THEMES,
    onOpenItem, onOpenComic, onBack,
    isCreatingFolder, setIsCreatingFolder,
    newFolderName, setNewFolderName,
    newFolderColor, setNewFolderColor,
    onCreateFolder, onDeleteFolder, onImportFiles
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- SELECTION STATE ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // --- SAFETY CHECK ---
    const safeFileSystem = fileSystem || [];

    // --- LOGIC TO GET ITEMS ---
    const rootId = project?.rootFolderId;
    const targetParent = currentFolderId || rootId;

    // Filter the items from the global fileSystem
    const items = safeFileSystem
        .filter(i => i.parentId === targetParent)
        .filter(i => i.name.toLowerCase().includes(searchTerm?.toLowerCase() || ''));

    // --- BREADCRUMB LOGIC ---
    const breadcrumbs = useMemo(() => {
        if (!project || !safeFileSystem) return [];
        const path: { id: string, name: string }[] = [];

        const buildPath = (currentId: string | null) => {
            if (!currentId) return;
            if (currentId === project.rootFolderId) return;

            const folder = safeFileSystem.find(f => f.id === currentId);
            if (folder) {
                path.unshift({ id: folder.id, name: folder.name });
                if (folder.parentId) buildPath(folder.parentId);
            }
        };

        if (currentFolderId && currentFolderId !== project.rootFolderId) {
            buildPath(currentFolderId);
        }

        return [
            { id: project.rootFolderId || 'root', name: project.name },
            ...path
        ];
    }, [currentFolderId, project, safeFileSystem]);

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
        return <div className="p-8 text-center text-zinc-500">Selecione um projeto para começar.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#0c0c0e] text-zinc-100 overflow-hidden">
            {/* HEADER WITH BREADCRUMBS */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#18181b] shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </Button>

                    <div className="flex items-center text-sm font-medium">
                        <span className="text-zinc-500 mr-2">Projetos</span>
                        <ChevronRight size={14} className="text-zinc-600 mx-1" />

                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;
                            return (
                                <div key={crumb.id} className="flex items-center">
                                    <button
                                        onClick={() => handleBreadcrumbClick(crumb.id)}
                                        className={`hover:text-white transition-colors ${isLast ? 'text-white font-bold cursor-default' : 'text-zinc-400 hover:underline'}`}
                                        disabled={isLast}
                                    >
                                        {crumb.name}
                                    </button>
                                    {!isLast && <ChevronRight size={14} className="text-zinc-600 mx-1" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="text-xs text-zinc-500">
                    {items.length} itens
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">

                    {/* CARD 1: CREATE FOLDER */}
                    {isCreatingFolder ? (
                        <Card className="h-72 p-4 border border-blue-500 bg-[#18181b] flex flex-col justify-center gap-2 shadow-lg shadow-blue-500/10">
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Nova Biblioteca</span>
                            <Input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nome..." className="text-sm py-2" />

                            <div className="flex flex-wrap gap-1 mb-1 mt-2">
                                {PROJECT_THEMES && PROJECT_THEMES.map((theme: any) => (
                                    <button
                                        key={theme.bg}
                                        onClick={(e) => { e.stopPropagation(); setNewFolderColor(theme.bg); }}
                                        className={`w-4 h-4 rounded-full transition-all ${theme.bg} ${newFolderColor === theme.bg ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button size="sm" onClick={onCreateFolder} className="flex-1 text-xs font-bold">CRIAR</Button>
                                <Button size="sm" variant="secondary" onClick={() => setIsCreatingFolder(false)} className="text-xs">X</Button>
                            </div>
                        </Card>
                    ) : (
                        <Card onClick={() => setIsCreatingFolder(true)}
                            className="h-72 border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group">
                            <div className="p-4 rounded-full bg-zinc-800/50 text-zinc-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                <Folder size={32} />
                            </div>
                            <span className="text-xs font-bold text-zinc-500 group-hover:text-blue-400 uppercase tracking-wider transition-colors">Nova Biblioteca</span>
                        </Card>
                    )}

                    {/* CARD 2: IMPORT */}
                    <Card onClick={() => fileInputRef.current?.click()}
                        className="h-72 border border-dashed border-white/10 hover:border-purple-500/50 hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center gap-4 transition-all group">
                        <div className="p-4 rounded-full bg-zinc-800/50 text-zinc-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <Upload size={32} />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 group-hover:text-purple-400 uppercase tracking-wider transition-colors">Importar</span>
                    </Card>

                    {/* DATA ITEMS */}
                    {items.map(item => {
                        const coverImage = item.type === 'folder' ? getFolderCover(item.id) : item.url;
                        const folderColor = PROJECT_THEMES?.find((t: any) => t.bg === item.color)?.text || 'text-blue-500';
                        const isSelected = selectedIds.has(item.id);

                        const handleClick = (e: React.MouseEvent) => {
                            // 1. Handle Selection (Ctrl/Meta click)
                            if (e.ctrlKey || e.metaKey) {
                                e.stopPropagation();
                                toggleSelection(item.id);
                                return;
                            }

                            // 2. Handle Folder/Comic Navigation Logic
                            if (item.type === 'folder') {
                                const children = safeFileSystem.filter(f => f.parentId === item.id);
                                const hasPages = children.some(f => f.type === 'file');
                                const hasSubFolders = children.some(f => f.type === 'folder');

                                if (hasPages && !hasSubFolders) {
                                    onOpenComic(item.id);
                                } else {
                                    onOpenItem(item);
                                }
                            }
                            else if (item.type === 'comic') {
                                onOpenComic(item.id);
                            }
                            else {
                                const parentId = currentFolderId || item.parentId;
                                if (parentId) onOpenComic(parentId);
                            }
                        };

                        return (
                            <Card key={item.id}
                                onClick={handleClick}
                                className={`h-72 relative group cursor-pointer border bg-[#18181b] overflow-hidden hover:ring-2 hover:ring-blue-500 hover:shadow-2xl transition-all ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-white/5'}`}
                            >

                                {/* COVER IMAGE */}
                                {coverImage ? (
                                    <>
                                        <div className="absolute inset-0 bg-zinc-900">
                                            <img src={coverImage} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-800 to-zinc-900 group-hover:from-zinc-800 group-hover:to-zinc-800 transition-colors">
                                        {item.type === 'folder' ? (
                                            <Folder size={48} className={`${folderColor} opacity-80 group-hover:opacity-100 transition-colors`} />
                                        ) : (
                                            <ImageIcon size={48} className="text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                        )}
                                    </div>
                                )}

                                {/* ACTION BUTTONS */}
                                <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg p-1 backdrop-blur-sm">
                                    <button className="p-1.5 hover:bg-white/20 rounded text-zinc-400 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <Pin size={14} />
                                    </button>
                                    <button className="p-1.5 hover:bg-white/20 rounded text-zinc-400 hover:text-blue-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Excluir este item?')) onDeleteFolder(item.id);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {/* META INFO */}
                                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                        <span className={`text-[10px] uppercase font-bold tracking-widest ${folderColor} bg-white/5 px-2 py-0.5 rounded border border-white/10`}>
                                            {item.type === 'folder' ? 'Biblioteca' : 'Comic'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white truncate leading-tight drop-shadow-md">{item.name}</p>
                                    {item.type === 'folder' && (
                                        <p className="text-[10px] text-zinc-400 font-medium">
                                            {safeFileSystem.filter(f => f.parentId === item.id).length} itens
                                        </p>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

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
