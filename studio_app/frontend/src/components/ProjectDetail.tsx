import React, { useState } from 'react'
import { Folder, Plus, Pin, Pencil, Trash2, LayoutGrid } from 'lucide-react'
import { Project, FileEntry } from '../types';

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
}) => {
    // Selection State
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return;
        // Separate folders and files if needed, but for now assuming we pass IDs to onDeletePages 
        // Logic specific: onDeletePages handles files. onDeleteFolder handles folders.
        // We need to separate.
        const items = getCurrentItems().filter(i => selectedItems.has(i.id));
        const folders = items.filter(i => i.type === 'folder');
        const files = items.filter(i => i.type !== 'folder');

        if (files.length > 0) onDeletePages(files.map(f => f.id));
        if (folders.length > 0) {
            // Delete folders one by one or create bulk handler?
            // For now, let's just delete files primarily or warn about folders.
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

    return (
        <>
            {loading && (
                <div className="mb-6 p-4 rounded-lg bg-blue-900/10 border border-blue-900/30 flex items-center gap-3 text-blue-300">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Processando PDF e gerando imagens...</span>
                </div>
            )}





            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-900/50 text-red-200 text-sm">
                    <strong>Erro:</strong> {error}
                </div>
            )}


            {/* Toolbar for Selection */}
            {selectedItems.size > 0 && (
                <div className="mb-4 p-2 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-red-200 ml-2">{selectedItems.size} item(s) selecionado(s)</span>
                    <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                        <Trash2 size={14} /> Excluir Selecionados
                    </button>
                </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fill,180px)] gap-4 content-start justify-start">

                {/* Add New Library Card */}
                {!isCreatingFolder && (
                    <>
                        {/* Import Button */}
                        <label className="group aspect-square p-4 rounded-xl border border-dashed border-border-color bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        onImportFiles(Array.from(e.target.files));
                                        e.target.value = ''; // Reset
                                    }
                                }}
                                accept="application/pdf,image/*"
                            />
                            <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                <Plus size={24} className="rotate-45" /> {/* Upload Icon Style */}
                            </div>
                            <span className="text-sm font-medium text-text-secondary group-hover:text-accent-blue text-center">
                                Importar<br />Arquivos
                            </span>
                        </label>

                        {/* Create Folder Button */}
                        <button
                            onClick={() => setIsCreatingFolder(true)}
                            className="group aspect-square p-4 rounded-xl border border-dashed border-border-color bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 transition-all flex flex-col items-center justify-center gap-2"
                        >
                            <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                                <Folder size={24} />
                            </div>
                            <span className="text-sm font-medium text-text-secondary group-hover:text-accent-blue">Nova Biblioteca</span>
                        </button>
                    </>
                )}

                {/* Inline Creator for Folder */}
                {isCreatingFolder && (
                    <div className="flex flex-col gap-2 p-3 rounded-xl border border-accent-blue bg-app-bg animate-pulse">
                        <div className="aspect-square rounded-xl bg-[#27272a] flex items-center justify-center mb-1">
                            <Folder size={32} className="text-accent-blue" />
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Nome da biblioteca..."
                            className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-blue mb-2"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onCreateFolder();
                                if (e.key === 'Escape') setIsCreatingFolder(false);
                            }}
                        />
                        <div className="grid grid-cols-8 gap-1 mb-2">
                            {PROJECT_THEMES.map(theme => (
                                <button
                                    key={theme.bg}
                                    onClick={() => setNewItemColor(theme.bg)}
                                    className={`w-3 h-3 rounded-full transition-all ${theme.bg} ${newItemColor === theme.bg ? 'ring-1 ring-white scale-125' : 'hover:scale-125 opacity-70 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onCreateFolder} className="flex-1 bg-accent-blue text-white py-1 rounded-[4px] text-[10px] font-bold">Criar</button>
                            <button onClick={() => setIsCreatingFolder(false)} className="px-2 bg-[#27272a] text-gray-400 py-1 rounded-[4px] text-[10px]">Cancel</button>
                        </div>
                    </div>
                )}

                {getCurrentItems()
                    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .sort((a, b) => {
                        // Pin Priority
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        // Name Sort
                        return sortOrder === 'az'
                            ? a.name.localeCompare(b.name)
                            : b.name.localeCompare(a.name);
                    })
                    .map(item => (
                        editingFolder?.id === item.id ? (
                            <div key={item.id} className="p-4 rounded-xl border border-accent-blue bg-app-bg shadow-xl cursor-default flex flex-col gap-2">
                                <h3 className="text-xs font-bold text-accent-blue">Editar Biblioteca</h3>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-blue"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') onUpdateFolder();
                                        if (e.key === 'Escape') setEditingFolder(null);
                                    }}
                                />
                                {item.type === 'folder' && (
                                    <div className="grid grid-cols-8 gap-1">
                                        {PROJECT_THEMES.map(theme => (
                                            <button
                                                key={theme.bg}
                                                onClick={() => setEditColor(theme.bg)}
                                                className={`w-3 h-3 rounded-full transition-all ${theme.bg} ${editColor === theme.bg ? 'ring-1 ring-white scale-125' : 'hover:scale-125 opacity-70 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 mt-1">
                                    <button onClick={onUpdateFolder} className="flex-1 bg-accent-blue text-white py-1 rounded-[4px] text-[10px] font-bold">Salvar</button>
                                    <button onClick={() => setEditingFolder(null)} className="px-2 bg-[#27272a] text-gray-400 py-1 rounded-[4px] text-[10px]">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={item.id}
                                onClick={() => {
                                    if (item.type === 'comic') {
                                        onOpenComic(item.id);
                                    } else if (item.type === 'folder') {
                                        // SMART NAVIGATION: If folder contains files, open as comic
                                        const hasFiles = fileSystem.some(f => f.parentId === item.id && f.type === 'file');
                                        if (hasFiles) {
                                            onOpenComic(item.id);
                                        } else {
                                            onOpenItem(item);
                                        }
                                    } else {
                                        onOpenItem(item);
                                    }
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (confirm(`Excluir ${item.name}?`)) {
                                        onDeleteFolder(item.id, e);
                                    }
                                }}
                                className="group cursor-pointer relative"
                            >
                                {/* Pin Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTogglePin(item.id);
                                    }}
                                    className={`absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 transition-all z-20 ${item.isPinned ? 'opacity-100 bg-white/20' : 'opacity-0 group-hover:opacity-100'}`}
                                >
                                    <Pin size={14} className={item.isPinned ? "fill-white text-white" : "text-white"} />
                                </button>

                                {/* Checkbox for Selection */}
                                <div
                                    className={`absolute top-2 left-2 z-20 transition-all ${selectedItems.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.has(item.id)}
                                        onChange={() => toggleSelection(item.id)}
                                        className="w-4 h-4 rounded border-gray-600 bg-black/50 checked:bg-accent-blue cursor-pointer"
                                    />
                                </div>

                                <div className={`aspect-square rounded-xl border border-border-color bg-app-bg overflow-hidden relative transition-all group-hover:border-accent-blue group-hover:shadow-lg ${item.type === 'folder' ? 'flex flex-col items-center justify-center gap-3' : ''}`}>
                                    {item.type === 'folder' ? (
                                        (() => {
                                            // SMART THUMBNAIL: Check if folder has images
                                            const images = fileSystem.filter(f => f.parentId === item.id && f.type === 'file').sort((a, b) => (a.order || 0) - (b.order || 0));
                                            const coverUrl = images[0]?.url;

                                            if (coverUrl) {
                                                return (
                                                    <>
                                                        <img src={coverUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={item.name} />
                                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <Folder size={12} className="text-accent-blue" />
                                                                <span className="text-xs font-bold text-white truncate shadow-black drop-shadow-md">{item.name}</span>
                                                            </div>
                                                            <span className="text-[10px] text-white/80 font-medium">{images.length} páginas</span>
                                                        </div>
                                                    </>
                                                )
                                            }

                                            return (
                                                <>
                                                    <Folder size={40} className={PROJECT_THEMES.find(t => t.bg === item.color)?.text || 'text-blue-400 fill-blue-400/10'} />
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-medium text-center truncate px-2 text-white max-w-full">{item.name}</span>
                                                        {item.createdAt && <span className="text-[10px] text-white/40">{new Date(item.createdAt).toLocaleDateString()}</span>}
                                                    </div>
                                                </>
                                            )
                                        })()
                                    ) : item.type === 'comic' ? (
                                        (() => {
                                            const pages = fileSystem.filter(f => f.parentId === item.id).sort((a, b) => a.name.localeCompare(b.name));
                                            const coverUrl = pages[0]?.url;

                                            return (
                                                <>
                                                    {coverUrl ? (
                                                        <img src={coverUrl} className="w-full h-full object-cover" alt={item.name} />
                                                    ) : (
                                                        <div className="flex flex-col items-center text-text-secondary">
                                                            <LayoutGrid size={32} />
                                                            <span className="text-[10px] mt-2">Sem capa</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
                                                        <span className="text-xs font-medium text-white truncate block">{item.name}</span>
                                                        <span className="text-[10px] text-white/60">{pages.length} páginas</span>
                                                    </div>
                                                </>
                                            )
                                        })()
                                    ) : (
                                        <>
                                            <img src={item.url} className="w-full h-full object-cover" alt={item.name} />
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
                                                <span className="text-xs font-medium text-white truncate block">{item.name}</span>
                                            </div>
                                        </>
                                    )}

                                    {/* Hover Actions */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                                        {item.type === 'folder' && (
                                            <>
                                                <button
                                                    onClick={(e) => onStartEditingFolder(item, e)}
                                                    className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => onDeleteFolder(item.id, e)}
                                                    className="p-1.5 bg-black/50 hover:bg-red-900/80 rounded-full text-red-300 backdrop-blur-sm transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        )}
                                        {/* File/Comic Delete Button */}
                                        {item.type !== 'folder' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeletePages([item.id]);
                                                }}
                                                className="p-1.5 bg-black/50 hover:bg-red-900/80 rounded-full text-red-300 backdrop-blur-sm transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    ))}

                {getCurrentItems().length === 0 && !loading && !isCreatingFolder && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-text-secondary opacity-50">
                        <div className="text-6xl mb-4">📂</div>
                        <p>Biblioteca vazia</p>
                        <p className="text-xs">Arraste um PDF ou crie uma sub-biblioteca</p>
                    </div>
                )}
            </div>
        </>
    )
}

export default ProjectDetail;
