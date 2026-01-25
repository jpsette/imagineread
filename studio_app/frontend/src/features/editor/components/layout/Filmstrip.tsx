import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid } from 'react-window';
import type { GridImperativeAPI, CellComponentProps } from 'react-window';
import { useComicContext } from '../../hooks/useComicContext';

interface FilmstripProps {
    fileId: string;
}

export const Filmstrip: React.FC<FilmstripProps> = ({ fileId }) => {
    const navigate = useNavigate();
    const { pages, currentPageId, isLoading } = useComicContext(fileId);

    // Note: This build of react-window uses 'gridRef' prop and GridImperativeAPI
    const gridRef = useRef<GridImperativeAPI>(null);

    // Dimensions
    const ITEM_SIZE = 72; // Width (2/3 aspect of h-24 + gap)
    const ITEM_GAP = 12;
    const TOTAL_ITEM_SIZE = ITEM_SIZE + ITEM_GAP;

    // --- DRAG TO SCROLL LOGIC ---
    const [isDragging, setIsDragging] = React.useState(false);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const isDragRef = useRef(false);

    // Helpers for Drag Logic
    const getScrollContainer = () => {
        // Grid exposes 'element' via ref getter
        return gridRef.current?.element;
    };

    const startDragging = (e: React.MouseEvent) => {
        const container = getScrollContainer();
        if (!container) return;

        isDown.current = true;
        isDragRef.current = false;
        setIsDragging(true);
        startX.current = e.pageX - container.offsetLeft;
        scrollLeft.current = container.scrollLeft;
    };

    const stopDragging = () => {
        isDown.current = false;
        setIsDragging(false);
    };

    const onDrag = (e: React.MouseEvent) => {
        if (!isDown.current) return;
        const container = getScrollContainer();
        if (!container) return;

        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX.current) * 1; // 1:1 Physics (was * 2)
        // Fix: Increase threshold to 15 (7.5px) to prevent blocking clicks on micro-movements
        if (Math.abs(walk) > 15) isDragRef.current = true;
        container.scrollLeft = scrollLeft.current - walk;
    };

    // Data passed to Cells
    const itemData = {
        pages,
        currentPageId,
        isDragRef,
        navigate
    };

    if (isLoading) return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs text-zinc-400 shadow-lg flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                <span>Carregando...</span>
            </div>
        </div>
    );

    if (pages.length <= 1) return null;

    // Dimensions
    const containerWidth = Math.min(window.innerWidth * 0.9, 900);
    const containerHeight = 100; // Fixed height for filmstrip container

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none group">
            <div className="bg-black/60 backdrop-blur-xl border border-glass-border rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-4 pb-6 flex items-center gap-4 transition-all duration-500 translate-y-[85%] hover:translate-y-0 opacity-50 hover:opacity-100 pointer-events-auto">

                <div className="absolute -top-12 left-0 right-0 h-12 flex items-end justify-center cursor-pointer group-hover:opacity-0 transition-opacity"></div>

                <div className="px-2">
                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>
                        Páginas
                    </span>
                </div>

                {/* VIRTUALIZED GRID */}
                <div
                    onMouseDown={startDragging}
                    onMouseLeave={stopDragging}
                    onMouseUp={stopDragging}
                    onMouseMove={onDrag}
                    className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                >
                    <Grid
                        gridRef={gridRef}
                        columnCount={pages.length}
                        columnWidth={TOTAL_ITEM_SIZE}
                        rowCount={1}
                        rowHeight={containerHeight}
                        className="custom-scrollbar"
                        style={{
                            height: containerHeight,
                            width: containerWidth,
                            overflowY: 'hidden',
                            overflowX: 'auto'
                        }}
                        cellComponent={FilmstripCell}
                        // SAFE FIX: Pass data via cellProps instead of itemData
                        // This bypasses the problematic itemData handling in this react-window version
                        cellProps={itemData}
                    />
                </div>
            </div>
        </div>
    );
};

// --- EXTERNALIZED CELL COMPONENT ---
// Receives data merged into root props via cellProps
interface FilmstripCellProps extends CellComponentProps {
    pages: any[];
    currentPageId: string;
    isDragRef: React.MutableRefObject<boolean>;
    navigate: any;
}

const FilmstripCell = (props: FilmstripCellProps) => {
    // Destructure everything from top-level props (cellProps merge)
    const { columnIndex, style, pages, currentPageId, isDragRef, navigate } = props;

    const page = pages && pages[columnIndex];
    if (!page) return <div style={style} />;

    const isActive = page.id === currentPageId;
    const ITEM_GAP = 12;

    const handlePageClick = (pageId: string) => {
        if (pageId === currentPageId) return;
        navigate(`/editor/${pageId}`);
    };

    // Correct Z-Index Stacking
    const finalStyle = {
        ...style,
        width: Number(style.width) - ITEM_GAP,
        height: '100%',
        zIndex: isActive ? 50 : 1
    };

    return (
        <button
            style={finalStyle}
            onClick={(e) => {
                if (isDragRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                handlePageClick(page.id);
            }}
            className={`relative flex-shrink-0 h-24 rounded-lg overflow-hidden transition-all duration-300 ${isActive
                // Remove scale-105 to prevent overlap
                ? 'ring-2 ring-neon-blue shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                : 'opacity-60 hover:opacity-100'
                } select-none draggable-false`}
            onDragStart={(e) => e.preventDefault()}
        >
            <img
                src={page.coverUrl || page.url}
                alt={`Page ${columnIndex + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
            />
            <div className="absolute bottom-0 right-0 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md font-mono backdrop-blur-sm pointer-events-none">
                {columnIndex + 1}
            </div>
        </button>
    );
};
