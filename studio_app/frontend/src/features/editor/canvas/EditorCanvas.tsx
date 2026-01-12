import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';
import { CanvasItem } from './CanvasItem';
import { Balloon } from '../../../types';

interface EditorCanvasProps {
    imageUrl: string;
    balloons?: Balloon[];
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
    onUpdate?: (id: string, attrs: Partial<Balloon>) => void;
}

// Background Component that receives the image object
const BackgroundImage = ({ image }: { image: HTMLImageElement | undefined }) => {
    return (
        <KonvaImage
            image={image}
            perfectDrawEnabled={false} // Performance optimization
            listening={false} // Ensure it doesn't capture events
        />
    );
};

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
    imageUrl,
    balloons = [],
    selectedId = null,
    onSelect = () => { },
    onUpdate = () => { }
}) => {
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null); // To measure available space

    // Load image at parent level to calculate dimensions
    const [image, status] = useImage(imageUrl);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hasFitted, setHasFitted] = useState(false); // Prevent re-fitting on every render

    // AUTO-FIT LOGIC
    useEffect(() => {
        if (status === 'loaded' && image && containerRef.current && !hasFitted) {
            const container = containerRef.current;
            const containerWidth = container.offsetWidth;
            const containerHeight = container.offsetHeight;

            // Calculate ratios
            const scaleX = containerWidth / image.width;
            const scaleY = containerHeight / image.height;

            // Use the smaller scale to fit entirely, with 5% padding
            const newScale = Math.min(scaleX, scaleY) * 0.95;

            // Calculate center position
            const newX = (containerWidth - image.width * newScale) / 2;
            const newY = (containerHeight - image.height * newScale) / 2;

            console.log("Auto-fitting image:", { containerWidth, containerHeight, imgW: image.width, imgH: image.height, newScale });

            setScale(newScale);
            setPosition({ x: newX, y: newY });
            setHasFitted(true);
        }
    }, [image, status, hasFitted]);

    // Reset fit if URL changes
    useEffect(() => {
        setHasFitted(false);
    }, [imageUrl]);

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(0.1, Math.min(newScale, 10));

        setPosition({
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        });
        setScale(clampedScale);
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            onSelect(null);
        }
    };

    return (
        <div ref={containerRef} className="w-full h-full bg-[#18181b] overflow-hidden">
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                draggable
                ref={stageRef}
                className="cursor-move"
            >
                {/* LAYER 1: STATIC BACKGROUND (Heavy Image) */}
                <Layer listening={false} id="background-layer">
                    <BackgroundImage image={image} />
                </Layer>

                {/* LAYER 2: INTERACTIVE (Lightweight Balloons) */}
                <Layer id="interaction-layer">
                    {balloons.map((balloon) => (
                        <CanvasItem
                            key={balloon.id}
                            item={balloon}
                            isSelected={selectedId === balloon.id}
                            onSelect={() => onSelect(balloon.id)}
                            onChange={(attrs) => onUpdate(balloon.id, attrs)}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};
