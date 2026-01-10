import React, { useState, useRef, useMemo } from 'react';
import { Balloon } from '../../types';

interface VectorProps {
    balloon: Balloon;
    containerRef: React.RefObject<HTMLDivElement>;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Balloon>) => void;
    onCommit?: (label: string) => void;
    hidden?: boolean;
}

// --- GEOMETRY HELPERS ---

const getEllipticalPoint = (cx: number, cy: number, rx: number, ry: number, angle: number) => {
    // Basic parametric ellipse
    return {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle)
    };
};

const getRectPoint = (cx: number, cy: number, w: number, h: number, angle: number) => {
    // Raycasting against a rectangle
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const absCos = Math.abs(cos);
    const absSin = Math.abs(sin);

    let xMult = 1;
    let yMult = 1;

    // abs(sin)/abs(cos) > h/w  =>  abs(sin)*w > abs(cos)*h
    if (absSin * w > absCos * h) {
        // Hits Top/Bottom
        xMult = (h / 2) / absSin;
        yMult = (h / 2) / absSin;
    } else {
        // Hits Left/Right
        xMult = (w / 2) / absCos;
        yMult = (w / 2) / absCos;
    }

    return {
        x: cx + cos * xMult,
        y: cy + sin * yMult
    };
};

export const VectorBubble: React.FC<VectorProps> = React.memo(({
    balloon,
    containerRef,
    isSelected,
    onSelect,
    onUpdate,
    onCommit,
    hidden = false
}) => {
    // Refs for Dragging
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startBox = useRef(balloon.box_2d);

    // Refs for Resizing
    const isResizing = useRef(false);
    const isDraggingTail = useRef(false);
    const resizeHandle = useRef<string | null>(null);
    const startTail = useRef<{ x: number, y: number } | null>(null);

    // Local Editing State
    const [isEditing, setIsEditing] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const [ymin, xmin, ymax, xmax] = balloon.box_2d;
    const width = xmax - xmin;
    const height = ymax - ymin;

    // --- GEOMETRY CALCULATION ---
    const pathData = useMemo(() => {
        const cx = xmin + width / 2;
        const cy = ymin + height / 2;
        const rx = width / 2;
        const ry = height / 2;

        const tailTip = balloon.tailTip;
        const tailWidth = balloon.tailWidth ?? 40;
        const shape = balloon.shape;

        // 1. If no tail, just draw the shape
        if (!tailTip || balloon.type === 'thought') {
            if (shape === 'ellipse') {
                return `M ${xmin} ${cy} A ${rx} ${ry} 0 1 0 ${xmax} ${cy} A ${rx} ${ry} 0 1 0 ${xmin} ${cy} Z`;
            } else {
                // Rectangle
                const r = Math.min(balloon.borderRadius ?? 20, rx, ry);
                return `M ${xmin + r} ${ymin} 
                        H ${xmax - r} A ${r} ${r} 0 0 1 ${xmax} ${ymin + r} 
                        V ${ymax - r} A ${r} ${r} 0 0 1 ${xmax - r} ${ymax} 
                        H ${xmin + r} A ${r} ${r} 0 0 1 ${xmin} ${ymax - r} 
                        V ${ymin + r} A ${r} ${r} 0 0 1 ${xmin + r} ${ymin} Z`;
            }
        }

        // 2. HAS TAIL - UNIFIED PATH LOGIC
        // A. Calculate Angle to Tip
        const angle = Math.atan2(tailTip.y - cy, tailTip.x - cx);

        // B. Calculate Base Points
        let p1: { x: number, y: number };
        let p2: { x: number, y: number };

        if (shape === 'ellipse') {
            const avgR = (rx + ry) / 2;
            const delta = (tailWidth / 2) / avgR;
            p1 = getEllipticalPoint(cx, cy, rx, ry, angle - delta);
            p2 = getEllipticalPoint(cx, cy, rx, ry, angle + delta);

            // Draw long arc P2 -> P1, then to Tip, then close
            return `M ${p2.x} ${p2.y} 
                    A ${rx} ${ry} 0 1 1 ${p1.x} ${p1.y} 
                    L ${tailTip.x} ${tailTip.y} 
                    L ${p2.x} ${p2.y} Z`;
        }
        else {
            // RECTANGLE LOGIC
            const base = getRectPoint(cx, cy, width, height, angle);
            const r = Math.min(balloon.borderRadius ?? 20, rx, ry);
            const halfT = tailWidth / 2;

            // Flags
            const isTop = Math.abs(base.y - ymin) < 1;
            const isBottom = Math.abs(base.y - ymax) < 1;
            const isLeft = Math.abs(base.x - xmin) < 1;
            const isRight = Math.abs(base.x - xmax) < 1;

            let path = `M ${xmin + r} ${ymin}`; // Start after TL corner

            // TOP EDGE
            if (isTop) {
                const tx = Math.max(xmin + r, Math.min(xmax - r, base.x));
                const t1 = Math.max(xmin + r, tx - halfT);
                const t2 = Math.min(xmax - r, tx + halfT);
                path += ` L ${t1} ${ymin} L ${tailTip.x} ${tailTip.y} L ${t2} ${ymin}`;
            }
            path += ` L ${xmax - r} ${ymin}`; // Finish Top Edge
            path += ` A ${r} ${r} 0 0 1 ${xmax} ${ymin + r}`; // TR Corner

            // RIGHT EDGE
            if (isRight) {
                const ty = Math.max(ymin + r, Math.min(ymax - r, base.y));
                const t1 = Math.max(ymin + r, ty - halfT);
                const t2 = Math.min(ymax - r, ty + halfT);
                path += ` L ${xmax} ${t1} L ${tailTip.x} ${tailTip.y} L ${xmax} ${t2}`;
            }
            path += ` L ${xmax} ${ymax - r}`; // Finish Right Edge
            path += ` A ${r} ${r} 0 0 1 ${xmax - r} ${ymax}`; // BR Corner

            // BOTTOM EDGE
            if (isBottom) {
                const tx = Math.max(xmin + r, Math.min(xmax - r, base.x));
                const tRight = Math.min(xmax - r, tx + halfT);
                const tLeft = Math.max(xmin + r, tx - halfT);
                path += ` L ${tRight} ${ymax} L ${tailTip.x} ${tailTip.y} L ${tLeft} ${ymax}`;
            }
            path += ` L ${xmin + r} ${ymax}`; // Finish Bottom Edge
            path += ` A ${r} ${r} 0 0 1 ${xmin} ${ymax - r}`; // BL Corner

            // LEFT EDGE
            if (isLeft) {
                const ty = Math.max(ymin + r, Math.min(ymax - r, base.y));
                const tBottom = Math.min(ymax - r, ty + halfT);
                const tTop = Math.max(ymin + r, ty - halfT);
                path += ` L ${xmin} ${tBottom} L ${tailTip.x} ${tailTip.y} L ${xmin} ${tTop}`;
            }
            path += ` L ${xmin} ${ymin + r}`; // Finish Left Edge
            path += ` A ${r} ${r} 0 0 1 ${xmin + r} ${ymin}`; // TL Corner

            path += " Z";
            return path;
        }

    }, [balloon.box_2d, balloon.tailTip, balloon.tailWidth, balloon.shape, balloon.borderRadius, xmin, width, ymin, height]);


    // --- EVENT HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isSelected) {
            onSelect(balloon.id);
            setIsEditing(false);
        }
        e.stopPropagation();
        if (!containerRef.current) return;
        isDragging.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startBox.current = [...balloon.box_2d];
        bindEvents();
    };

    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation(); e.preventDefault();
        isResizing.current = true;
        resizeHandle.current = handle;
        startPos.current = { x: e.clientX, y: e.clientY };
        startBox.current = [...balloon.box_2d];
        bindEvents();
    };

    const handleTailStart = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        isDraggingTail.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startTail.current = balloon.tailTip ? { ...balloon.tailTip } : { x: 0, y: 0 };
        bindEvents();
    }

    const bindEvents = () => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = 1000 / rect.width;
        const scaleY = 1000 / rect.height;

        const deltaX = (e.clientX - startPos.current.x) * scaleX;
        const deltaY = (e.clientY - startPos.current.y) * scaleY;

        if (isDragging.current) {
            const [oy1, ox1, oy2, ox2] = startBox.current;
            onUpdate(balloon.id, { box_2d: [oy1 + deltaY, ox1 + deltaX, oy2 + deltaY, ox2 + deltaX] });
        }
        else if (isResizing.current) {
            let [y1, x1, y2, x2] = startBox.current;
            if (resizeHandle.current?.includes('n')) y1 += deltaY;
            if (resizeHandle.current?.includes('s')) y2 += deltaY;
            if (resizeHandle.current?.includes('w')) x1 += deltaX;
            if (resizeHandle.current?.includes('e')) x2 += deltaX;

            // Constraint: Min 20px
            if (y2 - y1 < 20) y2 = y1 + 20;
            if (x2 - x1 < 20) x2 = x1 + 20;

            onUpdate(balloon.id, { box_2d: [y1, x1, y2, x2] });
        }
        else if (isDraggingTail.current && startTail.current) {
            onUpdate(balloon.id, { tailTip: { x: startTail.current.x + deltaX, y: startTail.current.y + deltaY } });
        }
    };

    const handleMouseUp = () => {
        const wasDragging = isDragging.current;
        const wasResizing = isResizing.current;
        const wasTail = isDraggingTail.current;

        isDragging.current = false;
        isResizing.current = false;
        isDraggingTail.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Commit History on Drag End
        if (onCommit) {
            if (wasDragging) onCommit('Mover Balão');
            else if (wasResizing) onCommit('Redimensionar Balão');
            else if (wasTail) onCommit('Ajustar Rabinho');
        }
    };

    const toggleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(!isEditing);
        if (!isEditing) {
            setTimeout(() => textAreaRef.current?.focus(), 50);
        }
    };


    // --- RENDER ---
    const isWhisper = balloon.type === 'whisper';
    const isThought = balloon.type === 'thought';
    const visibilityClass = hidden ? 'opacity-0 pointer-events-none transition-opacity duration-200' : 'opacity-100 transition-opacity duration-200';

    return (
        <>
            <svg
                className={`absolute top-0 left-0 w-full h-full pointer-events-none ${visibilityClass}`}
                style={{ overflow: 'visible', zIndex: isSelected ? 30 : 20 }}
                viewBox="0 0 1000 1000" preserveAspectRatio="none"
            >
                {/* 1. Main Unified Body */}
                <path
                    d={pathData}
                    fill="white"
                    stroke={isSelected ? "#3b82f6" : "black"}
                    strokeWidth={balloon.borderWidth ?? 3}
                    strokeDasharray={isWhisper ? "10,10" : ""}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* 2. Thought Bubbles (Overlay) */}
                {isThought && balloon.tailTip && (
                    <g>
                        {[0.2, 0.45, 0.75].map((t, i) => {
                            const cx = xmin + width / 2;
                            const cy = ymin + height / 2;
                            // Lerp
                            const bx = balloon.tailTip!.x + (cx - balloon.tailTip!.x) * t;
                            const by = balloon.tailTip!.y + (cy - balloon.tailTip!.y) * t;
                            const size = 15 + i * 10;
                            return <circle key={i} cx={bx} cy={by} r={size} fill="white" stroke="black" strokeWidth={balloon.borderWidth ?? 3} />
                        })}
                    </g>
                )}
            </svg>

            {/* Interaction & Text Layer */}
            <div
                className={`absolute flex items-center justify-center text-center cursor-move select-none ${visibilityClass}`}
                style={{
                    top: `${(ymin / 1000) * 100}%`,
                    left: `${(xmin / 1000) * 100}%`,
                    height: `${height / 10}%`,
                    width: `${width / 10}%`,
                    zIndex: isSelected ? 31 : 21
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="w-full h-full p-2 relative z-10 font-bold leading-tight flex items-center justify-center">
                    {isEditing ? (
                        <textarea
                            ref={textAreaRef}
                            className="w-full h-full bg-transparent resize-none border-none outline-none text-center font-bold leading-tight pointer-events-auto"
                            style={{
                                fontFamily: '"Comic Neue", cursive',
                                fontSize: `${balloon.customFontSize ?? 14}px`,
                                color: 'black',
                                overflow: 'hidden',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word'
                            }}
                            value={balloon.text}
                            onChange={(e) => onUpdate(balloon.id, { text: e.target.value })}
                            onBlur={() => setIsEditing(false)}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div
                            style={{
                                fontFamily: '"Comic Neue", cursive',
                                fontSize: `${balloon.customFontSize ?? 14}px`,
                                color: 'black',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                hyphens: 'auto',
                                textAlign: 'center',
                                width: '100%'
                            }}
                        >
                            {balloon.text}
                        </div>
                    )}
                </div>

                {isSelected && (
                    <>
                        {/* Corner Handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'se')} />

                        {/* Edit Button */}
                        <button
                            onClick={toggleEdit}
                            className="absolute -top-8 -right-1 bg-white text-blue-600 p-1 rounded-full shadow-md border hover:bg-gray-50 z-50 pointer-events-auto transition-transform hover:scale-110"
                            title="Editar Texto"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* Tail Handle */}
            {isSelected && balloon.tailTip && (
                <div
                    className="absolute w-3 h-3 bg-orange-500 rounded-full cursor-pointer z-50 hover:scale-125 transition-transform shadow-sm border border-white"
                    style={{ top: `calc(${(balloon.tailTip.y / 1000) * 100}% - 6px)`, left: `calc(${(balloon.tailTip.x / 1000) * 100}% - 6px)` }}
                    onMouseDown={handleTailStart}
                    title="Mover Rabinho"
                />
            )}
        </>
    );
});
