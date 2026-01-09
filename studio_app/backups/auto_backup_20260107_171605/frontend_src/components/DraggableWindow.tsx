import React, { useState, useRef, useEffect } from 'react';
import { X, GripHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

interface DraggableWindowProps {
    title: string;
    children: React.ReactNode;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    onClose?: () => void;
    zIndex?: number;
    onFocus?: () => void;
    minWidth?: number;
    minHeight?: number;
    className?: string;
    layoutId?: string;
    docked?: boolean;
    minimize?: boolean;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
    title,
    children,
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 400, height: 500 },
    onClose,
    zIndex = 10,
    onFocus = () => { },
    minWidth = 300,
    minHeight = 200,
    className = '',
    layoutId,
    docked = false
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [isMinimized, setIsMinimized] = useState(false);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Sync state with props when layoutId changes
    useEffect(() => {
        if (initialPosition) setPosition(initialPosition);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutId]);

    useEffect(() => {
        if (initialSize) setSize(initialSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutId]);

    // Refs
    const windowRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);

    // Mouse Events for Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (docked) return; // Disable drag if docked
        // Only trigger drag if clicking the header handle
        if (dragRef.current && dragRef.current.contains(e.target as Node)) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
            onFocus();
        } else {
            // Focus on click anywhere in window
            onFocus();
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && !docked) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;



                setPosition({
                    x: newX,
                    y: Math.max(0, newY)
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, docked]);

    // --- Resizing Logic ---
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (docked) return; // Disable resize if docked
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: size.width,
            startHeight: size.height
        };
        onFocus();
    };

    useEffect(() => {
        const handleResizeMouseMove = (e: MouseEvent) => {
            if (isResizing && resizeRef.current && !docked) {
                const deltaX = e.clientX - resizeRef.current.startX;
                const deltaY = e.clientY - resizeRef.current.startY;

                const newWidth = Math.max(minWidth, resizeRef.current.startWidth + deltaX);
                const newHeight = Math.max(minHeight, resizeRef.current.startHeight + deltaY);

                setSize({ width: newWidth, height: newHeight });
            }
        };

        const handleResizeMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                resizeRef.current = null;
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMouseMove);
            window.addEventListener('mouseup', handleResizeMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [isResizing, minWidth, minHeight, docked]);


    return (
        <div
            ref={windowRef}
            className={`${docked ? 'relative w-full h-full' : 'absolute'} flex flex-col bg-panel-bg border border-border-color rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm ${className}`}
            style={docked ? {} : {
                left: position.x,
                top: position.y,
                width: size.width,
                height: isMinimized ? 'auto' : size.height,
                zIndex: zIndex,
                transition: (isDragging || isResizing) ? 'none' : 'box-shadow 0.2s, border-color 0.2s, height 0.2s',
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header / Remote Handle */}
            <div
                ref={dragRef}
                className={`h-9 bg-[#18181b] border-b border-border-color flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none hover:bg-[#27272a] transition-colors ${isDragging ? 'bg-[#27272a]' : ''}`}
                onDoubleClick={() => setIsMinimized(!isMinimized)}
            >
                <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                    <GripHorizontal size={14} className="opacity-50" />
                    <span>{title}</span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Minimize */}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-white/10 text-text-secondary hover:text-white rounded transition-colors"
                    >
                        {isMinimized ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                    </button>

                    {/* Window Controls (Visual only for now unless onClose passed) */}
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-red-500/20 text-text-secondary hover:text-red-400 rounded transition-colors">
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Content (Hidden if minimized) */}
            {!isMinimized && (
                <div className="flex-1 overflow-auto relative">
                    {children}
                </div>
            )}

            {/* Resize Handle (Active) */}
            {!isMinimized && (
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 hover:bg-white/5 transition-colors rounded-tl-lg z-50"
                    onMouseDown={handleResizeMouseDown}
                >
                    <svg viewBox="0 0 10 10" fill="currentColor" className="w-3 h-3 text-text-secondary opacity-50 hover:opacity-100">
                        <path d="M10 10 L10 2 L2 10 Z" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default DraggableWindow;
