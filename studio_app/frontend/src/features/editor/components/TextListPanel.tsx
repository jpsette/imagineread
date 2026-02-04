import React, { useState, useEffect, useMemo } from 'react';
import { X, GripVertical } from 'lucide-react';
import { useEditorStore } from '@features/editor/store';
import { useEditorUIStore } from '@features/editor/uiStore';
import { DebouncedTextarea } from './ui/DebouncedTextarea';
import { FloatingPanel } from '@shared/components/FloatingPanel';

// DnD Kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Balloon } from '@shared/types';

// Sortable Item Component
interface SortableTextItemProps {
    balloon: Balloon;
    index: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
}

const SortableTextItem: React.FC<SortableTextItemProps> = ({ balloon, index, isSelected, onSelect, onUpdate }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: balloon.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group rounded-xl p-2 -mx-2 transition-all ${isDragging ? 'shadow-lg' : ''} ${isSelected ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : 'hover:bg-white/5'}`}
        >
            {/* Label with Index and Drag Handle */}
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    {/* Drag Handle */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-colors"
                        title="Arrastar para reordenar"
                    >
                        <GripVertical size={12} />
                    </button>
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-cyan-400' : 'text-zinc-400'}`}>
                        Texto {index + 1}
                    </span>
                </div>
                <button
                    onClick={() => onSelect(balloon.id)}
                    className={`text-[9px] font-medium transition-opacity ${isSelected ? 'text-cyan-400 opacity-100' : 'text-cyan-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100'}`}
                >
                    {isSelected ? '● Selecionado' : 'Selecionar'}
                </button>
            </div>

            {/* Editable Text Box */}
            <DebouncedTextarea
                value={balloon.text || ''}
                onChange={(text) => onUpdate(balloon.id, text)}
                onFocus={() => onSelect(balloon.id)}
                placeholder="Texto vazio..."
                className={`w-full rounded-xl p-2.5 text-[11px] text-white outline-none min-h-[60px] resize-none placeholder:text-zinc-600 leading-relaxed transition-colors
                    ${isSelected
                        ? 'bg-zinc-900 border border-cyan-500/40 focus:border-cyan-500/60'
                        : 'bg-white/5 border border-white/5 focus:border-neon-blue/50 hover:bg-white/10'
                    }`}
            />
        </div>
    );
};

export const TextListPanel: React.FC = () => {
    const { showTextListPanel, setShowTextListPanel, setSelectedId, selectedId } = useEditorUIStore();
    const { balloons, updateBalloonUndoable } = useEditorStore();

    // Filter and sort balloons by Y position (top to bottom)
    // box_2d format is [ymin, xmin, ymax, xmax], so box_2d[0] is the top Y position
    const sortedBalloons = useMemo(() => {
        return balloons
            .filter(b => b.type !== 'mask')
            .sort((a, b) => {
                const aY = a.box_2d?.[0] ?? 0;
                const bY = b.box_2d?.[0] ?? 0;
                return aY - bY;
            });
    }, [balloons]);

    // Local order state for drag & drop (stores balloon IDs in custom order)
    const [orderedIds, setOrderedIds] = useState<string[]>([]);

    // Initialize order when balloons change
    useEffect(() => {
        const newIds = sortedBalloons.map(b => b.id);
        // Only reset if balloons were added/removed, not if just reordered
        const currentSet = new Set(orderedIds);
        const newSet = new Set(newIds);

        if (orderedIds.length === 0 ||
            newIds.length !== orderedIds.length ||
            newIds.some(id => !currentSet.has(id)) ||
            orderedIds.some(id => !newSet.has(id))) {
            setOrderedIds(newIds);
        }
    }, [sortedBalloons]);

    // Get ordered balloons based on orderedIds
    const orderedBalloons = useMemo(() => {
        const balloonMap = new Map(sortedBalloons.map(b => [b.id, b]));
        return orderedIds
            .map(id => balloonMap.get(id))
            .filter((b): b is Balloon => b !== undefined);
    }, [orderedIds, sortedBalloons]);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require 5px movement to start drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setOrderedIds((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    if (!showTextListPanel) return null;

    // Calculate position to appear to the left of the right sidebar (Ferramentas)
    const rightSidebarWidth = 316;
    const panelWidth = 320;
    const defaultX = typeof window !== 'undefined'
        ? window.innerWidth - rightSidebarWidth - panelWidth - 16
        : 600;

    return (
        <FloatingPanel
            defaultPosition={{ x: defaultX, y: 96 }}
            defaultSize={{ width: panelWidth, height: 600 }}
            minWidth={280}
            maxWidth={400}
            minHeight={300}
        >
            <div className="w-full h-full bg-panel-bg rounded-2xl border border-border-color shadow-xl overflow-hidden pointer-events-auto flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 pt-10 border-b border-white/5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        Todos os Textos
                    </label>
                    <button
                        onClick={() => setShowTextListPanel(false)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-all z-10"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {orderedBalloons.length === 0 ? (
                        <p className="text-xs text-zinc-500 text-center py-8">
                            Nenhum texto encontrado.<br />
                            Adicione balões ou textos para vê-los aqui.
                        </p>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={orderedIds}
                                strategy={verticalListSortingStrategy}
                            >
                                {orderedBalloons.map((balloon, index) => (
                                    <SortableTextItem
                                        key={balloon.id}
                                        balloon={balloon}
                                        index={index}
                                        isSelected={selectedId === balloon.id}
                                        onSelect={setSelectedId}
                                        onUpdate={(id, text) => updateBalloonUndoable(id, { text })}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>

                {/* Footer with count and hint */}
                <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-600">
                        Arraste para reordenar
                    </span>
                    <span className="text-[10px] text-zinc-500">
                        {orderedBalloons.length} {orderedBalloons.length === 1 ? 'texto' : 'textos'}
                    </span>
                </div>
            </div>
        </FloatingPanel>
    );
};
