import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit3, Download } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent, defaultDropAnimationSideEffects, DropAnimation } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Grid, CellComponentProps } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

import { ExportModal } from './ExportModal';
import { FileEntry } from '../../types';

interface ComicWorkstationProps {
    comic: { id: string; name: string };
    pages: FileEntry[];
    onClose: () => void;
    onSelectPage: (pageId: string, pageUrl: string) => void;
    onAddPages: (files: File[]) => void;
    onDeletePages: (pageIds: string[]) => void;
    onReorderPages: (pageIds: string[]) => void;
}

// === SORTABLE ITEM WRAPPER ===
// We perform the DnD logic here
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
        width: '100%'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

export const ComicWorkstation: React.FC<ComicWorkstationProps> = ({
    comic,
    pages,
    onClose,
    onSelectPage,
    onAddPages,
    onDeletePages,
    onReorderPages
}) => {
    const [orderedPages, setOrderedPages] = useState<FileEntry[]>([]);  // Optimistic UI
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null); // For DragOverlay

    const fileInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<any>(null);

    // Sync store -> local state
    // We update orderedPages when the list of IDs changes (files added/removed)
    // or when the component mounts.
    const pagesHash = pages.map(p => p.id).join(',');

    useEffect(() => {
        setOrderedPages(pages);
    }, [pagesHash, pages]);

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        setOrderedPages((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            // Handle edge case: dropping on "Add Button" (id = 'ADD_BUTTON')
            // If dropping on add button, maybe move to end? For now prevent drop.
            if (active.id === 'ADD_BUTTON' || over.id === 'ADD_BUTTON') return items;

            const reordered = arrayMove(items, oldIndex, newIndex);

            // Call Action to save
            onReorderPages(reordered.map(p => p.id));
            return reordered;
        });
    };

    // Actions Wrapper
    const handleClose = onClose;

    const handleSelectPage = useCallback((pageId: string) => {
        const page = pages.find(p => p.id === pageId);
        if (page) onSelectPage(pageId, page.url);
    }, [pages, onSelectPage]);

    // Multi-selection handler
    const handlePageClick = useCallback((pageId: string, e: React.MouseEvent) => {
        const newSet = new Set(selectedPageIds);
        if (e.shiftKey && lastSelectedId) {
            const lastIndex = orderedPages.findIndex(p => p.id === lastSelectedId);
            const currIndex = orderedPages.findIndex(p => p.id === pageId);
            if (lastIndex !== -1 && currIndex !== -1) {
                const start = Math.min(lastIndex, currIndex);
                const end = Math.max(lastIndex, currIndex);
                for (let i = start; i <= end; i++) {
                    newSet.add(orderedPages[i].id);
                }
            }
        } else if (e.metaKey || e.ctrlKey) {
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
                setLastSelectedId(null);
            } else {
                newSet.add(pageId);
                setLastSelectedId(pageId);
            }
        } else {
            newSet.clear();
            newSet.add(pageId);
            setLastSelectedId(pageId);
        }
        setSelectedPageIds(newSet);
    }, [selectedPageIds, lastSelectedId, orderedPages]);

    // Bulk delete handler
    const handleBulkDelete = useCallback(() => {
        if (selectedPageIds.size === 0) return;
        if (confirm(`Excluir ${selectedPageIds.size} página(s)?`)) {
            onDeletePages(Array.from(selectedPageIds));
            setSelectedPageIds(new Set());
            setLastSelectedId(null);
        }
    }, [selectedPageIds, onDeletePages]);

    // Edit single page (Trigger overlay)
    const handleEditPage = useCallback(() => {
        if (selectedPageIds.size !== 1) return;
        const pageId = Array.from(selectedPageIds)[0];
        handleSelectPage(pageId);
    }, [selectedPageIds]);

    // Add pages handler
    const handleAddPages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        onAddPages(Array.from(files));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onAddPages]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedPageIds.size > 0) {
                handleBulkDelete();
            }
            if (e.key === 'Enter' && selectedPageIds.size === 1) {
                handleEditPage();
            }
            if (e.key === 'Escape') {
                setSelectedPageIds(new Set());
                setLastSelectedId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPageIds, handleBulkDelete, handleEditPage]);


    if (!comic) {
        return <div className="text-white p-10">Loading Comic...</div>;
    }

    // --- GRID CALCULATIONS ---
    const MIN_COLUMN_WIDTH = 220;
    const GAP = 24; // gap-6
    const ASPECT_RATIO = 3 / 4;

    // We add a virtual item for the "Add Button"
    const totalItems = orderedPages.length + 1;

    // --- CELL RENDERER ---
    const Cell = ({ columnIndex, rowIndex, style, ...props }: CellComponentProps<any>) => {
        const { columnCount, pageItems, selectedIds, onSelect, onEdit, onAdd } = props as any;
        const index = rowIndex * columnCount + columnIndex;

        // Boundary Check (Empty cells in last row)
        if (index >= totalItems) return <div />;

        // Is this the "Add Button"? (Last item)
        if (index === totalItems - 1) {
            return (
                <div style={{
                    ...style,
                    left: Number(style.left) + GAP / 2,
                    top: Number(style.top) + GAP / 2,
                    width: Number(style.width) - GAP,
                    height: Number(style.height) - GAP
                }}>
                    <div className="w-full h-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent-blue/50 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative group">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onAdd}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                        />
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glass-inset">
                            <Plus size={24} className="text-white/40 group-hover:text-accent-blue transition-colors" />
                        </div>
                        <span className="text-xs font-medium text-white/30 group-hover:text-accent-blue/80 transition-colors">Adicionar Página</span>
                    </div>
                </div>
            );
        }

        const page = pageItems[index];
        const isSelected = selectedIds.has(page.id);

        return (
            <div style={{
                ...style,
                left: Number(style.left) + GAP / 2,
                top: Number(style.top) + GAP / 2,
                width: Number(style.width) - GAP,
                height: Number(style.height) - GAP
            }}>
                <VirtualSortableItem id={page.id}>
                    <PageCard
                        page={page}
                        isSelected={isSelected}
                        onClick={(e) => onSelect(page.id, e)}
                        onEdit={() => onEdit(page.id)}
                    />
                </VirtualSortableItem>
            </div>
        );
    };

    // Drop Animation config for better feel
    const dropAnimationConfig: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <>
            {/* MASTER CONTAINER */}
            <div className="fixed inset-0 bg-app-bg z-50 overflow-hidden flex flex-col">

                {/* Background Atmosphere */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a20] via-[#09090b] to-[#050505] opacity-80" />
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                {/* MAIN CONTENT LAYER - Z-10 */}
                <div className="relative z-10 w-full h-full flex flex-col">

                    {/* HEADER (Toolbar) */}
                    <div className="shrink-0 z-50 px-6 pt-4 pb-2 flex items-start justify-between pointer-events-none">
                        <div className="pointer-events-auto">
                            <div className="flex items-center gap-4">
                                <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">{comic.name}</h1>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-400 font-mono">
                                    {orderedPages.length} PAGES
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <button onClick={handleEditPage} disabled={selectedPageIds.size !== 1} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedPageIds.size === 1 ? 'bg-accent-blue text-white shadow-glow-sm border-accent-blue hover:bg-blue-600' : 'bg-black/20 text-zinc-600 border-white/5 opacity-50 cursor-not-allowed'}`}>
                                <Edit3 size={14} /> <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button onClick={handleBulkDelete} disabled={selectedPageIds.size === 0} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedPageIds.size > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 shadow-glow-sm' : 'bg-black/20 text-zinc-600 border-white/5 opacity-50 cursor-not-allowed'}`}>
                                <Trash2 size={14} /> <span className="hidden sm:inline">Excluir {selectedPageIds.size > 0 ? `(${selectedPageIds.size})` : ''}</span>
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                            <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold text-zinc-300 border border-white/5 hover:bg-white/5 hover:text-white transition-all hover:shadow-glow-sm">
                                <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
                            </button>
                            <button onClick={handleClose} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all ml-1">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* VIRTUALIZED GRID AREA */}
                    <div className="flex-1 p-8 overflow-hidden">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={orderedPages.map(p => p.id)} strategy={rectSortingStrategy}>
                                <AutoSizer
                                    renderProp={({ height, width }: { height: number | undefined; width: number | undefined }) => {
                                        const safeHeight = height ?? 0;
                                        const safeWidth = width ?? 0;
                                        // Calculate responsive columns
                                        // Calculate responsive columns
                                        // Formula: n * (w + gap) - gap <= width
                                        // Approx: width / (220 + 24)
                                        const columnCount = Math.floor((safeWidth + GAP) / (MIN_COLUMN_WIDTH + GAP)) || 1;
                                        // Recalculate exact item width to fill space (optional, or stick to Fixed)
                                        // Let's FILL the space for better aesthetic
                                        const currentWidth = safeWidth - GAP; // padding adjustment if needed
                                        const itemWidth = (currentWidth - (columnCount - 1) * GAP) / columnCount;
                                        const rowHeight = (itemWidth / ASPECT_RATIO) + GAP;
                                        const rowCount = Math.ceil(totalItems / columnCount);

                                        return (
                                            <Grid
                                                // @ts-ignore
                                                ref={gridRef}
                                                columnCount={columnCount}
                                                columnWidth={itemWidth + GAP}
                                                rowCount={rowCount}
                                                rowHeight={rowHeight}
                                                style={{ width: safeWidth, height: safeHeight }}
                                                cellProps={{
                                                    columnCount,
                                                    pageItems: orderedPages,
                                                    selectedIds: selectedPageIds,
                                                    onSelect: handlePageClick,
                                                    onEdit: (id: string) => handleSelectPage(id),
                                                    onAdd: handleAddPages
                                                }}
                                                cellComponent={Cell}
                                                className="custom-scrollbar"
                                            />
                                        );
                                    }}
                                />
                            </SortableContext>

                            {/* DRAG OVERLAY PORTAL */}
                            <DragOverlay dropAnimation={dropAnimationConfig}>
                                {activeId && activeId !== 'ADD_BUTTON' ? (
                                    <div className="w-[220px] aspect-[3/4]">
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
                </div>
            </div>

            {comic && (
                <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    projectId={comic.id}
                    projectName={comic.name}
                />
            )}
        </>
    );
};

// Memoized Page Card (Unchanged visual logic, just re-declared for scope)
const PageCard = React.memo<{
    page: FileEntry;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onEdit: () => void;
}>(({ page, isSelected, onClick, onEdit }) => {
    // Skeleton / Placeholder logic can be enhanced here
    // Currently using img loading="lazy"
    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer relative w-full h-full rounded-xl border overflow-hidden transition-all bg-[#121214] ${isSelected
                ? 'border-accent-blue ring-2 ring-accent-blue/50 scale-[1.02] z-10'
                : 'border-border-color hover:border-accent-blue/50 hover:shadow-lg'
                }`}
        >
            <img
                src={page.url}
                alt={page.name}
                className="w-full h-full object-cover select-none"
                loading="lazy"
                draggable={false}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center shadow-lg">
                    <Check size={14} className="text-white" strokeWidth={3} />
                </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-white/80 font-mono">
                {page.name}
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 transition-all translate-y-full group-hover:translate-y-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate flex-1">{page.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="px-3 py-1 bg-accent-blue hover:bg-blue-600 rounded text-xs font-bold text-white transition-colors shadow-sm">Editar</button>
                </div>
            </div>
        </div>
    );
});

PageCard.displayName = 'PageCard';

export default ComicWorkstation;
