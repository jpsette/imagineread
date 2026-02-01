import React, { useState, useRef, useEffect } from 'react';

interface FloatingPanelProps {
    children: React.ReactNode;
    defaultPosition: { x: number; y: number };
    defaultSize?: { width: number; height: number };
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    className?: string;
}

/**
 * A floating panel that can be dragged and resized.
 * - Drag by clicking anywhere on the panel header (top 32px)
 * - Resize by dragging the bottom-right corner handle
 * 
 * OPTIMIZED: Uses refs for position/size during drag to avoid re-renders
 */
export const FloatingPanel: React.FC<FloatingPanelProps> = ({
    children,
    defaultPosition,
    defaultSize = { width: 300, height: 800 },
    minWidth = 250,
    maxWidth = 350,
    minHeight = 250,
    className = ''
}) => {
    // Refs for position and size to avoid re-renders during drag/resize
    const positionRef = useRef(defaultPosition);
    const sizeRef = useRef(defaultSize);
    const panelRef = useRef<HTMLDivElement>(null);

    // Track if we're dragging/resizing
    const isDraggingRef = useRef(false);
    const isResizingRef = useRef(false);

    // Start points for drag/resize
    const dragStartRef = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 });
    const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

    // State only for cursor changes (minimal re-renders)
    const [cursor, setCursor] = useState<'default' | 'grabbing'>('default');

    // Apply transform directly to DOM for smooth performance
    const applyTransform = () => {
        if (panelRef.current) {
            panelRef.current.style.left = `${positionRef.current.x}px`;
            panelRef.current.style.top = `${positionRef.current.y}px`;
            panelRef.current.style.width = `${sizeRef.current.width}px`;
            panelRef.current.style.height = `${sizeRef.current.height}px`;
        }
    };

    // --- DRAG HANDLERS ---
    const handleDragStart = (e: React.MouseEvent) => {
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;

        const relativeY = e.clientY - rect.top;
        if (relativeY > 32) return; // Not in header area

        e.preventDefault();
        isDraggingRef.current = true;
        setCursor('grabbing');

        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            panelX: positionRef.current.x,
            panelY: positionRef.current.y
        };

        // Add listeners
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    };

    const handleDragMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;

        const deltaX = e.clientX - dragStartRef.current.mouseX;
        const deltaY = e.clientY - dragStartRef.current.mouseY;

        let newX = dragStartRef.current.panelX + deltaX;
        let newY = dragStartRef.current.panelY + deltaY;

        // Clamp to viewport bounds
        const maxX = window.innerWidth - sizeRef.current.width;
        const maxY = window.innerHeight - sizeRef.current.height;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        positionRef.current = { x: newX, y: newY };
        applyTransform();
    };

    const handleDragEnd = () => {
        isDraggingRef.current = false;
        setCursor('default');
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
    };

    // --- RESIZE HANDLERS ---
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;

        resizeStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            width: sizeRef.current.width,
            height: sizeRef.current.height
        };

        window.addEventListener('mousemove', handleResizeMove);
        window.addEventListener('mouseup', handleResizeEnd);
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizingRef.current) return;

        const deltaX = e.clientX - resizeStartRef.current.mouseX;
        const deltaY = e.clientY - resizeStartRef.current.mouseY;

        let newWidth = resizeStartRef.current.width + deltaX;
        let newHeight = resizeStartRef.current.height + deltaY;

        // Clamp to constraints
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        newHeight = Math.max(minHeight, Math.min(newHeight, window.innerHeight - 48));

        sizeRef.current = { width: newWidth, height: newHeight };
        applyTransform();
    };

    const handleResizeEnd = () => {
        isResizingRef.current = false;
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
    };

    // Initial position apply
    useEffect(() => {
        applyTransform();
    }, []);

    return (
        <div
            ref={panelRef}
            className={`fixed z-40 ${className}`}
            style={{
                left: defaultPosition.x,
                top: defaultPosition.y,
                width: defaultSize.width,
                height: defaultSize.height,
                cursor: cursor,
                willChange: 'left, top, width, height'
            }}
            onMouseDown={handleDragStart}
        >
            {/* Drag Handle Indicator (Visual feedback at top) */}
            <div
                className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-grab hover:bg-white/5 rounded-t-2xl transition-colors"
                style={{ cursor: cursor === 'grabbing' ? 'grabbing' : 'grab' }}
            >
                <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Content */}
            <div className="w-full h-full overflow-hidden">
                {children}
            </div>

            {/* Resize Handle (Bottom-Right Corner) */}
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize group"
                onMouseDown={handleResizeStart}
            >
                <svg
                    className="w-full h-full text-white/30 group-hover:text-white/60 transition-colors"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                >
                    <path d="M14 14H10L14 10V14Z" />
                    <path d="M14 8H6L14 0V8Z" opacity="0.5" />
                </svg>
            </div>
        </div>
    );
};
