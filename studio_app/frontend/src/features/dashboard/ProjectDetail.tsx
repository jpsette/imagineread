import React, { useState, useRef, useMemo } from 'react'
import { Folder, Pin, Pencil, Trash2, ChevronRight, ArrowLeft, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import * as ReactWindow from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Card } from '../../ui/Card';
import { FileEntry } from '../../types';
import { PROJECT_THEMES } from '../../constants/theme';

import { useProjectStore } from '../../store/useProjectStore';
import { useFileSystemStore } from '../../store/useFileSystemStore';
import { useFileActions } from '../../hooks/useFileActions';

const FixedSizeGrid = (ReactWindow as any).FixedSizeGrid;

interface CellData {
    virtualItems: (FileEntry | { type: string; id: string })[];
    columnCount: number;
    state: {
        isCreatingFolder: boolean;
        newItemName: string;
        newItemColor: string;
        selectedItems: Set<string>;
        editingFolder: FileEntry | null;
        editName: string;
        editColor: string;
    };
    actions: {
        setIsCreatingFolder: (v: boolean) => void;
        setNewItemName: (v: string) => void;
        setNewItemColor: (v: string) => void;
        handleCreateFolder: () => void;
        setEditingFolder: (v: FileEntry | null) => void;
        setEditName: (v: string) => void;
        setEditColor: (v: string) => void;
        handleUpdateFolder: () => void;
        handleImportFiles: (files: File[]) => void;
        toggleSelection: (id: string) => void;
        handleOpenComic: (id: string) => void;
        handleOpenItem: (item: FileEntry) => void;
        deletePages: (ids: string[]) => void;
        triggerFileInput: () => void;
    };
}

interface GridChildComponentProps {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: CellData;
}

const GUTTER_SIZE = 24;

const Cell: React.FC<GridChildComponentProps> = ({ columnIndex, rowIndex, style, data }) => {
    const { virtualItems, columnCount, state, actions } = data;
    const index = rowIndex * columnCount + columnIndex;

    if (index >= virtualItems.length) {
        return null;
    }

    const item = virtualItems[index];

    const itemStyle = {
        ...style,
        left: Number(style.left) + GUTTER_SIZE / 2,
        top: Number(style.top) + GUTTER_SIZE / 2,
        width: Number(style.width) - GUTTER_SIZE,
        height: Number(style.height) - GUTTER_SIZE,
    };

    if ('type' in item && item.type === 'CREATE_BTN') {
        return (
            <div style={itemStyle}>
                <Card
                    onClick={() => actions.setIsCreatingFolder(true)}
                    className="group relative h-full w-full p-4 border-dashed bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer transition-all"
                >
                    <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                        <Folder size={24} />
                    </div>
                    <span className="text-xs font-bold text-text-secondary group-hover:text-accent-blue transition-colors">Nova Biblioteca</span>
                </Card>
            </div>
        );
    }

    if ('type' in item && item.type === 'IMPORT_BTN') {
        return (
            <div style={itemStyle}>
                <Card
                    onClick={actions.triggerFileInput}
                    className="group relative h-full w-full p-4 border-dashed bg-app-bg hover:border-accent-blue hover:bg-accent-blue/5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md cursor-pointer transition-all"
                >
                    <div className="p-3 rounded-full bg-[#27272a] text-text-secondary group-hover:bg-accent-blue group-hover:text-white transition-colors">
                        <Upload size={24} />
                    </div>
                    <span className="text-xs font-bold text-text-secondary group-hover:text-accent-blue transition-colors">Importar</span>
                </Card>
            </div>
        );
    }

    if ('type' in item && item.type === 'CREATOR_WIDGET') {
        return (
            <div style={itemStyle}>
                <Card className="h-full w-full p-4 border-accent-blue bg-app-bg shadow-xl shadow-blue-500/10 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold mb-2 text-accent-blue">Nova Pasta</h3>
                        <Input
                            autoFocus
                            placeholder="Nome..."
                            value={state.newItemName}
                            onChange={(e) => actions.setNewItemName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') actions.handleCreateFolder();
                                if (e.key === 'Escape') actions.setIsCreatingFolder(false);
                            }}
                            className="mb-2 !text-xs !py-1"
                        />
                        <div className="grid grid-cols-5 gap-1">
                            {PROJECT_THEMES.slice(0, 5).map(theme => (
                                <button
                                    key={theme.bg}
                                    onClick={() => actions.setNewItemColor(theme.bg)}
                                    className={`w-4 h-4 rounded-full transition-all ${theme.bg} ${state.newItemColor === theme.bg ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                        <Button size="sm" onClick={actions.handleCreateFolder} className="flex-1 !text-xs !h-7">Criar</Button>
                        <Button size="sm" variant="secondary" onClick={() => actions.setIsCreatingFolder(false)} className="!text-xs !h-7">Cancel</Button>
                    </div>
                </Card>
            </div>
        );
    }

    const fileItem = item as FileEntry;
    const isSelected = state.selectedItems.has(fileItem.id);
    const isEditing = state.editingFolder?.id === fileItem.id;
    const isFolder = fileItem.type === 'folder';

    const isImage = (fileItem.type === 'file') && (
        ((fileItem as any).mimeType && (fileItem as any).mimeType.startsWith('image/')) ||
        (fileItem.name && fileItem.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) ||
        fileItem.url
    );

    const isEdited =
        (fileItem as any).status === 'in_progress' ||
        (typeof (fileItem as any).clean_url === 'string' && (fileItem as any).clean_url.length > 5) ||
        ((fileItem as any).is_cleaned === true) ||
        (Array.isArray((fileItem as any).balloons) && (fileItem as any).balloons.length > 0);

    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.stopPropagation();
            actions.toggleSelection(fileItem.id);
        } else {
            if (fileItem.type === 'folder') {
                actions.handleOpenItem(fileItem);
            } else if (fileItem.type === 'comic') {
                actions.handleOpenComic(fileItem.id);
            } else {
                const targetComicId = fileItem.parentId;
                if (targetComicId) actions.handleOpenComic(targetComicId);
            }
        }
    };

    return (
        <div style={itemStyle}>
            <div
                className={`relative group cursor-pointer h-full w-full transition-all ${isSelected ? 'ring-2 ring-accent-blue rounded-lg' : ''}`}
                onClick={handleClick}
            >
                {!isEditing && (
                    <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); }} className={`p-1.5 rounded-md hover:bg-black/50 backdrop-blur-sm ${fileItem.isPinned ? 'text-accent-blue' : 'text-white/70 hover:text-white'}`}>
                            <Pin size={12} className={fileItem.isPinned ? "fill-current" : ""} />
                        </button>
                        {isFolder && (
                            <button onClick={(e) => { e.stopPropagation(); actions.setEditingFolder(fileItem); actions.setEditName(fileItem.name); actions.setEditColor(fileItem.color || '') }} className="p-1.5 rounded-md hover:bg-black/50 text-zinc-400 hover:text-white">
                                <Pencil size={12} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); actions.deletePages([fileItem.id]) }} className={`p-1.5 rounded-md hover:bg-black/50 backdrop-blur-sm text-red-300 hover:text-red-200`}>
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}

                {isEditing ? (
                    <Card className="h-full w-full p-4 flex flex-col justify-between bg-app-bg border-accent-blue">
                        <div className="flex flex-col h-full justify-between" onClick={e => e.stopPropagation()}>
                            <div>
                                <h3 className="text-xs font-bold mb-2 text-accent-blue">Editar</h3>
                                <Input
                                    autoFocus
                                    value={state.editName}
                                    onChange={(e) => actions.setEditName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') actions.handleUpdateFolder();
                                        if (e.key === 'Escape') actions.setEditingFolder(null);
                                    }}
                                    className="mb-2 !text-xs"
                                />
                                {isFolder && (
                                    <div className="grid grid-cols-8 gap-1 mb-2">
                                        {PROJECT_THEMES.map(theme => (
                                            <button
                                                key={theme.bg}
                                                onClick={() => actions.setEditColor(theme.bg)}
                                                className={`w-3 h-3 rounded-full transition-all ${theme.bg} ${state.editColor === theme.bg ? 'ring-1 ring-white scale-125' : 'hover:scale-125 opacity-70 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button size="sm" onClick={actions.handleUpdateFolder} className="flex-1 !text-xs !h-7">Salvar</Button>
                                <Button size="sm" variant="secondary" onClick={() => actions.setEditingFolder(null)} className="!text-xs !h-7">Cancel</Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        {isImage ? (
                            <div className="group relative w-full h-full bg-gray-900 border border-gray-800 hover:border-blue-500 transition-all duration-200 cursor-pointer rounded-none border-white/5">
                                {isEdited && (
                                    <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 flex items-center gap-1.5 z-50 border-b border-l border-gray-700 shadow-lg">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                        EM EDIÇÃO
                                    </div>
                                )}
                                {(fileItem.name.match(/\d+/) || [])[0] && (
                                    <div className="absolute top-0 left-0 bg-black/80 text-white text-xs px-2 py-1 z-40">
                                        #{(fileItem.name.match(/\d+/) || [])[0]}
                                    </div>
                                )}
                                <img
                                    src={fileItem.url || (fileItem as any).thumbnailUrl}
                                    alt={fileItem.name}
                                    className="w-full h-full object-cover select-none"
                                    loading="lazy"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 pointer-events-none">
                                    <span className="text-xs text-white font-medium truncate block shadow-sm pr-4">
                                        {fileItem.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <Card className="h-full w-full p-4 flex flex-col items-center justify-center gap-3 bg-app-bg hover:bg-accent-blue/5 border-white/5 hover:border-accent-blue/30 transition-all">
                                <Folder size={40} className={`${PROJECT_THEMES.find(t => t.bg === fileItem.color)?.text || 'text-blue-500'} opacity-80`} />
                                <div className="flex flex-col items-center w-full">
                                    <span className="text-xs font-medium text-center truncate px-2 text-white max-w-full">{fileItem.name}</span>
                                    {fileItem.createdAt && <span className="text-[10px] text-white/40">{new Date(fileItem.createdAt).toLocaleDateString()}</span>}
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export const ProjectDetail: React.FC = () => {
    const navigate = useNavigate();

    const { projects, currentProjectId } = useProjectStore();
    const { fileSystem, currentFolderId, setCurrentFolderId } = useFileSystemStore();
    const { createFolder, deleteFolder, deletePages, uploadPages, uploadPDF } = useFileActions();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'az' | 'za'>('az');
    const [loading, setLoading] = useState(false);

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState(PROJECT_THEMES[0].bg);

    const [editingFolder, setEditingFolder] = useState<FileEntry | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const project = projects.find(p => p.id === currentProjectId);

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
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            return sortOrder === 'az'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        });

    const virtualItems = useMemo(() => {
        if (isCreatingFolder) {
            return [{ type: 'CREATOR_WIDGET', id: 'CREATOR' }, ...items];
        }
        return [{ type: 'CREATE_BTN', id: 'CREATE_BTN' }, { type: 'IMPORT_BTN', id: 'IMPORT_BTN' }, ...items];
    }, [isCreatingFolder, items]);

    const handleCreateFolder = async () => {
        if (!newItemName) return;

        const targetParentId = currentFolderId || project?.rootFolderId;
        if (!targetParentId) return;

        setLoading(true);
        try {
            await createFolder(newItemName, targetParentId);
            setIsCreatingFolder(false);
            setNewItemName('');
            setNewItemColor(PROJECT_THEMES[0].bg);
        } catch (e) {
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFolder = async () => {
        if (!editingFolder || !editName) return;
        setEditingFolder(null);
    };

    const handleBack = () => {
        if (currentFolderId) {
            if (project && currentFolderId === project.rootFolderId) {
                navigate('/');
                return;
            }
            const current = fileSystem.find(f => f.id === currentFolderId);
            if (!current?.parentId) {
                navigate('/');
            } else {
                setCurrentFolderId(current.parentId);
            }
        } else {
            navigate('/');
        }
    };

    const handleOpenItem = (item: FileEntry) => {
        if (item.type === 'folder') {
            const hasPages = fileSystem.some(f => f.parentId === item.id && f.type === 'file');
            const hasSubFolders = fileSystem.some(f => f.parentId === item.id && f.type === 'folder');

            if (hasPages && !hasSubFolders) {
                handleOpenComic(item.id);
            } else {
                setCurrentFolderId(item.id);
            }
        } else if (item.type === 'comic') {
            handleOpenComic(item.id);
        }
    };

    const handleOpenComic = (comicId: string) => {
        navigate(`/editor/${comicId}`);
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
    };

    const handleBulkDelete = () => {
        if (selectedItems.size === 0) return;
        const itemsToDelete = getCurrentItems().filter(i => selectedItems.has(i.id));
        const mimeFolder = itemsToDelete.filter(i => i.type === 'folder');
        const mimeFiles = itemsToDelete.filter(i => i.type !== 'folder');

        if (mimeFiles.length > 0) deletePages(mimeFiles.map(f => f.id));
        if (mimeFolder.length > 0) {
            mimeFolder.forEach(f => deleteFolder(f.id));
        }
        setSelectedItems(new Set());
    };

    const handleImportFiles = async (files: File[]) => {
        const pdfs = files.filter(f => f.type === 'application/pdf');
        const images = files.filter(f => f.type.startsWith('image/'));

        setLoading(true);
        try {
            for (const pdf of pdfs) {
                const targetParentId = currentFolderId || project?.rootFolderId || 'root';
                await uploadPDF(pdf, targetParentId);
            }

            if (images.length > 0) {
                const targetParentId = currentFolderId || project?.rootFolderId;
                if (targetParentId) {
                    await uploadPages(images, targetParentId);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const cellData: CellData = {
        virtualItems,
        columnCount: 1,
        state: {
            isCreatingFolder, newItemName, newItemColor,
            selectedItems, editingFolder, editName, editColor
        },
        actions: {
            setIsCreatingFolder, setNewItemName, setNewItemColor, handleCreateFolder,
            setEditingFolder, setEditName, setEditColor, handleUpdateFolder,
            handleImportFiles, toggleSelection, handleOpenComic, handleOpenItem, deletePages,
            triggerFileInput: () => fileInputRef.current?.click()
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex flex-col gap-6 mb-4 pt-4 px-2 shrink-0">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={handleBack}>
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

                    <div className="flex items-center gap-3">
                        <Input
                            placeholder="Pesquisar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-48 !bg-transparent !border-white/10 !text-xs"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSortOrder(prev => prev === 'az' ? 'za' : 'az')}
                            className="text-xs"
                        >
                            {sortOrder === 'az' ? 'A-Z' : 'Z-A'}
                        </Button>
                        <div className="w-[1px] h-4 bg-white/10 mx-1" />

                        {loading && <div className="text-xs text-white/40 animate-pulse">Processing...</div>}

                        {selectedItems.size > 0 && (
                            <Button
                                variant="danger"
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

            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files?.length) handleImportFiles(Array.from(e.target.files));
                    if (e.target) e.target.value = '';
                }}
            />

            <div className="flex-1 min-h-0 pl-2">
                {/* @ts-ignore */}
                <AutoSizer>
                    {({ height, width }: { height: number; width: number }) => {
                        const desiredWidth = 200;
                        const columnCount = Math.max(1, Math.floor(width / desiredWidth));
                        const columnWidth = width / columnCount;
                        const rowCount = Math.ceil(virtualItems.length / columnCount);
                        const rowHeight = 280;

                        return (
                            <FixedSizeGrid
                                columnCount={columnCount}
                                columnWidth={columnWidth}
                                height={height}
                                rowCount={rowCount}
                                rowHeight={rowHeight}
                                width={width}
                                itemData={{ ...cellData, columnCount }}
                            >
                                {Cell}
                            </FixedSizeGrid>
                        );
                    }}
                </AutoSizer>
            </div>
        </div>
    );
};

export default ProjectDetail;
