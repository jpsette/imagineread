/**
 * AnimationWorkspace
 * 
 * Full workspace for animation preparation.
 * Features:
 * - Device selector (Mobile 360x800, Tablet 800x1280)
 * - Selectable/resizable image with professional handles
 * - FREE resize from any corner/edge
 * - Single image with mask overlay (50% outside, 100% inside frame)
 * - Balloon overlay (READ-ONLY from store, local positioning for staging)
 * 
 * IMPORTANT: Balloons here reflect changes from Translation/Edit menus.
 * The workspace only handles LOCAL POSITIONING for mobile staging.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Move, Minimize2, Maximize2, Smartphone, Tablet, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { Balloon, Panel } from '@shared/types';

// Device configurations
const DEVICES = {
    mobile: {
        name: 'Mobile',
        width: 180,
        height: 400,
        realWidth: 360,
        realHeight: 800,
        borderRadius: '1.5rem',
        hasNotch: false,
        icon: Smartphone
    },
    tablet: {
        name: 'Tablet',
        width: 320,
        height: 512,
        realWidth: 800,
        realHeight: 1280,
        borderRadius: '1rem',
        hasNotch: false,
        icon: Tablet
    }
} as const;

type DeviceType = keyof typeof DEVICES;

interface AnimationWorkspaceProps {
    currentImage: string | null;
    currentIndex: number;
    totalPanels: number;
    currentPanel: Panel | null;
    balloons: Balloon[];
    onPrevious: () => void;
    onNext: () => void;
}

// Local staging offset - position/scale adjustments that stay in workspace only
interface BalloonStageOffset {
    posX: number;
    posY: number;
    scale: number;  // 1.0 = original size
}

export const AnimationWorkspace: React.FC<AnimationWorkspaceProps> = ({
    currentImage,
    currentIndex,
    totalPanels,
    currentPanel,
    balloons,
}) => {
    const STORAGE_KEY = 'animation-workspace-settings';

    const loadSettings = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch { /* ignore */ }
        return null;
    };

    const savedSettings = loadSettings();

    const [selectedDevice, setSelectedDevice] = useState<DeviceType>(savedSettings?.device || 'mobile');
    const device = DEVICES[selectedDevice];

    const [position, setPosition] = useState(savedSettings?.position || { x: 300, y: 60 });
    const [size, setSize] = useState(savedSettings?.size || { width: 650, height: 750 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(savedSettings?.minimized || false);
    const [zoom, setZoom] = useState(savedSettings?.zoom || 2.0); // 2.0 = 100% display

    // Image transform state - FREE bounds (x, y, width, height)
    const [imageSelected, setImageSelected] = useState(false);
    const [imageBounds, setImageBounds] = useState(savedSettings?.imageBounds || { x: -100, y: -150, width: 200, height: 300 });
    const [isImageDragging, setIsImageDragging] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);

    // Balloon state - LOCAL ONLY (read-only from store, just positioning for staging)
    const [showBalloons, setShowBalloons] = useState(true);
    const [selectedBalloonId, setSelectedBalloonId] = useState<string | null>(null);
    const [stageOffsets, setStageOffsets] = useState<Record<string, BalloonStageOffset>>({});
    const [isBalloonDragging, setIsBalloonDragging] = useState(false);
    const [isBalloonScaling, setIsBalloonScaling] = useState(false);

    // Refs for manipulation
    const balloonDragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
    const balloonScaleStart = useRef({ x: 0, y: 0, scale: 1 });

    // History for undo
    const [history, setHistory] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ width: 0, height: 0, x: 0, y: 0 });
    const imageDragStart = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });
    const imageResizeStart = useRef({ bounds: { x: 0, y: 0, width: 0, height: 0 }, mouseX: 0, mouseY: 0 });

    const frameWidth = device.width;
    const frameHeight = device.height;

    // Get balloons that are within the current panel bounds
    const panelBalloons = useMemo(() => {
        if (!currentPanel || !balloons.length) return [];

        const panelBox = currentPanel.box_2d;
        if (!panelBox || panelBox.length < 4) return [];

        const [pTop, pLeft, pBottom, pRight] = panelBox;

        return balloons.filter(balloon => {
            const bBox = balloon.box_2d;
            if (!bBox || bBox.length < 4) return false;

            const [bTop, bLeft, bBottom, bRight] = bBox;
            const bCenterX = (bLeft + bRight) / 2;
            const bCenterY = (bTop + bBottom) / 2;

            return bCenterX >= pLeft && bCenterX <= pRight && bCenterY >= pTop && bCenterY <= pBottom;
        });
    }, [currentPanel, balloons]);

    // Load natural image size on image change
    useEffect(() => {
        if (currentImage) {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(frameWidth / img.width, frameHeight / img.height) * 0.8;
                const w = img.width * scale;
                const h = img.height * scale;
                setImageBounds({ x: -w / 2, y: -h / 2, width: w, height: h });
            };
            img.src = currentImage;
        }
    }, [currentImage, frameWidth, frameHeight]);

    // Save settings
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            position, size, device: selectedDevice, minimized: isMinimized, zoom, imageBounds
        }));
    }, [position, size, selectedDevice, isMinimized, zoom, imageBounds]);

    // Workspace zoom handler - use native listener to avoid passive event issues
    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom((prev: number) => Math.min(8.0, Math.max(0.2, prev + delta))); // 0.2-8.0 = 10%-400%
        };

        content.addEventListener('wheel', handleWheel, { passive: false });
        return () => content.removeEventListener('wheel', handleWheel);
    }, []);

    // Workspace drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            e.preventDefault();
            setIsDragging(true);
            dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
    }, [position]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
        }
        if (isResizing) {
            const deltaX = e.clientX - resizeStart.current.x;
            const deltaY = e.clientY - resizeStart.current.y;
            setSize({
                width: Math.max(500, resizeStart.current.width + deltaX),
                height: Math.max(600, resizeStart.current.height + deltaY)
            });
        }
        if (isImageDragging) {
            const deltaX = (e.clientX - imageDragStart.current.x) / zoom;
            const deltaY = (e.clientY - imageDragStart.current.y) / zoom;
            setImageBounds((prev: { x: number; y: number; width: number; height: number }) => ({
                ...prev,
                x: imageDragStart.current.imgX + deltaX,
                y: imageDragStart.current.imgY + deltaY
            }));
        }
        if (resizeHandle) {
            const deltaX = (e.clientX - imageResizeStart.current.mouseX) / zoom;
            const deltaY = (e.clientY - imageResizeStart.current.mouseY) / zoom;
            const start = imageResizeStart.current.bounds;
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

        // Balloon dragging (LOCAL OFFSET ONLY)
        if (isBalloonDragging && selectedBalloonId) {
            const deltaX = (e.clientX - balloonDragStart.current.x) / zoom;
            const deltaY = (e.clientY - balloonDragStart.current.y) / zoom;
            setStageOffsets(prev => ({
                ...prev,
                [selectedBalloonId]: {
                    ...(prev[selectedBalloonId] || { posX: 0, posY: 0, scale: 1 }),
                    posX: balloonDragStart.current.offsetX + deltaX,
                    posY: balloonDragStart.current.offsetY + deltaY
                }
            }));
        }

        // Balloon scaling (LOCAL ONLY - for staging preview)
        if (isBalloonScaling && selectedBalloonId) {
            const deltaX = (e.clientX - balloonScaleStart.current.x) / zoom;
            const deltaY = (e.clientY - balloonScaleStart.current.y) / zoom;
            const delta = (deltaX + deltaY) / 100;
            const newScale = Math.max(0.3, Math.min(3, balloonScaleStart.current.scale + delta));
            setStageOffsets(prev => ({
                ...prev,
                [selectedBalloonId]: {
                    ...(prev[selectedBalloonId] || { posX: 0, posY: 0, scale: 1 }),
                    scale: newScale
                }
            }));
        }
    }, [isDragging, isResizing, isImageDragging, resizeHandle, zoom, isBalloonDragging, isBalloonScaling, selectedBalloonId]);

    const handleMouseUp = useCallback(() => {
        if (isImageDragging || resizeHandle) {
            setHistory(prev => [...prev.slice(-19), imageResizeStart.current.bounds]);
        }
        setIsDragging(false);
        setIsResizing(false);
        setIsImageDragging(false);
        setResizeHandle(null);
        setIsBalloonDragging(false);
        setIsBalloonScaling(false);
    }, [isImageDragging, resizeHandle]);

    // Undo handler (CMD/CTRL+Z)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (history.length > 0) {
                    const lastState = history[history.length - 1];
                    setHistory(prev => prev.slice(0, -1));
                    setImageBounds(lastState);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history]);

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        resizeStart.current = { width: size.width, height: size.height, x: e.clientX, y: e.clientY };
    };

    // Image handlers
    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageSelected(true);
        setSelectedBalloonId(null);
    };

    const handleImageDragStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsImageDragging(true);
        imageDragStart.current = { x: e.clientX, y: e.clientY, imgX: imageBounds.x, imgY: imageBounds.y };
    };

    const handleImageResizeStart = (handle: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setResizeHandle(handle);
        imageResizeStart.current = { bounds: { ...imageBounds }, mouseX: e.clientX, mouseY: e.clientY };
    };

    const handleWorkspaceClick = () => {
        setImageSelected(false);
        setSelectedBalloonId(null);
    };

    // Balloon handlers
    const handleBalloonClick = (balloonId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedBalloonId(balloonId);
        setImageSelected(false);
        if (!stageOffsets[balloonId]) {
            setStageOffsets(prev => ({
                ...prev,
                [balloonId]: { posX: 0, posY: 0, scale: 1 }
            }));
        }
    };

    const handleBalloonDragStart = (balloonId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsBalloonDragging(true);
        const offset = stageOffsets[balloonId] || { posX: 0, posY: 0, scale: 1 };
        balloonDragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.posX, offsetY: offset.posY };
    };

    const handleBalloonScaleStart = (balloonId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsBalloonScaling(true);
        const offset = stageOffsets[balloonId] || { posX: 0, posY: 0, scale: 1 };
        balloonScaleStart.current = { x: e.clientX, y: e.clientY, scale: offset.scale };
    };

    useEffect(() => {
        if (isDragging || isResizing || isImageDragging || resizeHandle || isBalloonDragging || isBalloonScaling) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, isImageDragging, resizeHandle, isBalloonDragging, isBalloonScaling, handleMouseMove, handleMouseUp]);

    // Calculate balloon render data using FRACTIONAL positioning
    // Balloon coordinates are relative to the DOCUMENT, we position them relative to the PANEL
    const getBalloonRenderData = (balloon: Balloon) => {
        if (!currentPanel) return null;

        // Get panel bounds in document coordinates
        const [pTop, pLeft, pBottom, pRight] = currentPanel.box_2d;
        const panelWidth = pRight - pLeft;
        const panelHeight = pBottom - pTop;

        // Get balloon bounds in document coordinates
        const [bTop, bLeft, bBottom, bRight] = balloon.box_2d;

        // Calculate balloon's position and size as FRACTIONS of the panel (0 to 1)
        const fracLeft = (bLeft - pLeft) / panelWidth;
        const fracTop = (bTop - pTop) / panelHeight;
        const fracWidth = (bRight - bLeft) / panelWidth;
        const fracHeight = (bBottom - bTop) / panelHeight;

        const offset = stageOffsets[balloon.id] || { posX: 0, posY: 0, scale: 1 };

        // Calculate actual display dimensions based on imageBounds
        const displayWidth = imageBounds.width * fracWidth * offset.scale;
        const displayHeight = imageBounds.height * fracHeight * offset.scale;

        // Calculate position relative to imageBounds
        const displayLeft = imageBounds.x + (imageBounds.width * fracLeft) + offset.posX;
        const displayTop = imageBounds.y + (imageBounds.height * fracTop) + offset.posY;

        // TEXT SCALING: Calculate scale factor to shrink text proportionally
        // Original balloon height in document coordinates
        const originalBalloonHeight = bBottom - bTop;
        // Scale factor = displayed height / original height
        const textScale = displayHeight / originalBalloonHeight;
        // Clamp to prevent extreme scaling
        const finalTextScale = Math.max(0.08, Math.min(1, textScale));

        // Border: Very thin, proportional to balloon size
        const finalBorderWidth = Math.max(0.5, Math.min(1.2, displayHeight * 0.015));

        // Border radius: 12% of smaller dimension
        const minDim = Math.min(displayWidth, displayHeight);
        const finalBorderRadius = Math.max(2, minDim * 0.12);

        return {
            left: displayLeft,
            top: displayTop,
            width: displayWidth,
            height: displayHeight,
            textScale: finalTextScale,
            borderWidth: finalBorderWidth,
            borderRadius: finalBorderRadius
        };
    };

    return createPortal(
        <div
            ref={containerRef}
            className="fixed z-[1000] select-none"
            style={{ left: position.x, top: position.y, width: isMinimized ? 280 : size.width }}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div className="drag-handle flex items-center justify-between bg-zinc-900 rounded-t-xl px-4 py-2.5 cursor-move border border-zinc-700 border-b-0">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                    <Move size={14} />
                    <span className="font-medium">Workspace de Animação</span>
                    {totalPanels > 0 && <span className="text-zinc-600">• Quadro {currentIndex + 1}/{totalPanels}</span>}
                </div>
                <div className="flex items-center gap-1">
                    {/* Balloon Toggle */}
                    <button
                        onClick={() => setShowBalloons(!showBalloons)}
                        className={`p-1.5 rounded transition-colors ${showBalloons ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`}
                        title={showBalloons ? 'Ocultar balões' : 'Mostrar balões'}
                    >
                        {showBalloons ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-zinc-800 rounded transition-colors">
                        {isMinimized ? <Maximize2 size={14} className="text-zinc-400" /> : <Minimize2 size={14} className="text-zinc-400" />}
                    </button>
                </div>
            </div>

            {/* Device Selector */}
            {!isMinimized && (
                <div className="flex items-center justify-center gap-2 border-x border-zinc-700 px-4 py-2" style={{ backgroundColor: '#1f1f23' }}>
                    {(Object.keys(DEVICES) as DeviceType[]).map((deviceKey) => {
                        const d = DEVICES[deviceKey];
                        const Icon = d.icon;
                        const isSelected = selectedDevice === deviceKey;
                        return (
                            <button
                                key={deviceKey}
                                onClick={() => setSelectedDevice(deviceKey)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                                    }`}
                            >
                                <Icon size={14} />
                                <span>{d.name}</span>
                                <span className="text-[10px] opacity-70">{d.realWidth}×{d.realHeight}</span>
                            </button>
                        );
                    })}

                    {panelBalloons.length > 0 && (
                        <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-400">
                            <MessageCircle size={10} />
                            <span>{panelBalloons.length}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Workspace Content */}
            {!isMinimized && (
                <div
                    ref={contentRef}
                    className="relative bg-zinc-900 rounded-b-xl border border-zinc-700 border-t-0 overflow-hidden"
                    style={{ height: size.height }}
                    onClick={handleWorkspaceClick}
                >
                    {/* Zoom indicator */}
                    <div className="absolute top-2 right-2 z-10 bg-zinc-800/80 px-2 py-1 rounded text-[10px] text-zinc-400">
                        {Math.round((zoom / 2) * 100)}%
                    </div>

                    {/* Zoomable content */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `scale(${zoom})` }}>

                        {/* Main image */}
                        {currentImage && (
                            <img
                                src={currentImage}
                                alt={`Panel ${currentIndex + 1}`}
                                className="absolute object-fill pointer-events-none"
                                draggable={false}
                                style={{
                                    left: `calc(50% + ${imageBounds.x}px)`,
                                    top: `calc(50% + ${imageBounds.y}px)`,
                                    width: imageBounds.width,
                                    height: imageBounds.height
                                }}
                            />
                        )}

                        {/* Balloons overlay - READ-ONLY from store, local positioning only */}
                        {showBalloons && currentImage && panelBalloons.map(balloon => {
                            const renderData = getBalloonRenderData(balloon);
                            if (!renderData) return null;
                            const isSelected = selectedBalloonId === balloon.id;

                            // Determine shape-based border radius
                            let borderRadius: string | number = renderData.borderRadius;
                            if (balloon.shape === 'ellipse' || balloon.type === 'balloon-circle') {
                                borderRadius = '50%';
                            }

                            return (
                                <div
                                    key={balloon.id}
                                    className="absolute"
                                    style={{
                                        left: `calc(50% + ${renderData.left}px)`,
                                        top: `calc(50% + ${renderData.top}px)`,
                                        width: renderData.width,
                                        height: renderData.height,
                                        backgroundColor: balloon.color || '#ffffff',
                                        borderRadius: borderRadius,
                                        border: isSelected
                                            ? `2px solid #3b82f6`
                                            : `${renderData.borderWidth}px solid ${balloon.borderColor || '#000000'}`,
                                        overflow: 'hidden',
                                        cursor: isSelected ? 'move' : 'pointer',
                                        boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
                                        zIndex: isSelected ? 10 : 1,
                                        // Use position relative for text positioning
                                        position: 'relative'
                                    }}
                                    onClick={handleBalloonClick(balloon.id)}
                                    onMouseDown={isSelected ? handleBalloonDragStart(balloon.id) : undefined}
                                >
                                    {/* Text wrapper - positioned absolutely to allow overflow before clipping */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: `translate(-50%, -50%) scale(${renderData.textScale})`,
                                            // Use ORIGINAL balloon dimensions
                                            width: balloon.textWidth || (balloon.box_2d[3] - balloon.box_2d[1]),
                                            height: balloon.textHeight || (balloon.box_2d[2] - balloon.box_2d[0]),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: `${Math.round((balloon.box_2d[2] - balloon.box_2d[0]) * 0.05)}px`,
                                            fontSize: `${balloon.fontSize || 11}px`,
                                            lineHeight: balloon.lineHeight || 1.2,
                                            color: balloon.textColor || '#000000',
                                            fontFamily: balloon.fontFamily || 'Comic Neue, Arial, sans-serif',
                                            fontWeight: balloon.fontStyle?.includes('bold') ? 'bold' : 'normal',
                                            fontStyle: balloon.fontStyle?.includes('italic') ? 'italic' : 'normal',
                                            textAlign: (balloon.textAlign as React.CSSProperties['textAlign']) || 'center',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {balloon.text || '...'}
                                    </div>

                                    {/* Scale handle for selected balloon */}
                                    {isSelected && (
                                        <div
                                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-sm cursor-se-resize shadow-sm"
                                            style={{ zIndex: 20 }}
                                            onMouseDown={handleBalloonScaleStart(balloon.id)}
                                            title="Redimensionar balão (staging)"
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Dark mask overlay */}
                        <div
                            className="absolute pointer-events-none"
                            style={{
                                inset: '-200%',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                clipPath: `polygon(
                                    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                                    calc(50% - ${frameWidth / 2 - 8}px) calc(50% - ${frameHeight / 2 - 8}px),
                                    calc(50% - ${frameWidth / 2 - 8}px) calc(50% + ${frameHeight / 2 - 8}px),
                                    calc(50% + ${frameWidth / 2 - 8}px) calc(50% + ${frameHeight / 2 - 8}px),
                                    calc(50% + ${frameWidth / 2 - 8}px) calc(50% - ${frameHeight / 2 - 8}px),
                                    calc(50% - ${frameWidth / 2 - 8}px) calc(50% - ${frameHeight / 2 - 8}px)
                                )`
                            }}
                        />

                        {/* Device Border */}
                        <div
                            className="absolute border-4 border-zinc-500/50 pointer-events-none"
                            style={{ width: frameWidth, height: frameHeight, borderRadius: device.borderRadius }}
                        >
                            <div className="absolute inset-2 border border-zinc-600/30" style={{ borderRadius: `calc(${device.borderRadius} - 0.5rem)` }} />
                        </div>

                        {/* Selection area - fits exactly to image bounds */}
                        {currentImage && (
                            <div
                                className="absolute cursor-move"
                                style={{
                                    left: `calc(50% + ${imageBounds.x}px)`,
                                    top: `calc(50% + ${imageBounds.y}px)`,
                                    width: imageBounds.width,
                                    height: imageBounds.height
                                }}
                                onClick={handleImageClick}
                                onMouseDown={imageSelected ? handleImageDragStart : undefined}
                            >
                                {imageSelected && (
                                    <>
                                        <div className="absolute inset-0 border border-blue-400 pointer-events-none" />

                                        {/* Corner handles */}
                                        <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-nw-resize" onMouseDown={handleImageResizeStart('nw')} />
                                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-ne-resize" onMouseDown={handleImageResizeStart('ne')} />
                                        <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-sw-resize" onMouseDown={handleImageResizeStart('sw')} />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-se-resize" onMouseDown={handleImageResizeStart('se')} />

                                        {/* Edge handles */}
                                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-n-resize" onMouseDown={handleImageResizeStart('n')} />
                                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-s-resize" onMouseDown={handleImageResizeStart('s')} />
                                        <div className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-w-resize" onMouseDown={handleImageResizeStart('w')} />
                                        <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-e-resize" onMouseDown={handleImageResizeStart('e')} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Empty state */}
                        {!currentImage && (
                            <div className="absolute flex items-center justify-center pointer-events-none" style={{ width: frameWidth, height: frameHeight }}>
                                <div className="text-zinc-500 text-center px-4">
                                    <p className="text-[10px] font-medium mb-0.5">Nenhum quadro</p>
                                    <p className="text-[8px]">Detecte no Vetorizar</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resize Handle */}
                    <div className="absolute bottom-2 right-2 w-5 h-5 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity" onMouseDown={handleResizeStart}>
                        <svg viewBox="0 0 24 24" className="w-full h-full text-zinc-500">
                            <path fill="currentColor" d="M22 22H20V20H22V22M22 18H20V16H22V18M18 22H16V20H18V22M18 18H16V16H18V18M14 22H12V20H14V22M22 14H20V12H22V14Z" />
                        </svg>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
