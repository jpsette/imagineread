import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent, defaultDropAnimationSideEffects, DropAnimation } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { FileEntry } from '../../../../types';
import { PageCard } from './PageCard';

// === TYPES ===
interface WorkstationGridProps {
    orderedPages: FileEntry[];
    selectedPageIds: Set<string>;
    onReorderPages: (pageIds: string[]) => void;
    onSelectPageClick: (pageId: string, e: React.MouseEvent) => void;
    onEditPage: (pageId: string) => void;
    onAddPages: (files: File[]) => void;
    setOrderedPages: React.Dispatch<React.SetStateAction<FileEntry[]>>;
}


// === SORTABLE WRAPPER ===
const VirtualSortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        height: '100%',
        width: '100%',
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};


// === MAIN COMPONENT ===
export const GridCanvas: React.FC<WorkstationGridProps> = ({
    orderedPages,
    selectedPageIds,
    onReorderPages,
    onSelectPageClick,
    onEditPage,
    onAddPages,
    setOrderedPages
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        // Optimistic Update
        const oldIndex = orderedPages.findIndex((item) => item.id === active.id);
        const newIndex = orderedPages.findIndex((item) => item.id === over.id);

        if (active.id === 'ADD_BUTTON' || over.id === 'ADD_BUTTON') return;

        const reordered = arrayMove(orderedPages, oldIndex, newIndex);
        setOrderedPages(reordered);
        onReorderPages(reordered.map(p => p.id));
    };

    const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        onAddPages(Array.from(files));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const dropAnimationConfig: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: { opacity: '0.5' },
            },
        }),
    };


    return (
        <div className="flex-1 min-h-0 w-full h-full overflow-y-auto overflow-x-hidden relative bg-[#09090b]" style={{ scrollbarGutter: 'stable' }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="p-6 max-w-[1920px] mx-auto">
                    <SortableContext items={orderedPages.map(p => p.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 pb-20">
                            {orderedPages.map((page) => {
                                const isSelected = selectedPageIds.has(page.id);
                                return (
                                    <VirtualSortableItem key={page.id} id={page.id}>
                                        <div className="aspect-[3/4]">
                                            <PageCard
                                                page={page}
                                                isSelected={isSelected}
                                                onClick={(e) => onSelectPageClick(page.id, e)}
                                                onEdit={() => onEditPage(page.id)}
                                            />
                                        </div>
                                    </VirtualSortableItem>
                                );
                            })}

                            <div className="aspect-[3/4]">
                                <div className="w-full h-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent-blue/50 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative group">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFilesAdded}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    />
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glass-inset">
                                        <Plus size={24} className="text-white/40 group-hover:text-accent-blue transition-colors" />
                                    </div>
                                    <span className="text-xs font-medium text-white/30 group-hover:text-accent-blue/80 transition-colors">Adicionar Página</span>
                                </div>
                            </div>
                        </div>
                    </SortableContext>
                </div>

                <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeId && activeId !== 'ADD_BUTTON' ? (
                        <div className="w-[220px] aspect-[3/4] rotate-3 scale-105 shadow-2xl cursor-grabbing ring-2 ring-accent-blue/50 rounded-xl">
                            <PageCard
                                page={orderedPages.find(p => p.id === activeId)!}
                                isSelected={true}
                                onClick={() => { }}
                                onEdit={() => { }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
