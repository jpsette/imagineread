/**
 * PanelPreviewModal
 * 
 * Modal for managing and reordering panels with drag-and-drop.
 * Sub-components extracted to PanelPreviewItems.tsx.
 */

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Stores
import { useEditorStore } from '@features/editor/store';
import { useEditorUIStore } from '@features/editor/uiStore';

// Extracted Components
import {
    VISUAL_PREFIX,
    LIST_PREFIX,
    SortableVisualItem,
    SortableListItem,
    VisualDragOverlay,
    ListDragOverlay
} from './PanelPreviewItems';

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

        const activeRaw = (active.id as string).replace(VISUAL_PREFIX, '').replace(LIST_PREFIX, '');
        const overRaw = (over.id as string).replace(VISUAL_PREFIX, '').replace(LIST_PREFIX, '');

        if (activeRaw !== overRaw) {
            const oldIndex = panels.findIndex((p) => p.id === activeRaw);
            const newIndex = panels.findIndex((p) => p.id === overRaw);

            const newPanels = arrayMove(panels, oldIndex, newIndex);
            const reorderedPanels = newPanels.map((p, idx) => ({ ...p, order: idx + 1 }));
            setPanels(reorderedPanels);

            const newImages = arrayMove(images, oldIndex, newIndex);
            setPreviewImages(newImages);
        }
    };

    // Determine overlay state
    const isDraggingVisual = activeId?.startsWith(VISUAL_PREFIX);
    const activeRawId = activeId ? activeId.replace(VISUAL_PREFIX, '').replace(LIST_PREFIX, '') : null;
    const activeIndex = panels.findIndex(p => p.id === activeRawId);
    const activeImage = activeIndex !== -1 ? images[activeIndex] : null;

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            size="4xl"
            className="h-[75vh] bg-[#1e1e1e] border-[#333]"
            header={
                <div className="flex items-center justify-between p-3 border-b border-[#333] shrink-0">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        Gerenciar Quadros <span className="text-zinc-500 text-xs font-normal">({images.length})</span>
                    </h2>

                    <div className="flex items-center gap-3">
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
                    {/* LEFT COL: VISUALS */}
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

                    {/* RIGHT COL: LIST */}
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
