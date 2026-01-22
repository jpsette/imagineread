import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComicContext } from '../../hooks/useComicContext';

interface FilmstripProps {
    fileId: string;
}

export const Filmstrip: React.FC<FilmstripProps> = ({ fileId }) => {
    const navigate = useNavigate();
    const { pages, currentPageId, isLoading } = useComicContext(fileId);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // --- DRAG TO SCROLL LOGIC ---
    const [isDragging, setIsDragging] = React.useState(false);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const isDragRef = useRef(false); // To distinguish click vs drag

    const startDragging = (e: React.MouseEvent) => {
        isDown.current = true;
        isDragRef.current = false; // Reset drag flag
        setIsDragging(true);
        if (scrollContainerRef.current) {
            startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
            scrollLeft.current = scrollContainerRef.current.scrollLeft;
        }
    };

    const stopDragging = () => {
        isDown.current = false;
        setIsDragging(false);
    };

    const onDrag = (e: React.MouseEvent) => {
        if (!isDown.current) return;
        e.preventDefault();

        if (scrollContainerRef.current) {
            const x = e.pageX - scrollContainerRef.current.offsetLeft;
            const walk = (x - startX.current) * 2; // Scroll-fast factor

            // Mark as dragging if moved significantly
            if (Math.abs(walk) > 5) {
                isDragRef.current = true;
            }

            scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
        }
    };

    // Auto-scroll to selected item
    useEffect(() => {
        if (scrollContainerRef.current) {
            const selectedElement = document.getElementById(`filmstrip-item-${currentPageId}`);
            if (selectedElement) {
                // FIXED: Replace scrollIntoView (which scrolls the window) with local container scroll
                const container = scrollContainerRef.current;
                const scrollLeft = selectedElement.offsetLeft - (container.clientWidth / 2) + (selectedElement.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
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

    // Loading State - Absolute to prevent layout shift
    if (isLoading) return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs text-zinc-400 shadow-lg flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                <span>Carregando...</span>
            </div>
        </div>
    );

    if (pages.length <= 1) return null; // Hide if single page? Or Show for consistency? Let's show.

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] flex flex-col items-center pointer-events-none group">

            {/* DRAWER CONTAINER */}
            <div className="bg-black/60 backdrop-blur-xl border border-glass-border rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-4 pb-6 flex items-center gap-4 transition-all duration-500 translate-y-[85%] hover:translate-y-0 opacity-50 hover:opacity-100 pointer-events-auto">

                {/* HANDLE (Visual Cue - Only visible on hover/interaction or VERY subtle) */}
                <div className="absolute -top-12 left-0 right-0 h-12 flex items-end justify-center cursor-pointer group-hover:opacity-0 transition-opacity">
                    {/* Invisible trigger area extender */}
                </div>

                <div className="px-2">
                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>
                        Páginas
                    </span>
                </div>

                {/* Scrollable Area */}
                <div
                    ref={scrollContainerRef}
                    className={`flex overflow-x-auto gap-3 py-2 px-1 custom-scrollbar max-w-4xl select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                        }`}
                    style={{ scrollbarWidth: 'none' }} // Hide scrollbar for cleaner look
                    onMouseDown={startDragging}
                    onMouseLeave={stopDragging}
                    onMouseUp={stopDragging}
                    onMouseMove={onDrag}
                >
                    {pages.map((page, index) => {
                        const isActive = page.id === currentPageId;
                        return (
                            <button
                                key={page.id}
                                id={`filmstrip-item-${page.id}`}
                                onClick={(e) => {
                                    // Prevent navigation if we were dragging
                                    if (isDragRef.current) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        return;
                                    }
                                    handlePageClick(page.id);
                                }}
                                className={`relative flex-shrink-0 h-24 aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ${isActive
                                    ? 'ring-2 ring-neon-blue shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-110 z-10'
                                    : 'opacity-60 hover:opacity-100 hover:scale-105 hover:z-10'
                                    } select-none draggable-false`} // Prevent native image drag
                                onDragStart={(e) => e.preventDefault()} // Disable native image dragging
                            >
                                {/* Image Thumbnail */}
                                <img
                                    src={page.coverUrl || page.url}
                                    alt={page.name}
                                    className="w-full h-full object-cover pointer-events-none" // Ensure image doesn't steal events
                                    loading="lazy"
                                />

                                {/* Number Overlay */}
                                <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md font-mono backdrop-blur-sm pointer-events-none">
                                    {index + 1}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
