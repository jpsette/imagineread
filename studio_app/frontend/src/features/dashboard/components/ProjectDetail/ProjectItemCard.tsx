import React, { useState } from 'react';
import { Folder, Image as ImageIcon, Pin, Pencil, Trash2, Book } from 'lucide-react';
import { Card } from '../../../../ui/Card';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/Input';
import { FileEntry } from '../../../../types';

interface ProjectItemCardProps {
    item: FileEntry;
    coverImage?: string;
    isSelected: boolean;
    isRenaming: boolean;

    // Renaming State (Controlled by Parent for singleton behavior)
    renameValue: string;
    onRenameChange: (val: string) => void;
    renamingColor: string;
    onRenamingColorChange: (val: string) => void;
    onRenameSubmit: () => void;
    onRenameCancel: () => void;
    onInitiateRename: (id: string, name: string, color: string) => void;

    // Actions
    onClick: (e: React.MouseEvent) => void;
    onDelete: (id: string) => void;

    // Display Info
    childrenCount: number;
    projectThemes: any[];
}

// Helper duplicated for isolation (or move to shared utils later)
const getFolderColorClass = (color: string | undefined, themes: any[]) => {
    if (!color) return 'text-accent-blue';

    // 1. Try finding in themes (best match)
    const theme = themes?.find((t: any) => t.bg === color);
    if (theme) return theme.text;

    // 2. If it's a bg- class, swap to text-
    if (color.startsWith('bg-')) {
        return color.replace('bg-', 'text-');
    }

    // 3. Default
    return 'text-accent-blue';
};

export const ProjectItemCard: React.FC<ProjectItemCardProps> = ({
    item,
    coverImage,
    isSelected,
    isRenaming,
    renameValue,
    onRenameChange,
    renamingColor,
    onRenamingColorChange,
    onRenameSubmit,
    onRenameCancel,
    onInitiateRename,
    onClick,
    onDelete,
    childrenCount,
    projectThemes
}) => {
    const folderColor = getFolderColorClass(item.color, projectThemes);
    const activeColorClass = isRenaming && renamingColor ? getFolderColorClass(renamingColor, projectThemes) : folderColor;

    return (
        <Card
            onClick={onClick}
            className={`h-72 relative group cursor-pointer border bg-surface overflow-hidden hover:ring-2 hover:ring-accent-blue hover:shadow-2xl transition-all duration-300 ${isSelected ? 'ring-2 ring-accent-blue border-accent-blue' : 'border-border-color'}`}
        >
            {/* COVER IMAGE */}
            {coverImage ? (
                <>
                    <div className="absolute inset-0 bg-surface">
                        <img src={coverImage} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity" />
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface to-surface-hover group-hover:from-surface-hover group-hover:to-surface transition-colors">
                    {(item.type === 'comic' || item.isComic) ? (
                        <Book size={48} className={`${activeColorClass} opacity-80 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg group-hover:scale-110`} />
                    ) : item.type === 'folder' ? (
                        <Folder size={48} className={`${activeColorClass} opacity-80 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg group-hover:scale-110`} />
                    ) : (
                        <ImageIcon size={48} className="text-text-muted group-hover:text-purple-500 transition-colors" />
                    )}
                </div>
            )}

            {/* ACTION BUTTONS - Hide when renaming */}
            {!isRenaming && (
                <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 bg-black/60 rounded-lg p-1 backdrop-blur-md border border-white/10">
                    <button className="p-1.5 hover:bg-white/20 rounded text-text-muted hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                        <Pin size={14} />
                    </button>
                    <button
                        className="p-1.5 hover:bg-white/20 rounded text-text-muted hover:text-accent-blue transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onInitiateRename(item.id, item.name, item.color || '');
                        }}
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        className="p-1.5 hover:bg-red-500/20 rounded text-text-muted hover:text-red-400 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Excluir este item?')) onDelete(item.id);
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {/* META INFO */}
            <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1 z-10">
                <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300 delay-75">
                    <span className={`text-[10px] uppercase font-bold tracking-widest ${activeColorClass} bg-surface/90 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm shadow-sm`}>
                        {(item.type === 'comic' || item.isComic) ? 'Comic' : (item.type === 'folder' ? 'Biblioteca' : 'Comic')}
                    </span>
                </div>

                {isRenaming ? (
                    <div onClick={e => e.stopPropagation()} className="flex flex-col gap-2 bg-surface/90 p-2 rounded-lg border border-accent-blue/50 backdrop-blur-md">
                        <Input
                            autoFocus
                            value={renameValue}
                            onChange={e => onRenameChange(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') onRenameSubmit();
                                if (e.key === 'Escape') onRenameCancel();
                            }}
                            className="h-8 py-1 text-sm font-bold bg-surface border-accent-blue text-text-primary"
                        />
                        {/* COLOR PICKER FOR RENAMING */}
                        <div className="flex flex-wrap gap-1">
                            {projectThemes && projectThemes.map((theme: any) => (
                                <button
                                    key={theme.bg}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRenamingColorChange(theme.bg);
                                    }}
                                    className={`w-3 h-3 rounded-full transition-all ${theme.bg} ${renamingColor === theme.bg ? 'ring-2 ring-white scale-125' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                        <Button size="sm" onClick={onRenameSubmit} className="h-6 text-[10px] mt-1 w-full">Salvar</Button>
                    </div>
                ) : (
                    <p className="text-sm font-bold text-white truncate leading-tight drop-shadow-md tracking-tight shadow-black/50">{item.name}</p>
                )}

                {item.type === 'folder' && (
                    <p className="text-[10px] text-text-muted font-medium">
                        {childrenCount} itens
                    </p>
                )}
            </div>
        </Card>
    );
};
