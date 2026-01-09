import React, { useState, useRef } from 'react'
import { Folder, Pin, Pencil, Trash2, ChevronRight, ArrowLeft, Upload, File } from 'lucide-react'

import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Card } from '../../ui/Card';
import { Project, FileEntry } from '../../types';
import { api } from '../../services/api';

interface ProjectDetailProps {
    project: Project | null
    currentFolderId: string | null
    fileSystem: FileEntry[]
    loading: boolean
    error: string | null
    searchTerm: string
    sortOrder: 'az' | 'za'
    isCreatingFolder: boolean
    setIsCreatingFolder: (creating: boolean) => void
    newItemName: string
    setNewItemName: (name: string) => void
    newItemColor: string
    setNewItemColor: (color: string) => void
    editingFolder: FileEntry | null
    setEditingFolder: (folder: FileEntry | null) => void
    editName: string
    setEditName: (name: string) => void
    editColor: string
    setEditColor: (color: string) => void
    PROJECT_THEMES: Array<{ bg: string; text: string; lightText?: string }>
    onCreateFolder: () => void
    onUpdateFolder: () => void
    onDeleteFolder: (folderId: string, e: React.MouseEvent) => void
    onOpenItem: (item: FileEntry) => void
    onOpenComic: (comicId: string) => void
    onStartEditingFolder: (folder: FileEntry, e: React.MouseEvent) => void
    onTogglePin: (itemId: string) => void
    onImportFiles: (files: File[]) => void
    onDeletePages: (pageIds: string[]) => void
    onBack: () => void
    onRefresh: () => void
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
    project,
    currentFolderId,
    fileSystem,
    loading,
    error,
    searchTerm,
    sortOrder,
    isCreatingFolder,
    setIsCreatingFolder,
    newItemName,
    setNewItemName,
    newItemColor,
    setNewItemColor,
    editingFolder,
    setEditingFolder,
    editName,
    setEditName,
    editColor,
    setEditColor,
    PROJECT_THEMES,
    onCreateFolder,
    onUpdateFolder,
    onDeleteFolder,
    onOpenItem,
    onOpenComic,
    onStartEditingFolder,
    onTogglePin,
    onImportFiles,
    onDeletePages,
    onBack,
    onRefresh
}) => {

    // Selection State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return;
        const items = getCurrentItems().filter(i => selectedItems.has(i.id));
        const folders = items.filter(i => i.type === 'folder');
        const files = items.filter(i => i.type !== 'folder');

        if (files.length > 0) onDeletePages(files.map(f => f.id));
        if (folders.length > 0) {
            folders.forEach(f => onDeleteFolder(f.id, {} as any));
        }
        setSelectedItems(new Set());
    };

    const getCurrentItems = () => {
        if (!project) return []
        const rootId = project.rootFolderId
        const targetParent = currentFolderId || rootId
        return fileSystem.filter(item => item.parentId === targetParent)
    }

    const items = getCurrentItems()
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Folders first
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            return sortOrder === 'az'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        });

    return (
        <>
            {/* Header */}
            <header className="flex flex-col gap-6 mb-8 pt-4 px-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-bold tracking-tight text-white/90">
                                    {(currentFolderId && fileSystem.find(f => f.id === currentFolderId)?.name) || project?.name || 'Loading...'}
                                </h2>
                            </div>
                            <p className="text-text-secondary mt-1 flex items-center gap-1 text-sm font-medium">
                                <span className="opacity-60">Projetos</span>
                                {(currentFolderId && currentFolderId !== project?.rootFolderId) && (
                                    <>
                                        <ChevronRight size={14} className="opacity-40" />
                                        <span className="opacity-60">{project?.name}</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {selectedItems.size > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2"
                            >
                                <Trash2 size={14} />
                                Excluir ({selectedItems.size})
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,180px)] gap-6 content-start justify-start p-2 pb-20">

                {/* Create Folder Card */}
                {
                    !isCreatingFolder && (
                        <Card
                            onClick={() => setIsCreatingFolder(true)}
                            className="group relative p-4 border-dashed bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 flex flex-col items-center justify-center gap-3 h-48 shadow-sm hover:shadow-md cursor-pointer transition-all"
                        >
                            <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                <Folder size={24} />
                            </div>
                            <span className="text-xs font-bold text-text-secondary group-hover:text-accent-blue transition-colors">Nova Biblioteca</span>
                        </Card>
                    )
                }

                {/* Import Card */}
                {!isCreatingFolder && (
                    <Card
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative p-4 border-dashed bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 flex flex-col items-center justify-center gap-3 h-48 shadow-sm hover:shadow-md cursor-pointer transition-all"
                    >
                        <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                            <Upload size={24} />
                        </div>
                        <span className="text-xs font-bold text-text-secondary group-hover:text-accent-blue transition-colors">Importar</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.length) onImportFiles(Array.from(e.target.files));
                            }}
                        />
                    </Card>
                )}

                {/* Inline Folder Creator */}
                {
                    isCreatingFolder && (
                        <Card className="p-4 border-accent-blue bg-app-bg shadow-xl shadow-blue-500/10 h-48 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold mb-2 text-accent-blue">Nova Pasta</h3>
                                <Input
                                    autoFocus
                                    placeholder="Nome..."
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') onCreateFolder();
                                        if (e.key === 'Escape') setIsCreatingFolder(false);
                                    }}
                                    className="mb-2 !text-xs !py-1"
                                />
                                <div className="grid grid-cols-5 gap-1">
                                    {PROJECT_THEMES.slice(0, 5).map(theme => (
                                        <button
                                            key={theme.bg}
                                            onClick={() => setNewItemColor(theme.bg)}
                                            className={`w-4 h-4 rounded-full transition-all ${theme.bg} ${newItemColor === theme.bg ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-1 mt-2">
                                <Button size="sm" onClick={onCreateFolder} className="flex-1 !text-xs !h-7">Criar</Button>
                                <Button size="sm" variant="secondary" onClick={() => setIsCreatingFolder(false)} className="!text-xs !h-7">Cancel</Button>
                            </div>
                        </Card>
                    )
                }

                {
                    items.map(item => {
                        const isSelected = selectedItems.has(item.id);
                        const isEditing = editingFolder?.id === item.id;
                        const isFolder = item.type === 'folder';

                        // LOGIC TO DETERMINE IF IT IS AN IMAGE
                        // Check both mime_type AND file extension to be safe
                        // Also check item.type === 'file' as a base
                        const isImage = (item.type === 'file') && (
                            (item.mimeType && item.mimeType.startsWith('image/')) ||
                            (item.name && item.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) ||
                            item.url // Fallback if url exists it's likely a renderable file in this context
                        );

                        // Define click handler (CRITICAL: Restore Editor access)
                        const handleClick = (e: React.MouseEvent) => {
                            if (e.ctrlKey || e.metaKey) {
                                e.stopPropagation();
                                toggleSelection(item.id);
                            } else {
                                if (item.type === 'folder') {
                                    onOpenItem(item); // Enter folder
                                } else if (item.type === 'comic') {
                                    onOpenComic(item.id);
                                } else {
                                    // IT IS A FILE - OPEN THE EDITOR
                                    const targetComicId = currentFolderId || item.parentId;
                                    if (targetComicId) {
                                        onOpenComic(targetComicId);
                                    } else {
                                        console.warn("Cannot open editor: File has no parent context");
                                    }
                                }
                            }
                        };

                        return (
                            <div
                                key={item.id}
                                className={`relative group cursor-pointer transition-all ${selectedItems.has(item.id) ? 'ring-2 ring-accent-blue rounded-lg' : ''}`}
                                onClick={handleClick}
                            >
                                {/* ACTION OVERLAY (Pin, Edit, Delete) - Common for both */}
                                {!isEditing && (
                                    <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); onTogglePin(item.id) }} className={`p-1.5 rounded-md hover:bg-black/50 backdrop-blur-sm ${item.isPinned ? 'text-accent-blue' : 'text-white/70 hover:text-white'}`}>
                                            <Pin size={12} className={item.isPinned ? "fill-current" : ""} />
                                        </button>
                                        {isFolder && (
                                            <button onClick={(e) => { e.stopPropagation(); onStartEditingFolder(item, e) }} className="p-1.5 rounded-md hover:bg-black/50 text-zinc-400 hover:text-white">
                                                <Pencil size={12} />
                                            </button>
                                        )}
                                        {/* Delete for files */}
                                        {!isFolder && (
                                            <button onClick={(e) => { e.stopPropagation(); onDeletePages([item.id]) }} className={`p-1.5 rounded-md hover:bg-black/50 backdrop-blur-sm text-red-300 hover:text-red-200`}>
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {isEditing ? (
                                    // EDITING STATE
                                    <Card className="h-48 p-4 flex flex-col justify-between bg-app-bg border-accent-blue">
                                        <div className="flex flex-col h-full justify-between" onClick={e => e.stopPropagation()}>
                                            <div>
                                                <h3 className="text-xs font-bold mb-2 text-accent-blue">Editar</h3>
                                                <Input
                                                    autoFocus
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') onUpdateFolder();
                                                        if (e.key === 'Escape') setEditingFolder(null);
                                                    }}
                                                    className="mb-2 !text-xs"
                                                />
                                                {isFolder && (
                                                    <div className="grid grid-cols-8 gap-1 mb-2">
                                                        {PROJECT_THEMES.map(theme => (
                                                            <button
                                                                key={theme.bg}
                                                                onClick={() => setEditColor(theme.bg)}
                                                                className={`w-3 h-3 rounded-full transition-all ${theme.bg} ${editColor === theme.bg ? 'ring-1 ring-white scale-125' : 'hover:scale-125 opacity-70 hover:opacity-100'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" onClick={onUpdateFolder} className="flex-1 !text-xs !h-7">Salvar</Button>
                                                <Button size="sm" variant="secondary" onClick={() => setEditingFolder(null)} className="!text-xs !h-7">Cancel</Button>
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    // VIEW STATE
                                    <>
                                        {isImage ? (
                                            // --- CASE A: IT IS AN IMAGE (Show Thumbnail) ---
                                            <div className="aspect-[3/4] relative overflow-hidden rounded-lg border border-white/5 bg-gray-900 group-hover:border-accent-blue transition-colors">
                                                <img
                                                    src={item.url || item.thumbnailUrl} // Prioritize URL, fallback to thumbnail if exists
                                                    alt={item.name}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                {/* Name overlay */}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6">
                                                    <span className="text-xs text-white font-medium truncate block shadow-sm">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            // --- CASE B: IT IS A FOLDER/OTHER (Show Icon) ---
                                            <Card className="h-48 p-4 flex flex-col items-center justify-center gap-3 bg-app-bg hover:bg-accent-blue/5 border-white/5 hover:border-accent-blue/30 transition-all">
                                                {(() => {
                                                    // Check for Folder Cover (Smart Thumbnail)
                                                    if (isFolder || item.type === 'comic') {
                                                        const children = fileSystem.filter(f => f.parentId === item.id && f.type === 'file');
                                                        const coverUrl = children[0]?.url;

                                                        if (coverUrl) {
                                                            return (
                                                                <>
                                                                    <img src={coverUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity absolute inset-0 rounded-xl" alt={item.name} />
                                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8 rounded-b-xl z-10">
                                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                                            <Folder size={12} className="text-accent-blue fill-current" />
                                                                            <span className="text-xs font-bold text-white truncate shadow-black drop-shadow-md">{item.name}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-white/80 font-medium ml-4">{children.length} itens</span>
                                                                    </div>
                                                                </>
                                                            )
                                                        }
                                                    }

                                                    // Default Folder Icon
                                                    return (
                                                        <>
                                                            <Folder size={40} className={`${PROJECT_THEMES.find(t => t.bg === item.color)?.text || 'text-blue-500'} opacity-80`} />
                                                            <div className="flex flex-col items-center w-full">
                                                                <span className="text-xs font-medium text-center truncate px-2 text-white max-w-full">{item.name}</span>
                                                                {item.createdAt && <span className="text-[10px] text-white/40">{new Date(item.createdAt).toLocaleDateString()}</span>}
                                                            </div>
                                                        </>
                                                    )
                                                })()}
                                            </Card>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })
                }
            </div >
        </>
    )
}

export default ProjectDetail;
