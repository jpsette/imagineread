import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit3, Download } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useParams, useNavigate } from 'react-router-dom';

import { ExportModal } from './ExportModal';
import { FileEntry } from '../../types';
import { SortableItem } from '../../ui/SortableItem';
import { useFileActions } from '../../hooks/useFileActions';
import { useFileSystemStore } from '../../store/useFileSystemStore';
import { useProjectStore } from '../../store/useProjectStore';

export const ComicWorkstation: React.FC = () => {
    const { comicId } = useParams<{ comicId: string }>();
    const navigate = useNavigate();

    // === GLOBAL STORE ===
    const { fileSystem, setOpenedPageId } = useFileSystemStore();
    const { deletePages, uploadPages, reorderItems } = useFileActions();
    // Use project store to navigate back correctly
    const { currentProjectId } = useProjectStore();

    // Derived Data
    const comic = fileSystem.find(f => f.id === comicId);
    const pages = React.useMemo(() => fileSystem
        .filter(f => f.parentId === comicId && f.type === 'file')
        .sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
            // Fallback to name sort
            return a.name.localeCompare(b.name, undefined, { numeric: true });
        }), [fileSystem, comicId]);

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
            if (reorderItems) {
                reorderItems(reordered.map(p => p.id));
            }
            return reordered;
        });
    };

    // Actions Wrapper
    const handleClose = () => {
        if (currentProjectId) {
            navigate(`/project/${currentProjectId}`);
        } else {
            navigate('/');
        }
    };

    const handleSelectPage = (pageId: string) => {
        setOpenedPageId(pageId); // Triggers overlay in EditorPage or Nav to /editor/:id/page/:pid
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
            deletePages(Array.from(selectedPageIds));
            setSelectedPageIds(new Set());
            setLastSelectedId(null);
        }
    }, [selectedPageIds, deletePages]);

    // Edit single page (Trigger overlay)
    const handleEditPage = useCallback(() => {
        if (selectedPageIds.size !== 1) return;
        const pageId = Array.from(selectedPageIds)[0];
        handleSelectPage(pageId);
    }, [selectedPageIds]);

    // Add pages handler
    const handleAddPages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !comicId) return;
        uploadPages(Array.from(files), comicId);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [uploadPages, comicId]);

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
            <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col">
                {/* Header */}
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0c0c0e]">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-white">{comic.name}</h1>
                        <span className="text-sm text-white/40">{orderedPages.length} páginas</span>
                        {selectedPageIds.size > 0 && (
                            <span className="text-sm text-accent-blue font-medium">
                                {selectedPageIds.size} selecionada(s)
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Export Button */}
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all text-white/80 hover:text-white border border-white/5 hover:border-white/10"
                        >
                            <Download size={14} />
                            Exportar
                        </button>

                        {/* Edit Button - Enabled when 1 page selected */}
                        <button
                            onClick={handleEditPage}
                            disabled={selectedPageIds.size !== 1}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPageIds.size === 1
                                ? 'bg-accent-blue text-white hover:bg-blue-600'
                                : 'bg-white/5 text-text-secondary opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <Edit3 size={12} />
                            Editar Página
                        </button>

                        {/* Bulk Delete Button */}
                        <button
                            onClick={handleBulkDelete}
                            disabled={selectedPageIds.size === 0}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPageIds.size > 0
                                ? 'bg-red-900/50 text-red-100 hover:bg-red-800'
                                : 'bg-white/5 text-text-secondary opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <Trash2 size={12} />
                            Excluir {selectedPageIds.size > 0 ? `(${selectedPageIds.size})` : ''}
                        </button>

                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Pages Grid with DnD */}
                <div className="flex-1 overflow-y-auto p-8">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedPages.map(p => p.id)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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

                                {/* Add Page Button */}
                                <div className="aspect-[3/4] rounded-xl border border-dashed border-border-color bg-app-bg/50 flex flex-col items-center justify-center gap-3 hover:border-accent-blue hover:bg-accent-blue/5 transition-all cursor-pointer relative">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleAddPages}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="p-4 rounded-full bg-white/5 pointer-events-none">
                                        <Plus size={32} className="text-white/40" />
                                    </div>
                                    <span className="text-sm text-white/40 pointer-events-none">Adicionar Página</span>
                                </div>
                            </div>
                        </SortableContext>
                    </DndContext>
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
