import React, { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { FileEntry } from '../../../../types';
import { useFolderContents } from '../../hooks/useFolderContents';
import { FileItem } from './FileItem';

interface LazyFolderItemProps {
    folder: FileEntry;
    currentFolderId: string | null;
    onSelectFolder: (id: string) => void;
    onEditFolder: (folder: FileEntry) => void;
    onDeleteFolder: (id: string) => void;
    depth?: number;
    forceExpand?: boolean; // For initial state or restore
}

export const LazyFolderItem: React.FC<LazyFolderItemProps> = ({
    folder,
    currentFolderId,
    onSelectFolder,
    onEditFolder,
    onDeleteFolder,
    depth = 0,
    forceExpand = false
}) => {
    const [isExpanded, setIsExpanded] = useState(forceExpand);
    const isSelected = currentFolderId === folder.id;

    // === LAZY LOAD ===
    // Only fetch if expanded! This is the magic.
    // If not expanded, data is undefined (stale/inactive).
    const { data: contents, isLoading } = useFolderContents(isExpanded ? folder.id : null);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);

        // If we want auto-select on expand? No, Explorer separate selection from expansion.
    };

    const handleSelect = () => {
        onSelectFolder(folder.id);
    };

    // Filter contents
    const subFolders = contents?.filter(f => f.type === 'folder') || [];
    const files = contents?.filter(f => f.type === 'file' || f.type === 'comic') || [];
    const isEmpty = !isLoading && contents && contents.length === 0;

    // PROJECT_THEMES color mapping support (if passed/context) or direct color
    // Actually typically the color stored is 'bg-red-500'. We need text-red-500 for the icon.
    // Simple heuristic:
    const iconColor = folder.color?.startsWith('bg-')
        ? folder.color.replace('bg-', 'text-')
        : (folder.color || 'text-blue-500');

    return (
        <div className="flex flex-col">
            {/* ROW RENDER */}
            <div
                className={`px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white/5 group transition-colors ${isSelected ? 'bg-blue-500/20 text-white' : 'text-zinc-400'}`}
                style={{ paddingLeft: `${depth * 10}px` }}
                onClick={handleSelect}
            >
                <button
                    onClick={handleToggle}
                    className="p-0.5 hover:text-white transition-colors"
                >
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                <Folder size={14} className={iconColor} />

                <span className="truncate flex-1 font-medium text-white">{folder.name}</span>

                {/* Count Hint (only if loaded, else '...') */}
                <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">
                    ({contents ? contents.length : '...'})
                </span>

                <div className="hidden group-hover:flex gap-1 ml-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
                        className="p-1 hover:text-white text-zinc-600 transition-colors"
                    >
                        <Pencil size={11} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Tem certeza que deseja excluir esta pasta?')) onDeleteFolder(folder.id);
                        }}
                        className="p-1 hover:text-red-400 text-zinc-600 transition-colors"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            {/* CHILDREN RENDER */}
            {isExpanded && (
                <div className="flex flex-col gap-0.5 border-l border-white/5 ml-2">
                    {isLoading && <div className="pl-6 py-1 text-[10px] text-zinc-600 italic">Carregando...</div>}

                    {subFolders.map(child => (
                        <LazyFolderItem
                            key={child.id}
                            folder={child}
                            currentFolderId={currentFolderId}
                            onSelectFolder={onSelectFolder}
                            onEditFolder={onEditFolder}
                            onDeleteFolder={onDeleteFolder}
                            depth={depth + 1}
                        />
                    ))}

                    {files.map(file => (
                        <FileItem
                            key={file.id}
                            file={file}
                            isSelected={currentFolderId === file.id} // Or separate 'File Selection'? Explorer usually selects Folders.
                            // In original, if it's a "Comic" (File), it can be selected as currentFolderId?
                            // Yes: if (isLikelyComic) handleSelectFolder(lib.id).
                            // So we propagate onSelectFolder for files too if they act as containers (Comics).
                            onSelect={onSelectFolder}
                            onEdit={(f, e) => { e.stopPropagation(); onEditFolder(f); }}
                            onDelete={(id, e) => { e.stopPropagation(); onDeleteFolder(id); }}
                            depth={depth + 1}
                        />
                    ))}

                    {isEmpty && (
                        <span className="text-[10px] text-zinc-700 py-1 pl-6 italic">Vazio</span>
                    )}
                </div>
            )}
        </div>
    );
};
