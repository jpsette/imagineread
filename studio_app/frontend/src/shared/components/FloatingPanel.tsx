import React, { useState, useRef, useCallback, useEffect } from 'react';

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
    // State
    const [position, setPosition] = useState(defaultPosition);
    const [size, setSize] = useState(defaultSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Refs for tracking drag/resize start points
    const dragStartRef = useRef({ mouseX: 0, mouseY: 0, panelX: 0, panelY: 0 });
    const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    // --- DRAG HANDLERS ---
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        // Only start drag if clicking on the header area (first 32px)
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;

        const relativeY = e.clientY - rect.top;
        if (relativeY > 32) return; // Not in header area

        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            panelX: position.x,
            panelY: position.y
        };
    }, [position]);

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartRef.current.mouseX;
        const deltaY = e.clientY - dragStartRef.current.mouseY;

        let newX = dragStartRef.current.panelX + deltaX;
        let newY = dragStartRef.current.panelY + deltaY;

        // Clamp to viewport bounds
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
    }, [isDragging, size]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // --- RESIZE HANDLERS ---
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            width: size.width,
            height: size.height
        };
    }, [size]);

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX = e.clientX - resizeStartRef.current.mouseX;
        const deltaY = e.clientY - resizeStartRef.current.mouseY;

        let newWidth = resizeStartRef.current.width + deltaX;
        let newHeight = resizeStartRef.current.height + deltaY;

        // Clamp to constraints
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        newHeight = Math.max(minHeight, Math.min(newHeight, window.innerHeight - 48)); // 48px margin

        setSize({ width: newWidth, height: newHeight });
    }, [isResizing, minWidth, maxWidth, minHeight]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
    }, []);

    // --- GLOBAL EVENT LISTENERS ---
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
            return () => {
                window.removeEventListener('mousemove', handleResizeMove);
                window.removeEventListener('mouseup', handleResizeEnd);
            };
        }
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    return (
        <div
            ref={panelRef}
            className={`fixed z-40 ${className}`}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleDragStart}
        >
            {/* Drag Handle Indicator (Visual feedback at top) */}
            <div
                className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-grab hover:bg-white/5 rounded-t-2xl transition-colors"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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
                {/* Visual indicator */}
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
