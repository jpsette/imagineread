/**
 * PageViewer Component
 * 
 * Renders a page image with SVG balloon overlay.
 * Manages sequential balloon animation timing.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Balloon, Panel } from '@shared/types';
import { BalloonShape } from './BalloonShape';

interface PageViewerProps {
    imageUrl: string | null;
    balloons: Balloon[];
    currentPanel: Panel | null;
    autoPlay: boolean;
    /** Key to trigger animation reset */
    animationKey: number;
}

export const PageViewer: React.FC<PageViewerProps> = ({
    imageUrl,
    balloons,
    currentPanel,
    autoPlay,
    animationKey,
}) => {
    const [visibleBalloons, setVisibleBalloons] = useState<Set<string>>(new Set());
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Filter balloons that belong to current panel
    const panelBalloons = React.useMemo(() => {
        if (!currentPanel || !balloons.length) return balloons;

        const [pTop, pLeft, pBottom, pRight] = currentPanel.box_2d;

        return balloons.filter(balloon => {
            const [bTop, bLeft, bBottom, bRight] = balloon.box_2d;
            const bCenterX = (bLeft + bRight) / 2;
            const bCenterY = (bTop + bBottom) / 2;
            return bCenterX >= pLeft && bCenterX <= pRight && bCenterY >= pTop && bCenterY <= pBottom;
        });
    }, [currentPanel, balloons]);

    // Note: SVG viewBox handles scaling automatically

    // Update container size
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            setContainerSize({
                width: container.clientWidth,
                height: container.clientHeight,
            });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Load image dimensions
    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.onload = () => {
            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Animate balloons sequentially
    useEffect(() => {
        // Reset on animation key change
        setVisibleBalloons(new Set());

        if (!autoPlay || panelBalloons.length === 0) return;

        const timeouts: NodeJS.Timeout[] = [];

        panelBalloons.forEach((balloon, index) => {
            const animDelay = balloon.animationDelay;
            const delaySeconds = typeof animDelay === 'number' ? animDelay : index * 0.3;
            const delay = delaySeconds * 1000;
            const timeout = setTimeout(() => {
                setVisibleBalloons(prev => new Set([...prev, balloon.id]));
            }, delay);
            timeouts.push(timeout);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [panelBalloons, autoPlay, animationKey]);

    if (!imageUrl) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                No image
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden">
            {/* Page Image */}
            <img
                src={imageUrl}
                alt="Comic page"
                className="w-full h-full object-contain"
                draggable={false}
            />

            {/* SVG Balloon Overlay */}
            {imageSize.width > 0 && containerSize.width > 0 && (
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {panelBalloons.map(balloon => (
                        <BalloonShape
                            key={balloon.id}
                            balloon={balloon}
                            isVisible={visibleBalloons.has(balloon.id)}
                            scale={1} // SVG viewBox handles scaling
                        />
                    ))}
                </svg>
            )}
        </div>
    );
};
