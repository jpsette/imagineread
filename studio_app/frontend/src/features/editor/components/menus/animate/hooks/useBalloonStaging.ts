/**
 * useBalloonStaging
 * 
 * Custom hook to manage balloon staging state and handlers.
 * Handles local positioning for mobile preview - READ-ONLY from store.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { Balloon, Panel } from '@shared/types';

export interface BalloonStageOffset {
    posX: number;
    posY: number;
    scale: number;
}

interface UseBalloonStagingOptions {
    balloons: Balloon[];
    currentPanel: Panel | null;
    zoom: number;
}

interface UseBalloonStagingReturn {
    // Derived data
    panelBalloons: Balloon[];

    // State
    showBalloons: boolean;
    setShowBalloons: React.Dispatch<React.SetStateAction<boolean>>;
    selectedBalloonId: string | null;
    setSelectedBalloonId: React.Dispatch<React.SetStateAction<string | null>>;
    stageOffsets: Record<string, BalloonStageOffset>;
    isBalloonDragging: boolean;
    isBalloonScaling: boolean;

    // Handlers
    handleBalloonClick: (balloonId: string) => (e: React.MouseEvent) => void;
    handleBalloonDragStart: (balloonId: string) => (e: React.MouseEvent) => void;
    handleBalloonScaleStart: (balloonId: string) => (e: React.MouseEvent) => void;
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseUp: () => void;

    // Utility
    getStageOffset: (balloonId: string) => BalloonStageOffset;
}

export function useBalloonStaging({
    balloons,
    currentPanel,
    zoom
}: UseBalloonStagingOptions): UseBalloonStagingReturn {
    // State
    const [showBalloons, setShowBalloons] = useState(true);
    const [selectedBalloonId, setSelectedBalloonId] = useState<string | null>(null);
    const [stageOffsets, setStageOffsets] = useState<Record<string, BalloonStageOffset>>({});
    const [isBalloonDragging, setIsBalloonDragging] = useState(false);
    const [isBalloonScaling, setIsBalloonScaling] = useState(false);

    // Refs
    const balloonDragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
    const balloonScaleStart = useRef({ x: 0, y: 0, scale: 1 });

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

    // Handlers
    const handleBalloonClick = useCallback((balloonId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedBalloonId(balloonId);
        if (!stageOffsets[balloonId]) {
            setStageOffsets(prev => ({
                ...prev,
                [balloonId]: { posX: 0, posY: 0, scale: 1 }
            }));
        }
    }, [stageOffsets]);

    const handleBalloonDragStart = useCallback((balloonId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsBalloonDragging(true);
        const offset = stageOffsets[balloonId] || { posX: 0, posY: 0, scale: 1 };
        balloonDragStart.current = {
            x: e.clientX,
            y: e.clientY,
            offsetX: offset.posX,
            offsetY: offset.posY
        };
    }, [stageOffsets]);

    const handleBalloonScaleStart = useCallback((balloonId: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsBalloonScaling(true);
        const offset = stageOffsets[balloonId] || { posX: 0, posY: 0, scale: 1 };
        balloonScaleStart.current = { x: e.clientX, y: e.clientY, scale: offset.scale };
    }, [stageOffsets]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
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
    }, [isBalloonDragging, isBalloonScaling, selectedBalloonId, zoom]);

    const handleMouseUp = useCallback(() => {
        setIsBalloonDragging(false);
        setIsBalloonScaling(false);
    }, []);

    const getStageOffset = useCallback((balloonId: string): BalloonStageOffset => {
        return stageOffsets[balloonId] || { posX: 0, posY: 0, scale: 1 };
    }, [stageOffsets]);

    return {
        panelBalloons,
        showBalloons,
        setShowBalloons,
        selectedBalloonId,
        setSelectedBalloonId,
        stageOffsets,
        isBalloonDragging,
        isBalloonScaling,
        handleBalloonClick,
        handleBalloonDragStart,
        handleBalloonScaleStart,
        handleMouseMove,
        handleMouseUp,
        getStageOffset
    };
}
