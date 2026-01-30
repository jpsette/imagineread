import React, { useState } from 'react';
import { X, Download, GripVertical, GripHorizontal, Eye, EyeOff } from 'lucide-react';
import { BaseModal } from '@shared/ui/Modal';

// DND Kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Stores
import { useEditorStore } from '@features/editor/store';
import { useEditorUIStore } from '@features/editor/uiStore';

// === HELPERS ===
const VISUAL_PREFIX = 'visual-';
const LIST_PREFIX = 'list-';

// === LEFT COLUMN: VISUAL ITEM ===
interface SortableVisualItemProps {
    id: string; // "visual-{panelId}"
    realId: string; // "{panelId}"
    index: number;
    img: string;
}

const SortableVisualItem = ({ id, index, img }: SortableVisualItemProps) => {
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
                {/* Prevent Drag on Download Link */}
                <a
                    href={img}
                    download={`panel-${index + 1}.png`}
                    className="text-blue-400 hover:text-blue-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    onPointerDown={(e) => e.stopPropagation()} // Stop drag start
                    onClick={(e) => e.stopPropagation()}
                >
                    <Download size={10} /> Baixar
                </a>
            </div>
        </div>
    );
};

// === RIGHT COLUMN: LIST ITEM ===
interface SortableListItemProps {
    id: string; // "list-{panelId}"
    realId: string;
    index: number;
}

const SortableListItem = ({ id, index }: SortableListItemProps) => {
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
}


// === OVERLAY COMPONENTS ===
const VisualDragOverlay = ({ index, img }: { index: number, img: string }) => (
    <div className="w-full bg-[#2a2a2a] p-2 rounded-lg border border-blue-500 shadow-2xl relative scale-105 cursor-grabbing opacity-90">
        <div className="bg-blue-600 w-fit text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md mb-1.5">
            #{index + 1}
        </div>
        <div className="w-full h-32 bg-black/40 rounded border border-zinc-700 flex items-center justify-center overflow-hidden">
            <img src={img} className="max-w-full max-h-full object-contain" />
        </div>
    </div>
);

const ListDragOverlay = ({ index }: { index: number }) => (
    <div className="w-full h-9 flex items-center justify-between px-3 bg-blue-900/40 border border-blue-500 rounded shadow-xl cursor-grabbing">
        <div className="flex items-center gap-2">
            <GripHorizontal size={14} className="text-blue-300" />
            <span className="text-xs font-bold text-white">Quadro {index + 1}</span>
        </div>
    </div>
);


interface PanelPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    onToggleElements?: (show: boolean) => void;
}

export const PanelPreviewModal: React.FC<PanelPreviewModalProps> = ({
    isOpen,
    onClose,
    images,
    onToggleElements
}) => {
    // --- CONNECT TO STORES ---
    const { panels, setPanels } = useEditorStore();
    const { setPreviewImages, showBalloons } = useEditorUIStore();
    const [activeId, setActiveId] = useState<string | null>(null);

    // --- SENSORS ---
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Create namespaced IDs
    const visualItems = panels.map(p => `${VISUAL_PREFIX}${p.id}`);
    const listItems = panels.map(p => `${LIST_PREFIX}${p.id}`);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        // Strip prefixes to compare real IDs
        const activeRaw = (active.id as string).replace(VISUAL_PREFIX, '').replace(LIST_PREFIX, '');
        const overRaw = (over.id as string).replace(VISUAL_PREFIX, '').replace(LIST_PREFIX, '');

        if (activeRaw !== overRaw) {
            const oldIndex = panels.findIndex((p) => p.id === activeRaw);
            const newIndex = panels.findIndex((p) => p.id === overRaw);

            // 1. Store Update
            const newPanels = arrayMove(panels, oldIndex, newIndex);
            const reorderedPanels = newPanels.map((p, idx) => ({ ...p, order: idx + 1 }));
            setPanels(reorderedPanels);

            // 2. UI Update
            const newImages = arrayMove(images, oldIndex, newIndex);
            setPreviewImages(newImages);
        }
    };

    // Determine what we are dragging to show correct overlay
    const isDraggingVisual = activeId?.startsWith(VISUAL_PREFIX);
    const activeRawId = activeId ? activeId.replace(VISUAL_PREFIX, '').replace(LIST_PREFIX, '') : null;
    const activeIndex = panels.findIndex(p => p.id === activeRawId);
    const activeImage = activeIndex !== -1 ? images[activeIndex] : null;

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            size="4xl" // Reduced from 6xl
            className="h-[75vh] bg-[#1e1e1e] border-[#333]" // Reduced height
            header={
                <div className="flex items-center justify-between p-3 border-b border-[#333] shrink-0">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        Gerenciar Quadros <span className="text-zinc-500 text-xs font-normal">({images.length})</span>
                    </h2>

                    <div className="flex items-center gap-3">
                        {/* ELEMENTS TOGGLE */}
                        {onToggleElements && (
                            <button
                                onClick={() => onToggleElements(!showBalloons)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors border ${showBalloons
                                    ? 'bg-blue-600/20 text-blue-400 border-blue-600/50'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300'
                                    }`}
                                title={showBalloons ? "Ocultar Elementos" : "Exibir Elementos"}
                            >
                                {showBalloons ? <Eye size={12} /> : <EyeOff size={12} />}
                                <span>{showBalloons ? 'Exibir Elementos' : 'Exibir Elementos'}</span>
                            </button>
                        )}

                        <div className="h-4 w-px bg-zinc-700 mx-1"></div>

                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded hover:bg-zinc-800">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            }
            footer={
                <div className="flex justify-between w-full items-center">
                    <span className="text-zinc-500 text-[10px] italic ml-2">Arraste para reordenar.</span>
                    <button onClick={onClose} className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-xs font-medium transition-colors">
                        Pronto
                    </button>
                </div>
            }
            noPadding={true}
        >
            <div className="h-full bg-[#121212] overflow-hidden flex">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {/* LEFT COL: VISUALS (Scrollable) */}
                    <div className="w-2/3 h-full overflow-y-auto p-4 border-r border-[#333]">
                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Visualização</h3>

                        <SortableContext items={visualItems} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-2 pb-20">
                                {panels.map((panel, idx) => {
                                    const img = images[idx];
                                    if (!img) return null;
                                    return (
                                        <SortableVisualItem
                                            key={`${VISUAL_PREFIX}${panel.id}`}
                                            id={`${VISUAL_PREFIX}${panel.id}`}
                                            realId={panel.id}
                                            index={idx}
                                            img={img}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </div>

                    {/* RIGHT COL: LIST (Scrollable) */}
                    <div className="w-1/3 h-full overflow-y-auto p-3 bg-[#181818]">
                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">Lista de Ordem</h3>

                        <SortableContext items={listItems} strategy={verticalListSortingStrategy}>
                            <div className="flex flex-col gap-1 pb-20">
                                {panels.map((panel, idx) => (
                                    <SortableListItem
                                        key={`${LIST_PREFIX}${panel.id}`}
                                        id={`${LIST_PREFIX}${panel.id}`}
                                        realId={panel.id}
                                        index={idx}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </div>

                    {/* OVERLAYS */}
                    <DragOverlay>
                        {activeId && activeIndex !== -1 ? (
                            isDraggingVisual && activeImage ? (
                                <VisualDragOverlay index={activeIndex} img={activeImage} />
                            ) : (
                                <ListDragOverlay index={activeIndex} />
                            )
                        ) : null}
                    </DragOverlay>

                </DndContext>
            </div>
        </BaseModal>
    );
};
