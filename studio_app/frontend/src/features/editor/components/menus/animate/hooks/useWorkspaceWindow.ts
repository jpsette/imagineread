/**
 * useWorkspaceWindow
 * 
 * Custom hook to manage the workspace window state (position, size, minimize).
 * Handles persistence to localStorage.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'animation-workspace-settings';

interface WindowState {
    position: { x: number; y: number };
    size: { width: number; height: number };
    device: string;
    minimized: boolean;
    zoom: number;
    imageBounds: { x: number; y: number; width: number; height: number };
}

interface UseWorkspaceWindowOptions {
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number; height: number };
    minWidth?: number;
    minHeight?: number;
}

interface UseWorkspaceWindowReturn {
    // State
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMinimized: boolean;
    setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    isDragging: boolean;
    isResizing: boolean;

    // Handlers
    handleMouseDown: (e: React.MouseEvent) => void;
    handleResizeStart: (e: React.MouseEvent) => void;
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseUp: () => void;

    // Persistence
    savedSettings: WindowState | null;
    saveSettings: (extra: Partial<WindowState>) => void;
}

export function useWorkspaceWindow({
    defaultPosition = { x: 300, y: 60 },
    defaultSize = { width: 650, height: 750 },
    minWidth = 500,
    minHeight = 600
}: UseWorkspaceWindowOptions = {}): UseWorkspaceWindowReturn {

    // Load from localStorage
    const loadSettings = (): WindowState | null => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return null;
    };

    const savedSettings = loadSettings();

    // State
    const [position, setPosition] = useState(savedSettings?.position || defaultPosition);
    const [size, setSize] = useState(savedSettings?.size || defaultSize);
    const [isMinimized, setIsMinimized] = useState(savedSettings?.minimized || false);
    const [zoom, setZoom] = useState(savedSettings?.zoom || 2.0);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Refs
    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });

    // Handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            e.preventDefault();
            setIsDragging(true);
            dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
    }, [position]);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        resizeStart.current = { width: size.width, height: size.height, x: e.clientX, y: e.clientY };
    }, [size]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }
        if (isResizing) {
            const deltaX = e.clientX - resizeStart.current.x;
            const deltaY = e.clientY - resizeStart.current.y;
            setSize({
                width: Math.max(minWidth, resizeStart.current.width + deltaX),
                height: Math.max(minHeight, resizeStart.current.height + deltaY)
            });
        }
    }, [isDragging, isResizing, minWidth, minHeight]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    // Persistence
    const saveSettings = useCallback((extra: Partial<WindowState>) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            position,
            size,
            minimized: isMinimized,
            zoom,
            ...extra
        }));
    }, [position, size, isMinimized, zoom]);

    // Auto-save on changes
    useEffect(() => {
        const timer = setTimeout(() => {
            saveSettings({});
        }, 500);
        return () => clearTimeout(timer);
    }, [position, size, isMinimized, zoom, saveSettings]);

    return {
        position,
        size,
        isMinimized,
        setIsMinimized,
        zoom,
        setZoom,
        isDragging,
        isResizing,
        handleMouseDown,
        handleResizeStart,
        handleMouseMove,
        handleMouseUp,
        savedSettings,
        saveSettings
    };
}
