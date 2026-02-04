/**
 * AnimationWorkspace
 * 
 * Full workspace for animation preparation.
 * 
 * REFACTORED: Uses extracted hooks and memoized components for better performance.
 * 
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

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Balloon, Panel } from '@shared/types';

// Extracted hooks
import { useImageTransform, useBalloonStaging, useWorkspaceWindow } from './hooks';

// Extracted components
import { WorkspaceHeader, DeviceSelector, BalloonOverlayItem, DEVICES, DeviceType } from './components';

interface AnimationWorkspaceProps {
    currentImage: string | null;
    currentIndex: number;
    totalPanels: number;
    currentPanel: Panel | null;
    balloons: Balloon[];
    onPrevious: () => void;
    onNext: () => void;
}

export const AnimationWorkspace: React.FC<AnimationWorkspaceProps> = ({
    currentImage,
    currentIndex,
    totalPanels,
    currentPanel,
    balloons,
}) => {
    // Device state
    const [selectedDevice, setSelectedDevice] = useState<DeviceType>('mobile');
    const device = DEVICES[selectedDevice];

    const frameWidth = device.width;
    const frameHeight = device.height;

    // Window management hook
    const workspace = useWorkspaceWindow();

    // Image transform hook
    const imageTransform = useImageTransform({
        initialBounds: workspace.savedSettings?.imageBounds,
        zoom: workspace.zoom
    });

    // Balloon staging hook
    const balloonStaging = useBalloonStaging({
        balloons,
        currentPanel,
        zoom: workspace.zoom
    });

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Load natural image size on image change
    useEffect(() => {
        if (currentImage) {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(frameWidth / img.width, frameHeight / img.height) * 0.8;
                const w = img.width * scale;
                const h = img.height * scale;
                imageTransform.setImageBounds({ x: -w / 2, y: -h / 2, width: w, height: h });
            };
            img.src = currentImage;
        }
    }, [currentImage, frameWidth, frameHeight]);

    // Save settings including image bounds
    useEffect(() => {
        workspace.saveSettings({
            device: selectedDevice,
            imageBounds: imageTransform.imageBounds
        });
    }, [selectedDevice, imageTransform.imageBounds]);

    // Workspace zoom handler - use native listener to avoid passive event issues
    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            workspace.setZoom((prev: number) => Math.min(8.0, Math.max(0.2, prev + delta)));
        };

        content.addEventListener('wheel', handleWheel, { passive: false });
        return () => content.removeEventListener('wheel', handleWheel);
    }, [workspace.setZoom]);

    // Combined mouse move handler
    const handleMouseMove = useCallback((e: MouseEvent) => {
        workspace.handleMouseMove(e);
        imageTransform.handleMouseMove(e);
        balloonStaging.handleMouseMove(e);
    }, [workspace.handleMouseMove, imageTransform.handleMouseMove, balloonStaging.handleMouseMove]);

    // Combined mouse up handler
    const handleMouseUp = useCallback(() => {
        workspace.handleMouseUp();
        imageTransform.handleMouseUp();
        balloonStaging.handleMouseUp();
    }, [workspace.handleMouseUp, imageTransform.handleMouseUp, balloonStaging.handleMouseUp]);

    // Undo handler (CMD/CTRL+Z)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                imageTransform.undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [imageTransform.undo]);

    // Attach global mouse handlers when any dragging/resizing is active
    const isAnyDragging = workspace.isDragging || workspace.isResizing ||
        imageTransform.isImageDragging || imageTransform.resizeHandle ||
        balloonStaging.isBalloonDragging || balloonStaging.isBalloonScaling;

    useEffect(() => {
        if (isAnyDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isAnyDragging, handleMouseMove, handleMouseUp]);

    // Workspace click handler
    const handleWorkspaceClick = useCallback(() => {
        imageTransform.setImageSelected(false);
        balloonStaging.setSelectedBalloonId(null);
    }, [imageTransform.setImageSelected, balloonStaging.setSelectedBalloonId]);

    // Image click handler (deselect balloon)
    const handleImageClick = useCallback((e: React.MouseEvent) => {
        imageTransform.handleImageClick(e);
        balloonStaging.setSelectedBalloonId(null);
    }, [imageTransform.handleImageClick, balloonStaging.setSelectedBalloonId]);

    // Calculate balloon render data using FRACTIONAL positioning
    const getBalloonRenderData = useCallback((balloon: Balloon) => {
        if (!currentPanel) return null;

        const [pTop, pLeft, pBottom, pRight] = currentPanel.box_2d;
        const panelWidth = pRight - pLeft;
        const panelHeight = pBottom - pTop;

        const [bTop, bLeft, bBottom, bRight] = balloon.box_2d;

        const fracLeft = (bLeft - pLeft) / panelWidth;
        const fracTop = (bTop - pTop) / panelHeight;
        const fracWidth = (bRight - bLeft) / panelWidth;
        const fracHeight = (bBottom - bTop) / panelHeight;

        const offset = balloonStaging.getStageOffset(balloon.id);
        const ib = imageTransform.imageBounds;

        const displayWidth = ib.width * fracWidth * offset.scale;
        const displayHeight = ib.height * fracHeight * offset.scale;
        const displayLeft = ib.x + (ib.width * fracLeft) + offset.posX;
        const displayTop = ib.y + (ib.height * fracTop) + offset.posY;

        const originalBalloonHeight = bBottom - bTop;
        const textScale = Math.max(0.08, Math.min(1, displayHeight / originalBalloonHeight));
        const borderWidth = Math.max(0.5, Math.min(1.2, displayHeight * 0.015));
        const minDim = Math.min(displayWidth, displayHeight);
        const borderRadius = Math.max(2, minDim * 0.12);

        return {
            left: displayLeft,
            top: displayTop,
            width: displayWidth,
            height: displayHeight,
            textScale,
            borderWidth,
            borderRadius
        };
    }, [currentPanel, imageTransform.imageBounds, balloonStaging.getStageOffset]);

    return createPortal(
        <div
            ref={containerRef}
            className="fixed z-[1000] select-none"
            style={{ left: workspace.position.x, top: workspace.position.y, width: workspace.isMinimized ? 280 : workspace.size.width }}
            onMouseDown={workspace.handleMouseDown}
        >
            {/* Header */}
            <WorkspaceHeader
                currentIndex={currentIndex}
                totalPanels={totalPanels}
                showBalloons={balloonStaging.showBalloons}
                isMinimized={workspace.isMinimized}
                onToggleBalloons={() => balloonStaging.setShowBalloons(!balloonStaging.showBalloons)}
                onToggleMinimize={() => workspace.setIsMinimized(!workspace.isMinimized)}
            />

            {/* Device Selector */}
            {!workspace.isMinimized && (
                <DeviceSelector
                    selectedDevice={selectedDevice}
                    onDeviceChange={setSelectedDevice}
                    balloonCount={balloonStaging.panelBalloons.length}
                />
            )}

            {/* Workspace Content */}
            {!workspace.isMinimized && (
                <div
                    ref={contentRef}
                    className="relative bg-panel-bg rounded-b-xl border border-zinc-700 border-t-0 overflow-hidden"
                    style={{ height: workspace.size.height }}
                    onClick={handleWorkspaceClick}
                >
                    {/* Zoom indicator */}
                    <div className="absolute top-2 right-2 z-10 bg-surface/80 px-2 py-1 rounded text-[10px] text-text-secondary">
                        {Math.round((workspace.zoom / 2) * 100)}%
                    </div>

                    {/* Zoomable content */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `scale(${workspace.zoom})` }}>

                        {/* Main image */}
                        {currentImage && (
                            <img
                                src={currentImage}
                                alt={`Panel ${currentIndex + 1}`}
                                className="absolute object-fill pointer-events-none"
                                draggable={false}
                                style={{
                                    left: `calc(50% + ${imageTransform.imageBounds.x}px)`,
                                    top: `calc(50% + ${imageTransform.imageBounds.y}px)`,
                                    width: imageTransform.imageBounds.width,
                                    height: imageTransform.imageBounds.height
                                }}
                            />
                        )}

                        {/* Balloons overlay - now using memoized component */}
                        {balloonStaging.showBalloons && currentImage && balloonStaging.panelBalloons.map(balloon => {
                            const renderData = getBalloonRenderData(balloon);
                            if (!renderData) return null;
                            const isSelected = balloonStaging.selectedBalloonId === balloon.id;

                            return (
                                <BalloonOverlayItem
                                    key={balloon.id}
                                    balloon={balloon}
                                    renderData={renderData}
                                    isSelected={isSelected}
                                    onClick={balloonStaging.handleBalloonClick(balloon.id)}
                                    onDragStart={isSelected ? balloonStaging.handleBalloonDragStart(balloon.id) : undefined}
                                    onScaleStart={isSelected ? balloonStaging.handleBalloonScaleStart(balloon.id) : undefined}
                                />
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
                                    left: `calc(50% + ${imageTransform.imageBounds.x}px)`,
                                    top: `calc(50% + ${imageTransform.imageBounds.y}px)`,
                                    width: imageTransform.imageBounds.width,
                                    height: imageTransform.imageBounds.height
                                }}
                                onClick={handleImageClick}
                                onMouseDown={imageTransform.imageSelected ? imageTransform.handleImageDragStart : undefined}
                            >
                                {imageTransform.imageSelected && (
                                    <>
                                        <div className="absolute inset-0 border border-blue-400 pointer-events-none" />

                                        {/* Corner handles */}
                                        <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-nw-resize" onMouseDown={imageTransform.handleImageResizeStart('nw')} />
                                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-ne-resize" onMouseDown={imageTransform.handleImageResizeStart('ne')} />
                                        <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-sw-resize" onMouseDown={imageTransform.handleImageResizeStart('sw')} />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-white border border-blue-400 cursor-se-resize" onMouseDown={imageTransform.handleImageResizeStart('se')} />

                                        {/* Edge handles */}
                                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-n-resize" onMouseDown={imageTransform.handleImageResizeStart('n')} />
                                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-s-resize" onMouseDown={imageTransform.handleImageResizeStart('s')} />
                                        <div className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-w-resize" onMouseDown={imageTransform.handleImageResizeStart('w')} />
                                        <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white border border-blue-400 cursor-e-resize" onMouseDown={imageTransform.handleImageResizeStart('e')} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Empty state */}
                        {!currentImage && (
                            <div className="absolute flex items-center justify-center pointer-events-none" style={{ width: frameWidth, height: frameHeight }}>
                                <div className="text-text-muted text-center px-4">
                                    <p className="text-[10px] font-medium mb-0.5">Nenhum quadro</p>
                                    <p className="text-[8px]">Detecte no Vetorizar</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resize Handle */}
                    <div className="absolute bottom-2 right-2 w-5 h-5 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity" onMouseDown={workspace.handleResizeStart}>
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
