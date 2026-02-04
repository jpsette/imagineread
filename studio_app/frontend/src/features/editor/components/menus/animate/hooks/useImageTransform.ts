/**
 * useImageTransform
 * 
 * Custom hook to manage image transformation state and handlers.
 * Extracted from AnimationWorkspace for better separation of concerns.
 */

import { useState, useRef, useCallback } from 'react';

export interface ImageBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface UseImageTransformOptions {
    initialBounds?: ImageBounds;
    zoom: number;
}

interface UseImageTransformReturn {
    // State
    imageBounds: ImageBounds;
    setImageBounds: React.Dispatch<React.SetStateAction<ImageBounds>>;
    imageSelected: boolean;
    setImageSelected: React.Dispatch<React.SetStateAction<boolean>>;
    isImageDragging: boolean;
    resizeHandle: string | null;
    history: ImageBounds[];

    // Handlers
    handleImageClick: (e: React.MouseEvent) => void;
    handleImageDragStart: (e: React.MouseEvent) => void;
    handleImageResizeStart: (handle: string) => (e: React.MouseEvent) => void;
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseUp: () => void;
    undo: () => void;

    // Refs (for external use if needed)
    imageDragStartRef: React.MutableRefObject<{ x: number; y: number; imgX: number; imgY: number }>;
    imageResizeStartRef: React.MutableRefObject<{ bounds: ImageBounds; mouseX: number; mouseY: number }>;
}

export function useImageTransform({
    initialBounds = { x: -100, y: -150, width: 200, height: 300 },
    zoom
}: UseImageTransformOptions): UseImageTransformReturn {
    // State
    const [imageBounds, setImageBounds] = useState<ImageBounds>(initialBounds);
    const [imageSelected, setImageSelected] = useState(false);
    const [isImageDragging, setIsImageDragging] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [history, setHistory] = useState<ImageBounds[]>([]);

    // Refs
    const imageDragStartRef = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });
    const imageResizeStartRef = useRef({ bounds: { x: 0, y: 0, width: 0, height: 0 }, mouseX: 0, mouseY: 0 });

    // Handlers
    const handleImageClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setImageSelected(true);
    }, []);

    const handleImageDragStart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsImageDragging(true);
        imageDragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            imgX: imageBounds.x,
            imgY: imageBounds.y
        };
    }, [imageBounds.x, imageBounds.y]);

    const handleImageResizeStart = useCallback((handle: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setResizeHandle(handle);
        imageResizeStartRef.current = {
            bounds: { ...imageBounds },
            mouseX: e.clientX,
            mouseY: e.clientY
        };
    }, [imageBounds]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isImageDragging) {
            const deltaX = (e.clientX - imageDragStartRef.current.x) / zoom;
            const deltaY = (e.clientY - imageDragStartRef.current.y) / zoom;
            setImageBounds(prev => ({
                ...prev,
                x: imageDragStartRef.current.imgX + deltaX,
                y: imageDragStartRef.current.imgY + deltaY
            }));
        }

        if (resizeHandle) {
            const deltaX = (e.clientX - imageResizeStartRef.current.mouseX) / zoom;
            const deltaY = (e.clientY - imageResizeStartRef.current.mouseY) / zoom;
            const start = imageResizeStartRef.current.bounds;
            const aspectRatio = start.width / start.height;

            let newBounds = { ...start };

            // Corner handles - proportional resize
            if (resizeHandle === 'se') {
                const delta = Math.max(deltaX, deltaY);
                newBounds.width = Math.max(30, start.width + delta);
                newBounds.height = newBounds.width / aspectRatio;
            } else if (resizeHandle === 'sw') {
                const delta = Math.max(-deltaX, deltaY);
                newBounds.width = Math.max(30, start.width + delta);
                newBounds.height = newBounds.width / aspectRatio;
                newBounds.x = start.x - (newBounds.width - start.width);
            } else if (resizeHandle === 'ne') {
                const delta = Math.max(deltaX, -deltaY);
                newBounds.width = Math.max(30, start.width + delta);
                newBounds.height = newBounds.width / aspectRatio;
                newBounds.y = start.y - (newBounds.height - start.height);
            } else if (resizeHandle === 'nw') {
                const delta = Math.max(-deltaX, -deltaY);
                newBounds.width = Math.max(30, start.width + delta);
                newBounds.height = newBounds.width / aspectRatio;
                newBounds.x = start.x - (newBounds.width - start.width);
                newBounds.y = start.y - (newBounds.height - start.height);
            }
            // Edge handles - free resize
            else if (resizeHandle === 'e') {
                newBounds.width = Math.max(30, start.width + deltaX);
            } else if (resizeHandle === 'w') {
                newBounds.x = start.x + deltaX;
                newBounds.width = Math.max(30, start.width - deltaX);
            } else if (resizeHandle === 's') {
                newBounds.height = Math.max(30, start.height + deltaY);
            } else if (resizeHandle === 'n') {
                newBounds.y = start.y + deltaY;
                newBounds.height = Math.max(30, start.height - deltaY);
            }

            setImageBounds(newBounds);
        }
    }, [isImageDragging, resizeHandle, zoom]);

    const handleMouseUp = useCallback(() => {
        if (isImageDragging || resizeHandle) {
            setHistory(prev => [...prev.slice(-19), imageResizeStartRef.current.bounds]);
        }
        setIsImageDragging(false);
        setResizeHandle(null);
    }, [isImageDragging, resizeHandle]);

    const undo = useCallback(() => {
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            setImageBounds(lastState);
        }
    }, [history]);

    return {
        imageBounds,
        setImageBounds,
        imageSelected,
        setImageSelected,
        isImageDragging,
        resizeHandle,
        history,
        handleImageClick,
        handleImageDragStart,
        handleImageResizeStart,
        handleMouseMove,
        handleMouseUp,
        undo,
        imageDragStartRef,
        imageResizeStartRef
    };
}
