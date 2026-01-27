import React from 'react';
import { Folder, Image as ImageIcon, Pin, Pencil, Trash2, Book } from 'lucide-react';
import { Card } from '../../../../ui/Card';
import { FileEntry } from '../../../../types';

interface ProjectItemCardProps {
    item: FileEntry;
    coverImage?: string;
    isSelected: boolean;
    isRenaming: boolean;

    // Actions
    onClick: (e: React.MouseEvent) => void;
    onDelete: (id: string) => void;
    onTogglePin: () => void;
    onEditItem: (item: FileEntry) => void;

    // Display Info

    childrenCount: number;
}

// Explicit map to prevent Tailwind purging dynamic classes like `text-${base}`
const COLOR_VARIANTS: Record<string, { text: string, border: string, ring: string }> = {
    'bg-zinc-500': { text: 'text-zinc-500', border: 'border-zinc-500', ring: 'ring-zinc-500' },
    'bg-red-500': { text: 'text-red-500', border: 'border-red-500', ring: 'ring-red-500' },
    'bg-orange-500': { text: 'text-orange-500', border: 'border-orange-500', ring: 'ring-orange-500' },
    'bg-amber-500': { text: 'text-amber-500', border: 'border-amber-500', ring: 'ring-amber-500' },
    'bg-yellow-500': { text: 'text-yellow-500', border: 'border-yellow-500', ring: 'ring-yellow-500' },
    'bg-lime-500': { text: 'text-lime-500', border: 'border-lime-500', ring: 'ring-lime-500' },
    'bg-green-500': { text: 'text-green-500', border: 'border-green-500', ring: 'ring-green-500' },
    'bg-emerald-500': { text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500' },
    'bg-teal-500': { text: 'text-teal-500', border: 'border-teal-500', ring: 'ring-teal-500' },
    'bg-cyan-500': { text: 'text-cyan-500', border: 'border-cyan-500', ring: 'ring-cyan-500' },
    'bg-sky-500': { text: 'text-sky-500', border: 'border-sky-500', ring: 'ring-sky-500' },
    'bg-blue-500': { text: 'text-blue-500', border: 'border-blue-500', ring: 'ring-blue-500' },
    'bg-indigo-500': { text: 'text-indigo-500', border: 'border-indigo-500', ring: 'ring-indigo-500' },
    'bg-violet-500': { text: 'text-violet-500', border: 'border-violet-500', ring: 'ring-violet-500' },
    'bg-purple-500': { text: 'text-purple-500', border: 'border-purple-500', ring: 'ring-purple-500' },
    'bg-fuchsia-500': { text: 'text-fuchsia-500', border: 'border-fuchsia-500', ring: 'ring-fuchsia-500' },
    'bg-pink-500': { text: 'text-pink-500', border: 'border-pink-500', ring: 'ring-pink-500' },
    'bg-rose-500': { text: 'text-rose-500', border: 'border-rose-500', ring: 'ring-rose-500' },
    'bg-slate-500': { text: 'text-slate-500', border: 'border-slate-500', ring: 'ring-slate-500' },
    'bg-stone-500': { text: 'text-stone-500', border: 'border-stone-500', ring: 'ring-stone-500' },
};

// Helper to derive color variants from the stored bg- class
const getColorVariants = (color: string | undefined) => {
    if (!color || !COLOR_VARIANTS[color]) return {
        text: 'text-accent-blue',
        border: 'border-accent-blue',
        ring: 'ring-accent-blue'
    };

    return COLOR_VARIANTS[color];
};

export const ProjectItemCard: React.FC<ProjectItemCardProps> = ({
    item,
    coverImage,
    isSelected,
    onEditItem,
    onClick,
    onDelete,
    onTogglePin,
    childrenCount
}) => {
    const { text: textColor, border: borderColor, ring: ringColor } = getColorVariants(item.color);

    // Comic/Folder Icon specific class
    const iconColorClass = item.color ? textColor : 'text-accent-blue';

    return (
        <Card
            onClick={onClick}
            // Uses dynamic border and ring colors on hover/selection
            className={`
                h-72 relative group cursor-pointer border bg-surface overflow-hidden 
                hover:ring-2 hover:shadow-2xl transition-all duration-300
                ${isSelected ? `ring-2 ${ringColor} ${borderColor}` : 'border-border-color'}
                hover:${borderColor} hover:${ringColor}
            `}
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
                        <Book size={48} className={`${iconColorClass} opacity-80 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg group-hover:scale-110`} />
                    ) : item.type === 'folder' ? (
                        <Folder size={48} className={`${iconColorClass} opacity-80 group-hover:opacity-100 transition-all duration-300 drop-shadow-lg group-hover:scale-110`} />
                    ) : (
                        <ImageIcon size={48} className="text-text-muted group-hover:text-purple-500 transition-colors" />
                    )}
                </div>
            )}

            {/* ACTION BUTTONS */}
            <div className={`absolute top-2 right-2 z-20 flex gap-1 transition-all duration-200 translate-y-2 group-hover:translate-y-0 bg-black/60 rounded-lg p-1 backdrop-blur-md border border-white/10 ${item.isPinned ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                    className={`p-1.5 hover:bg-white/20 rounded transition-colors ${item.isPinned ? 'text-accent-blue' : 'text-text-muted hover:text-white'}`}
                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                >
                    <Pin size={14} className={item.isPinned ? "fill-current" : ""} />
                </button>
                <button
                    className="p-1.5 hover:bg-white/20 rounded text-text-muted hover:text-accent-blue transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditItem(item);
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

            {/* META INFO */}
            <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1 z-10">
                <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300 delay-75">
                    <span className={`text-[10px] uppercase font-bold tracking-widest ${iconColorClass} bg-surface/90 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm shadow-sm`}>
                        {(item.type === 'comic' || item.isComic) ? 'Comic' : (item.type === 'folder' ? 'Biblioteca' : 'Arquivo')}
                    </span>
                    {item.isPinned && (
                        <Pin size={10} className="text-accent-blue fill-current" />
                    )}
                </div>

                <p className="text-sm font-bold text-white truncate leading-tight drop-shadow-md tracking-tight shadow-black/50">{item.name}</p>

                {item.type === 'folder' && (
                    <p className="text-[10px] text-text-muted font-medium">
                        {childrenCount} itens
                    </p>
                )}
            </div>
        </Card>
    );
};
