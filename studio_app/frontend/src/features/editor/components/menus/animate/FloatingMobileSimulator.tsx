/**
 * FloatingMobileSimulator
 * 
 * A floating, draggable, and resizable mobile phone simulator.
 * Uses React Portal to render outside sidebar DOM hierarchy.
 * Always visible when AnimateMenu is active.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Smartphone, Move, Minimize2, Maximize2 } from 'lucide-react';

interface FloatingMobileSimulatorProps {
    currentImage: string | null;
    currentIndex: number;
    totalPanels: number;
    onPrevious: () => void;
    onNext: () => void;
}

export const FloatingMobileSimulator: React.FC<FloatingMobileSimulatorProps> = ({
    currentImage,
    currentIndex,
    totalPanels,
    onPrevious,
    onNext
}) => {
    // Position and size state - start in center-right of screen
    const [position, setPosition] = useState({ x: window.innerWidth - 350, y: 80 });
    const [size, setSize] = useState({ width: 280, height: 560 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });

    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < totalPanels - 1;

    // Drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Stop event from reaching sidebar
        e.stopPropagation();

        if ((e.target as HTMLElement).closest('.drag-handle')) {
            e.preventDefault();
            setIsDragging(true);
            dragOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y
            };
        }
    }, [position]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
        if (isResizing) {
            const deltaY = e.clientY - resizeStart.current.y;

            // Maintain aspect ratio (9:19.5 for phone)
            const aspectRatio = 9 / 19.5;
            const newHeight = Math.max(300, resizeStart.current.height + deltaY);
            const newWidth = Math.max(150, newHeight * aspectRatio);

            setSize({ width: newWidth, height: newHeight });
        }
    }, [isDragging, isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    // Resize handler
    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        resizeStart.current = {
            width: size.width,
            height: size.height,
            x: e.clientX,
            y: e.clientY
        };
    };

    // Global mouse event listeners
    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    // Use Portal to render outside sidebar DOM hierarchy
    return createPortal(
        <div
            ref={containerRef}
            className="fixed z-[1000] select-none shadow-2xl"
            style={{
                left: position.x,
                top: position.y,
                width: isMinimized ? 200 : size.width,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Header / Drag Handle */}
            <div className="drag-handle flex items-center justify-between bg-panel-bg rounded-t-lg px-3 py-2 cursor-move border border-zinc-700 border-b-0">
                <div className="flex items-center gap-2 text-text-secondary text-xs">
                    <Move size={12} />
                    <Smartphone size={12} />
                    <span className="font-medium">Preview Mobile</span>
                </div>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-surface rounded transition-colors"
                >
                    {isMinimized ? <Maximize2 size={12} className="text-text-secondary" /> : <Minimize2 size={12} className="text-text-secondary" />}
                </button>
            </div>

            {/* Phone Content */}
            {!isMinimized && (
                <div
                    className="bg-panel-bg rounded-b-lg border border-zinc-700 border-t-0 p-3 relative"
                    style={{ height: size.height }}
                >
                    {/* Phone Frame */}
                    <div
                        className="bg-zinc-950 rounded-[1.5rem] h-full overflow-hidden shadow-2xl relative"
                    >
                        {/* Notch */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10" />

                        {/* Screen */}
                        <div className="h-full flex items-center justify-center bg-black rounded-[1.5rem] overflow-hidden">
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt={`Panel ${currentIndex + 1}`}
                                    className="w-full h-full object-contain"
                                    draggable={false}
                                />
                            ) : (
                                <div className="text-zinc-600 text-xs text-center p-4">
                                    <Smartphone size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>Nenhum quadro</p>
                                    <p className="text-[10px] mt-1">Detecte quadros no Vetorizar</p>
                                </div>
                            )}
                        </div>

                        {/* Navigation Overlay */}
                        {totalPanels > 0 && (
                            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2 z-10">
                                <button
                                    onClick={onPrevious}
                                    disabled={!hasPrevious}
                                    className={`p-2 rounded-full backdrop-blur-sm transition-all ${hasPrevious
                                        ? 'bg-black/50 hover:bg-black/70 text-white'
                                        : 'bg-black/30 text-zinc-600 cursor-not-allowed'
                                        }`}
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <div className="px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                                    {currentIndex + 1} / {totalPanels}
                                </div>

                                <button
                                    onClick={onNext}
                                    disabled={!hasNext}
                                    className={`p-2 rounded-full backdrop-blur-sm transition-all ${hasNext
                                        ? 'bg-black/50 hover:bg-black/70 text-white'
                                        : 'bg-black/30 text-zinc-600 cursor-not-allowed'
                                        }`}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Resize Handle */}
                    <div
                        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
                        onMouseDown={handleResizeStart}
                    >
                        <svg viewBox="0 0 24 24" className="w-full h-full text-text-muted">
                            <path fill="currentColor" d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22M22 14H20V12H22V14Z" />
                        </svg>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
