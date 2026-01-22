import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit3, Download } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { ExportModal } from './ExportModal';
import { FileEntry } from '../../types';
import { SortableItem } from '../../ui/SortableItem';

interface ComicWorkstationProps {
    comic: { id: string; name: string };
    pages: FileEntry[];
    onClose: () => void;
    onSelectPage: (pageId: string, pageUrl: string) => void;
    onAddPages: (files: File[]) => void;
    onDeletePages: (pageIds: string[]) => void;
    onReorderPages: (pageIds: string[]) => void;
}

export const ComicWorkstation: React.FC<ComicWorkstationProps> = ({
    comic,
    pages,
    onClose,
    onSelectPage,
    onAddPages,
    onDeletePages,
    onReorderPages
}) => {
    // === REMOVED INTERNAL FETCHING ===
    // Data is now passed via props from App.tsx controller


    // === LOCAL STATE ===
    const [orderedPages, setOrderedPages] = useState<FileEntry[]>([]);  // Optimistic UI
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync store -> local state
    // We update orderedPages when the list of IDs changes (files added/removed)
    // or when the component mounts.
    const pagesHash = pages.map(p => p.id).join(',');

    useEffect(() => {
        setOrderedPages(pages);
    }, [pagesHash, pages]); // pages is now stable via useMemo

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setOrderedPages((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const reordered = arrayMove(items, oldIndex, newIndex);

            // Call Action to save
            onReorderPages(reordered.map(p => p.id));
            return reordered;
        });
    };

    // Actions Wrapper
    const handleClose = onClose;

    const handleSelectPage = (pageId: string) => {
        const page = pages.find(p => p.id === pageId);
        if (page) onSelectPage(pageId, page.url);
    };

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

    return (
        <>
            {/* MASTER CONTAINER - Relative & Full Screen for Floating UI */}
            <div className="fixed inset-0 bg-app-bg z-50 overflow-hidden flex flex-col">

                {/* Background Atmosphere */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a20] via-[#09090b] to-[#050505] opacity-80" />

                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                {/* MAIN CONTENT LAYER - Z-10 */}
                <div className="relative z-10 w-full h-full flex flex-col">

                    {/* Header Area (Now Transparent/Floating Container) */}
                    <div className="shrink-0 z-50 px-6 pt-4 pb-2 flex items-start justify-between pointer-events-none">
                        <div className="pointer-events-auto">
                            {/* Header will go here or be injected via slots/children if we refactor further. 
                                For now, we keep the structure but prepare it for the Floating Header component. 
                            */}
                            <div className="flex items-center gap-4">
                                <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">{comic.name}</h1>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-400 font-mono">
                                    {orderedPages.length} PAGES
                                </span>
                            </div>
                        </div>

                        {/* Top Right Actions Area */}
                        <div className="flex items-center gap-2 pointer-events-auto">

                            {/* Edit Button */}
                            <button
                                onClick={handleEditPage}
                                disabled={selectedPageIds.size !== 1}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedPageIds.size === 1
                                    ? 'bg-accent-blue text-white shadow-glow-sm border-accent-blue hover:bg-blue-600'
                                    : 'bg-black/20 text-zinc-600 border-white/5 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <Edit3 size={14} />
                                <span className="hidden sm:inline">Editar</span>
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={handleBulkDelete}
                                disabled={selectedPageIds.size === 0}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedPageIds.size > 0
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 shadow-glow-sm'
                                    : 'bg-black/20 text-zinc-600 border-white/5 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">Excluir {selectedPageIds.size > 0 ? `(${selectedPageIds.size})` : ''}</span>
                            </button>

                            <div className="w-px h-6 bg-white/10 mx-1" />

                            {/* Export Button */}
                            <button
                                onClick={() => setIsExportModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold text-zinc-300 border border-white/5 hover:bg-white/5 hover:text-white transition-all hover:shadow-glow-sm hover:border-white/10"
                            >
                                <Download size={14} />
                                <span className="hidden sm:inline">Exportar</span>
                            </button>

                            <button
                                onClick={handleClose}
                                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all ml-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Pages Grid Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={orderedPages.map(p => p.id)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 pb-32">
                                    {orderedPages.map((page) => {
                                        const isSelected = selectedPageIds.has(page.id);

                                        return (
                                            <SortableItem key={page.id} id={page.id}>
                                                <PageCard
                                                    page={page}
                                                    isSelected={isSelected}
                                                    onClick={(e) => handlePageClick(page.id, e)}
                                                    onEdit={() => handleSelectPage(page.id)}
                                                />
                                            </SortableItem>
                                        );
                                    })}

                                    {/* Add Page Button - Glass Style */}
                                    <div className="aspect-[3/4] rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent-blue/50 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer relative group">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleAddPages}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                        />
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-glass-inset">
                                            <Plus size={24} className="text-white/40 group-hover:text-accent-blue transition-colors" />
                                        </div>
                                        <span className="text-xs font-medium text-white/30 group-hover:text-accent-blue/80 transition-colors">Adicionar Página</span>
                                    </div>
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>

                    {/* Floating Toolbar Area (Bottom) - Placeholder for Filmstrip if we move it here */}
                </div>

                {/* Global Overlays */}
                {/* <EditorHeader ... /> would typically be rendered here if it was global, but currently it is inside routes/workstation. 
                    This specific file is the 'ComicWorkstation' which acts as the dashboard for the comic. 
                    The actual Editor (for a single page) is a different view. 
                    So my audit might have confused 'ComicWorkstation' (the grid view) with 'EditorView' (the canvas).
                    I need to verify this assumption.
                */}
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

// Memoized Page Card for performance
const PageCard = React.memo<{
    page: FileEntry;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
    onEdit: () => void;
}>(({ page, isSelected, onClick, onEdit }) => {
    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer relative aspect-[3/4] rounded-xl border overflow-hidden transition-all bg-[#121214] ${isSelected
                ? 'border-accent-blue ring-2 ring-accent-blue/50 scale-[1.02] z-10'
                : 'border-border-color hover:border-accent-blue/50 hover:shadow-lg'
                }`}
        >
            {/* Image */}
            <img
                src={page.url}
                alt={page.name}
                className="w-full h-full object-cover select-none"
                loading="lazy"
                draggable={false}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-accent-blue rounded-full flex items-center justify-center shadow-lg">
                    <Check size={14} className="text-white" strokeWidth={3} />
                </div>
            )}

            {/* Page Number Badge (Optional but helpful for ordering) */}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-white/80 font-mono">
                {page.name}
            </div>

            {/* Footer - Shows on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 transition-all translate-y-full group-hover:translate-y-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate flex-1">
                        {page.name}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="px-3 py-1 bg-accent-blue hover:bg-blue-600 rounded text-xs font-bold text-white transition-colors shadow-sm"
                    >
                        Editar
                    </button>
                </div>
            </div>
        </div>
    );
});

PageCard.displayName = 'PageCard';

export default ComicWorkstation;
