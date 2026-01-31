/**
 * Panel Preview Items
 * 
 * Sortable sub-components for PanelPreviewModal.
 * Extracted for better maintainability.
 */

import { GripVertical, GripHorizontal, Download } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================================
// CONSTANTS
// ============================================================

export const VISUAL_PREFIX = 'visual-';
export const LIST_PREFIX = 'list-';

// ============================================================
// VISUAL ITEM (Left Column)
// ============================================================

interface SortableVisualItemProps {
    id: string;
    realId: string;
    index: number;
    img: string;
}

export const SortableVisualItem = ({ id, index, img }: SortableVisualItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="w-full bg-[#1e1e1e] p-2 rounded-lg border border-[#333] shadow-lg relative group transition-colors hover:border-zinc-500 cursor-grab active:cursor-grabbing mb-2"
        >
            {/* Header info */}
            <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1">
                    <span>#{index + 1}</span>
                </div>
                <div className="text-zinc-500 text-xs flex items-center gap-1">
                    <GripVertical size={12} />
                </div>
            </div>

            {/* Standard Box Container */}
            <div className="w-full h-32 bg-black/40 rounded border border-zinc-800 flex items-center justify-center overflow-hidden relative">
                <img
                    src={img}
                    alt={`Panel ${index + 1}`}
                    className="max-w-full max-h-full object-contain pointer-events-none select-none shadow-md"
                />
            </div>

            <div className="mt-1.5 flex justify-end items-center px-1">
                <a
                    href={img}
                    download={`panel-${index + 1}.png`}
                    className="text-blue-400 hover:text-blue-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Download size={10} /> Baixar
                </a>
            </div>
        </div>
    );
};

// ============================================================
// LIST ITEM (Right Column)
// ============================================================

interface SortableListItemProps {
    id: string;
    realId: string;
    index: number;
}

export const SortableListItem = ({ id, index }: SortableListItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="w-full h-9 flex items-center justify-between px-3 bg-[#252525] border border-[#333] rounded hover:bg-[#333] hover:border-zinc-600 cursor-grab active:cursor-grabbing group mb-1.5"
        >
            <div className="flex items-center gap-2">
                <GripHorizontal size={14} className="text-zinc-600 group-hover:text-zinc-400" />
                <span className="text-xs font-medium text-zinc-300">Quadro {index + 1}</span>
            </div>
            <div className="bg-emerald-900/50 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-800">
                #{index + 1}
            </div>
        </div>
    );
};

// ============================================================
// DRAG OVERLAYS
// ============================================================

export const VisualDragOverlay = ({ index, img }: { index: number; img: string }) => (
    <div className="w-full bg-[#2a2a2a] p-2 rounded-lg border border-blue-500 shadow-2xl relative scale-105 cursor-grabbing opacity-90">
        <div className="bg-blue-600 w-fit text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md mb-1.5">
            #{index + 1}
        </div>
        <div className="w-full h-32 bg-black/40 rounded border border-zinc-700 flex items-center justify-center overflow-hidden">
            <img src={img} className="max-w-full max-h-full object-contain" />
        </div>
    </div>
);

export const ListDragOverlay = ({ index }: { index: number }) => (
    <div className="w-full h-9 flex items-center justify-between px-3 bg-blue-900/40 border border-blue-500 rounded shadow-xl cursor-grabbing">
        <div className="flex items-center gap-2">
            <GripHorizontal size={14} className="text-blue-300" />
            <span className="text-xs font-bold text-white">Quadro {index + 1}</span>
        </div>
    </div>
);
