import { useState, useEffect, RefObject } from 'react';
import Konva from 'konva';

interface UseCanvasNavigationProps {
    stageRef: RefObject<Konva.Stage>;
    containerRef: RefObject<HTMLDivElement>;
    imgOriginal: HTMLImageElement | undefined;
    statusOriginal: string;
    onImageLoad?: (width: number, height: number) => void;
}

export const useCanvasNavigation = ({
    stageRef,
    containerRef,
    imgOriginal,
    statusOriginal,
    onImageLoad
}: UseCanvasNavigationProps) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hasFitted, setHasFitted] = useState(false);

    // Auto-Fit Logic
    useEffect(() => {
        if (statusOriginal === 'loaded' && imgOriginal && containerRef.current && !hasFitted) {
            const container = containerRef.current;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

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

            setScale(finalScale);
            setPosition({ x: finalX, y: finalY });
            setHasFitted(true);

            if (onImageLoad) {
                onImageLoad(imgOriginal.width, imgOriginal.height);
            }
        }
    }, [imgOriginal, statusOriginal, hasFitted, onImageLoad, containerRef]);

    // Zoom Logic
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const direction = e.evt.deltaY > 0 ? -1 : 1;
        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        if (newScale < 0.1 || newScale > 10) return;

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setScale(newScale);
        setPosition(newPos);
    };

    return { scale, position, handleWheel };
};
