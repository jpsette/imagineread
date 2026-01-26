import { useState, useEffect, RefObject, useRef } from 'react';
import Konva from 'konva';
import { useEditorUIStore } from '../../uiStore';

interface UseCanvasNavigationProps {
    stageRef: RefObject<Konva.Stage>;
    containerRef: RefObject<HTMLDivElement>;
    imgOriginal: HTMLImageElement | undefined;
    statusOriginal: string;
    onImageLoad?: (width: number, height: number) => void;
    // New: Pass active dimensions to prevent microscopic fit on frame 0
    dimensions?: { width: number; height: number };
    fileId?: string; // Track file identity
}

export const useCanvasNavigation = ({
    stageRef,
    containerRef,
    imgOriginal,
    statusOriginal,
    onImageLoad,
    dimensions,
    fileId
}: UseCanvasNavigationProps) => {
    const { zoom: scale, setZoom: setScale } = useEditorUIStore(); // Sync with Global Store
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hasFitted, setHasFitted] = useState(false);

    // Track previous file ID to detect actual page changes vs refresh
    const prevFileId = useRef<string | undefined>(fileId);

    // Reset fit state ONLY when fileId changes (New Page)
    useEffect(() => {
        if (fileId !== prevFileId.current) {
            setHasFitted(false);
            prevFileId.current = fileId;
        }
        // If fileId is undefined (initial load), hasFitted logic handles it via !hasFitted check below
    }, [fileId]);

    // Auto-Fit Logic
    useEffect(() => {
        // Guard: Wait for container to have real size (>50px)
        const isValidSize = dimensions ? (dimensions.width > 50 && dimensions.height > 50) : (containerRef.current && containerRef.current.offsetWidth > 50);

        if (statusOriginal === 'loaded' && imgOriginal && containerRef.current && !hasFitted && isValidSize) {
            const container = containerRef.current;
            const containerWidth = dimensions?.width || container.offsetWidth;
            const containerHeight = dimensions?.height || container.offsetHeight;

            const imgRatio = imgOriginal.width / imgOriginal.height;
            const containerRatio = containerWidth / containerHeight;

            let finalScale = 1;
            if (containerRatio > imgRatio) {
                finalScale = (containerHeight * 0.9) / imgOriginal.height;
            } else {
                finalScale = (containerWidth * 0.9) / imgOriginal.width;
            }

            const finalX = (containerWidth - imgOriginal.width * finalScale) / 2;
            const finalY = (containerHeight - imgOriginal.height * finalScale) / 2;

            if (Math.abs(finalScale - scale) > 0.001) {
                setScale(finalScale);
            }
            setPosition({ x: finalX, y: finalY });
            setHasFitted(true);

            if (onImageLoad) {
                onImageLoad(imgOriginal.width, imgOriginal.height);
            }
        }
    }, [imgOriginal, statusOriginal, hasFitted, onImageLoad, containerRef, dimensions, scale, setScale]);

    // --- STATE REFS (For Direct Manipulation) ---
    // We use refs to track the "Visual Truth" instantly, bypassing React's render cycle latency.
    const zoomRef = useRef(scale);
    const posRef = useRef(position);
    const syncTimeout = useRef<NodeJS.Timeout>();

    // Sync Refs when React state updates (e.g. Auto-Fit or External Controls)
    useEffect(() => {
        zoomRef.current = scale;
    }, [scale]);

    useEffect(() => {
        posRef.current = position;
    }, [position]);

    // Cleanup timeout
    useEffect(() => {
        return () => clearTimeout(syncTimeout.current);
    }, []);

    // Zoom Logic - Tuned for Trackpad & Mouse Wheel
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        // 1. Calculate using LATEST VISUAL STATE (Refs), not stale React state
        const oldScale = zoomRef.current;
        const oldPos = posRef.current;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - oldPos.x) / oldScale,
            y: (pointer.y - oldPos.y) / oldScale,
        };

        // ANALOG ZOOM: Use magnitude of deltaY for smooth scaling
        const ZOOM_SENSITIVITY = 0.002;
        // Constraint: Prevent explosive zoom if delta is huge (e.g. mousewheel glitch)
        const safeDelta = Math.max(-100, Math.min(100, e.evt.deltaY));
        const newScale = oldScale * Math.exp(-safeDelta * ZOOM_SENSITIVITY);

        // Clamp Zoom
        if (newScale < 0.1 || newScale > 10) return;

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        // 2. DIRECT MANIPULATION (Visual Update -> 0ms Latency)
        // Bypass React and talk to Konva directly
        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
        stage.batchDraw();

        // Update Refs immediately so next event sees them
        zoomRef.current = newScale;
        posRef.current = newPos;

        // 3. DEBOUNCED SYNC (State Update -> 100ms Latency)
        // Only trigger React Re-render when user STOPS zooming
        clearTimeout(syncTimeout.current);
        syncTimeout.current = setTimeout(() => {
            setScale(newScale);
            setPosition(newPos);
        }, 100);
    };

    // SYNC LOGIC: Capture final position after drag to prevent "Snap Back"
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target === stageRef.current) {
            const finalPos = { x: e.target.x(), y: e.target.y() };
            // Update ref
            posRef.current = finalPos;
            // Sync state immediately (drag is discrete, safe to sync)
            setPosition(finalPos);
        }
    };

    return { scale, position, handleWheel, handleDragEnd };
};
