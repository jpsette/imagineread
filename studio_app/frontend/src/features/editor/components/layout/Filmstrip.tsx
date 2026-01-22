import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComicContext } from '../../hooks/useComicContext';
import { Plus, Trash2 } from 'lucide-react';
import { useEditorUIStore } from '../../uiStore';

interface FilmstripProps {
    fileId: string;
}

export const Filmstrip: React.FC<FilmstripProps> = ({ fileId }) => {
    const navigate = useNavigate();
    const { pages, currentPageId, isLoading } = useComicContext(fileId);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to selected item
    useEffect(() => {
        if (scrollContainerRef.current) {
            const selectedElement = document.getElementById(`filmstrip-item-${currentPageId}`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentPageId, pages.length]);

    const handlePageClick = (pageId: string) => {
        if (pageId === currentPageId) return;

        // TODO: Trigger Save before navigating?
        // Navigation handles unmount -> save if we implemented checking dirty state
        // For now, simple navigation.
        navigate(`/editor/${pageId}`);
    };

    if (isLoading) return <div className="h-24 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center text-xs text-zinc-500">Carregando tira...</div>;

    if (pages.length <= 1) return null; // Hide if single page? Or Show for consistency? Let's show.

    return (
        <div className="h-32 bg-zinc-950 border-t border-zinc-800 flex flex-col shrink-0">
            {/* Header / Actions */}
            <div className="px-4 py-1 flex items-center justify-between bg-zinc-900/50 border-b border-zinc-800/50">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Páginas do Capítulo ({pages.length})</span>

                {/* Future Actions: Add Page */}
                {/* <button className="text-zinc-500 hover:text-white p-1"><Plus size={14} /></button> */}
            </div>

            {/* Scrollable Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto flex items-center gap-3 px-4 py-2 custom-scrollbar"
            >
                {pages.map((page, index) => {
                    const isActive = page.id === currentPageId;
                    return (
                        <button
                            key={page.id}
                            id={`filmstrip-item-${page.id}`}
                            onClick={() => handlePageClick(page.id)}
                            className={`relative group flex-shrink-0 h-full aspect-[2/3] rounded-md overflow-hidden border-2 transition-all ${isActive
                                ? 'border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500/50'
                                : 'border-zinc-700 hover:border-zinc-500 opacity-70 hover:opacity-100'
                                }`}
                        >
                            {/* Image Thumbnail */}
                            <img
                                src={page.coverUrl || page.url}
                                alt={page.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {/* Number Overlay */}
                            <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md font-mono">
                                {index + 1}
                            </div>

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute inset-0 border-[3px] border-cyan-500 rounded-md pointer-events-none" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
