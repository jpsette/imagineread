import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, Check, Edit3, Download } from 'lucide-react';
import { ExportModal } from './ExportModal';
import { FileEntry } from '../../types';

interface ComicWorkstationProps {
    comic: {
        id: string;
        name: string;
    };
    pages: FileEntry[];
    onClose: () => void;
    onSelectPage: (pageId: string, pageUrl: string) => void;
    onDeletePages?: (pageIds: string[]) => void;
    onAddPages?: (files: File[]) => void;
}

export const ComicWorkstation: React.FC<ComicWorkstationProps> = ({
    comic,
    pages,
    onClose,
    onSelectPage,
    onDeletePages,
    onAddPages,
}) => {
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sort pages by order or name
    const sortedPages = React.useMemo(() => {
        return [...pages].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            return a.name.localeCompare(b.name, undefined, { numeric: true });
        });
    }, [pages]);

    // Multi-selection handler
    const handlePageClick = useCallback((pageId: string, e: React.MouseEvent) => {
        const newSet = new Set(selectedPageIds);

        if (e.shiftKey && lastSelectedId) {
            // Range Selection
            const lastIndex = sortedPages.findIndex(p => p.id === lastSelectedId);
            const currIndex = sortedPages.findIndex(p => p.id === pageId);

            if (lastIndex !== -1 && currIndex !== -1) {
                const start = Math.min(lastIndex, currIndex);
                const end = Math.max(lastIndex, currIndex);

                for (let i = start; i <= end; i++) {
                    newSet.add(sortedPages[i].id);
                }
            }
        } else if (e.metaKey || e.ctrlKey) {
            // Toggle Selection
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
                setLastSelectedId(null);
            } else {
                newSet.add(pageId);
                setLastSelectedId(pageId);
            }
        } else {
            // Single Select
            newSet.clear();
            newSet.add(pageId);
            setLastSelectedId(pageId);
        }

        setSelectedPageIds(newSet);
    }, [selectedPageIds, lastSelectedId, sortedPages]);

    // Bulk delete handler
    const handleBulkDelete = useCallback(() => {
        if (selectedPageIds.size === 0 || !onDeletePages) return;

        if (confirm(`Excluir ${selectedPageIds.size} página(s)?`)) {
            onDeletePages(Array.from(selectedPageIds));
            setSelectedPageIds(new Set());
            setLastSelectedId(null);
        }
    }, [selectedPageIds, onDeletePages]);

    // Edit single page
    const handleEditPage = useCallback(() => {
        if (selectedPageIds.size !== 1) return;

        const pageId = Array.from(selectedPageIds)[0];
        const page = sortedPages.find(p => p.id === pageId);

        if (page) {
            onSelectPage(pageId, page.url || '');
        }
    }, [selectedPageIds, sortedPages, onSelectPage]);

    // Add pages handler
    const handleAddPages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !onAddPages) return;

        onAddPages(Array.from(files));

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onAddPages]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete key
            if (e.key === 'Delete' && selectedPageIds.size > 0) {
                handleBulkDelete();
            }
            // Enter key - edit
            if (e.key === 'Enter' && selectedPageIds.size === 1) {
                handleEditPage();
            }
            // Escape - clear selection
            if (e.key === 'Escape') {
                setSelectedPageIds(new Set());
                setLastSelectedId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPageIds, handleBulkDelete, handleEditPage]);

    return (
        <>
            <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col">
                {/* Header */}
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0c0c0e]">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-white">{comic.name}</h1>
                        <span className="text-sm text-white/40">{sortedPages.length} páginas</span>
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
                        {onDeletePages && (
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
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Pages Grid */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                        {sortedPages.map((page) => {
                            const isSelected = selectedPageIds.has(page.id);

                            return (
                                <PageCard
                                    key={page.id}
                                    page={page}
                                    isSelected={isSelected}
                                    onClick={(e) => handlePageClick(page.id, e)}
                                    onEdit={() => onSelectPage(page.id, page.url || '')}
                                />
                            );
                        })}

                        {/* Add Page Button */}
                        {onAddPages && (
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
                        )}
                    </div>
                </div>
            </div>

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                projectId={comic.id} // Fix: comic does not have parentId type here, using id which is the folder ID.
                projectName={comic.name}
            />
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
            className={`group cursor-pointer relative aspect-[3/4] rounded-xl border overflow-hidden transition-all ${isSelected
                ? 'border-accent-blue ring-2 ring-accent-blue/50 scale-[1.02]'
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

            {/* Footer - Shows on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 transition-all translate-y-full group-hover:translate-y-0">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white truncate">
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
