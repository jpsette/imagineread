import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid } from 'react-window';
import type { CellComponentProps } from 'react-window';
import { useComicContext } from '../../hooks/useComicContext';
import { useEditorStore } from '../../store';
import { useEditorUIStore } from '../../uiStore';

interface FilmstripProps {
    fileId: string;
    parentId?: string | null;
}

export const Filmstrip = React.memo<FilmstripProps>(({ fileId, parentId }) => {
    const navigate = useNavigate();
    // We lift the context logic slightly or modify useComicContext to accept known parentId
    const { pages, currentPageId, isLoading } = useComicContext(fileId, parentId); // Modified Hook Usage

    // Note: This build of react-window uses 'gridRef' prop and GridImperativeAPI
    const gridRef = useRef<any>(null);

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

    // Auto-Scroll to Active Page
    React.useEffect(() => {
        if (!gridRef.current || !pages || pages.length === 0) return;

        const index = pages.findIndex(p => p.id === currentPageId);
        if (index !== -1 && gridRef.current && typeof gridRef.current.scrollToItem === 'function') {
            // Scroll to item (Column index)
            gridRef.current.scrollToItem({
                columnIndex: index,
                align: 'center' // Center the active item
            });
        }
    }, [currentPageId, pages]);

    // Data passed to Cells
    const itemData = {
        pages,
        currentPageId,
        isDragRef,
        navigate
    };


    // --- RENDER LOGIC MOVED TO AVOID UNMOUNTING ---
    // If loading and no pages, show a discreet loader inside the container structure logic
    // rather than early return if possible, OR if we must return early, ensure we don't break the layout flow?
    // Actually, user wants it to NOT disappear.
    // So we should ideally render the CONTAINER even if empty.

    const containerWidth = Math.min(window.innerWidth * 0.9, 900);
    const containerHeight = 100; // Fixed height

    const showLoader = isLoading && pages.length === 0;
    const isEmpty = !isLoading && pages.length <= 1;

    // If completely empty (1 page or less) and not loading, we might want to hide it.
    // But to prevent "reload flash", we should be careful. 
    // If we hide it, it disappears. If user goes to next page and it has pages, it reappears.
    // That IS a layout shift.
    // If most comics have pages, it's better to keep it mounted.

    if (isEmpty && !showLoader) return null; // Only hide if genuinely empty and done loading.

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none group">
            <div className="bg-black/60 backdrop-blur-xl border border-glass-border rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-4 pb-6 flex items-center gap-4 transition-all duration-500 translate-y-[85%] hover:translate-y-0 opacity-50 hover:opacity-100 pointer-events-auto min-w-[300px] min-h-[120px] justify-center">

                <div className="absolute -top-12 left-0 right-0 h-12 flex items-end justify-center cursor-pointer group-hover:opacity-0 transition-opacity"></div>

                <div className="px-2 self-start pt-2">
                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>
                        Páginas
                    </span>
                </div>

                {showLoader ? (
                    <div className="flex items-center gap-2 text-zinc-400">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                        <span className="text-xs">Carregando páginas...</span>
                    </div>
                ) : (
                    /* VIRTUALIZED GRID */
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
                            cellProps={itemData as any}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

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

    // --- NAVIGATION GUARD ---
    const isDirty = useEditorStore(s => s.isDirty);
    const { setShowUnsavedModal, setPendingNavigationPath } = useEditorUIStore();

    const handlePageClick = (pageId: string) => {
        if (pageId === currentPageId) return;

        const targetPath = `/editor/${pageId}`;

        if (isDirty) {
            setPendingNavigationPath(targetPath);
            setShowUnsavedModal(true);
        } else {
            navigate(targetPath);
        }
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
            // Fix: User requested explicit Blue Border. ring-offset-0 ensures visibility.
            // Also removed overflow-hidden from button to allow Ring to shine, 
            // applied rounded-lg to image instead.
            className={`relative flex-shrink-0 h-24 rounded-lg transition-all duration-300 ${isActive
                ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] scale-100'
                : 'opacity-60 hover:opacity-100'
                } select-none draggable-false`}
            onDragStart={(e) => e.preventDefault()}
        >
            <img
                src={page.coverUrl || page.url}
                alt={`Page ${columnIndex + 1}`}
                className="w-full h-full object-cover rounded-lg pointer-events-none"
                loading="lazy"
            />

            {/* Page Number - Centered and Larger (User Request 3) */}
            <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none shadow-sm min-w-[24px] text-center border border-white/10 ${isActive ? 'bg-blue-600' : 'bg-black/70'
                }`}>
                {columnIndex + 1}
            </div>
        </button>
    );
};
