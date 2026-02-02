import React, { useState, useCallback, useEffect } from 'react';
import { X, Trash2, Edit3, Download } from 'lucide-react';
import { Button } from '@shared/ui/Button';

import { ExportModal } from './ExportModal';
import { FileEntry } from '@shared/types';
import { GridCanvas } from './components/workstation/GridCanvas';

// Note: Ensure PageCard is not duplicated if exported from Grid
// If PageCard is used in DragOverlay inside Grid, we don't need it here unless we have a specific overlay here. 
// The Grid handles its own DragOverlay.

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
    const [orderedPages, setOrderedPages] = useState<FileEntry[]>([]);  // Optimistic UI
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Sync store -> local state
    // We update orderedPages when the list of IDs changes (files added/removed)
    // or when the component mounts.
    const pagesHash = pages.map(p => p.id).join(',');

    useEffect(() => {
        setOrderedPages(pages);
    }, [pagesHash, pages]);

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

    // Add pages handler (Passed down to Grid)
    // Note: The Grid handles the input ref clearing now.

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
            {/* MASTER CONTAINER */}
            <div className="fixed inset-0 bg-app-bg z-50 overflow-hidden flex flex-col">

                {/* Background Atmosphere */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a20] via-[#09090b] to-[#050505] opacity-80" />
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                {/* MAIN CONTENT LAYER - Z-10 */}
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
                        <Button
                            onClick={handleEditPage}
                            disabled={selectedPageIds.size !== 1}
                            variant={selectedPageIds.size === 1 ? 'primary' : 'ghost'}
                            size="sm"
                            icon={Edit3}
                            className={selectedPageIds.size !== 1 ? 'opacity-50 cursor-not-allowed text-zinc-600' : ''}
                        >
                            <span className="hidden sm:inline">Editar</span>
                        </Button>

                        <Button
                            onClick={handleBulkDelete}
                            disabled={selectedPageIds.size === 0}
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            className={selectedPageIds.size === 0 ? 'opacity-50 cursor-not-allowed bg-black/20 border-white/5 text-zinc-600' : ''}
                        >
                            <span className="hidden sm:inline">Excluir {selectedPageIds.size > 0 ? `(${selectedPageIds.size})` : ''}</span>
                        </Button>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <Button
                            onClick={() => setIsExportModalOpen(true)}
                            variant="ghost"
                            size="sm"
                            icon={Download}
                        >
                            <span className="hidden sm:inline">Exportar</span>
                        </Button>
                        <Button
                            onClick={handleClose}
                            variant="ghost"
                            size="sm"
                            icon={X}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-zinc-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all ml-1 p-0"
                        />
                    </div>
                </div>

                {/* VIRTUALIZED GRID AREA */}
                {/* The Grid Component now handles DnD, Sortable, and AutoSizer */}
                <GridCanvas
                    orderedPages={orderedPages}
                    selectedPageIds={selectedPageIds}
                    onReorderPages={onReorderPages}
                    onSelectPageClick={handlePageClick}
                    onEditPage={handleSelectPage}
                    onAddPages={onAddPages}
                    setOrderedPages={setOrderedPages}
                />
            </div>

            {comic && (
                <ExportModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    projectId={comic.id}
                    projectName={comic.name}
                    pages={orderedPages}
                />
            )}
        </>
    );
};

export default ComicWorkstation;
