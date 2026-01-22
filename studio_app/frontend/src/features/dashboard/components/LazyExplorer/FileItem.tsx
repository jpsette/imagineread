import React from 'react';
import { Pencil, Trash2, File } from 'lucide-react';
import { FileEntry } from '../../../../types';

interface FileItemProps {
    file: FileEntry;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onEdit: (file: FileEntry, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    depth?: number;
}

export const FileItem: React.FC<FileItemProps> = ({
    file,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    depth = 0
}) => {
    // Style logic matching Explorer.tsx
    // Original: `px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white/5 group transition-colors ml-5` (for comic under library)
    // Actually depth logic was hardcoded in original via `ml-5` or `ml-6`.
    // In Recursive, we use dynamic padding. 1.25rem (ml-5) approx 20px. 
    // Let's use `paddingLeft: depth * 20 + 12` px (12 is visual offset).

    // Actually the original used nested divs with ml-4/ml-6.
    // Let's standardize: 1 level = 20px indent.

    return (
        <div
            className={`px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-surface-hover group transition-colors ${isSelected ? 'bg-accent-blue/20 text-white' : 'text-text-muted'}`}
            style={{ paddingLeft: `${(depth * 16) + 12}px` }} // Dynamic Indentation
            onClick={() => onSelect(file.id)}
        >
            <File size={14} className="text-text-primary" />
            <span className="truncate flex-1 font-medium text-text-primary">{file.name}</span>
            {/* Optional count if we had it, but for file it's just name */}

            <div className="hidden group-hover:flex gap-1 ml-auto">
                <button
                    onClick={(e) => onEdit(file, e)}
                    className="p-1 hover:text-white text-text-muted transition-colors"
                >
                    <Pencil size={11} />
                </button>
                <button
                    onClick={(e) => onDelete(file.id, e)}
                    className="p-1 hover:text-red-400 text-text-muted transition-colors"
                >
                    <Trash2 size={11} />
                </button>
            </div>
        </div>
    );
};
