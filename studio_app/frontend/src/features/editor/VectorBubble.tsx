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
    return {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle)
    };
};

const getRectPoint = (cx: number, cy: number, w: number, h: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const absCos = Math.abs(cos);
    const absSin = Math.abs(sin);

    // Box dimensions relative to center
    const hw = w / 2;
    const hh = h / 2;

    // Check intersection with vertical edges (x = +/- hw)
    // x = t * cos => t = hw / absCos
    // y = t * sin
    // If resulting |y| <= hh, then it hits vertical edge.

    // Check intersection with horizontal edges (y = +/- hh)
    // y = t * sin => t = hh / absSin

    // We want the smallest positive 't'

    const tVertical = absCos > 0.0001 ? hw / absCos : Infinity;
    const tHorizontal = absSin > 0.0001 ? hh / absSin : Infinity;

    let t = Math.min(tVertical, tHorizontal);

    return {
        x: cx + t * cos,
        y: cy + t * sin
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
    const resizeHandle = useRef<string | null>(null);

    // Refs for Tail Dragging
    const isDraggingTail = useRef(false);
    const isDraggingControl = useRef(false);
    const startTail = useRef<{ x: number, y: number } | null>(null);
    const startControl = useRef<{ x: number, y: number } | null>(null);

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
        // Default control point if missing: midpoint between center and tip
        const tailControl = balloon.tailControl || (tailTip ? { x: (cx + tailTip.x) / 2, y: (cy + tailTip.y) / 2 } : null);
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

        // 2. HAS TAIL - ADVANCED BÉZIER LOGIC
        // Uses tailControl for curve

        // A. Calculate Angle from Center to Tip
        const angle = Math.atan2(tailTip.y - cy, tailTip.x - cx);

        // B. Calculate Base Points
        let p1: { x: number, y: number }; // Base Left
        let p2: { x: number, y: number }; // Base Right

        if (shape === 'ellipse') {
            const avgR = (rx + ry) / 2;
            const delta = (tailWidth / 2) / avgR; // approximate angular width
            p1 = getEllipticalPoint(cx, cy, rx, ry, angle - delta);
            p2 = getEllipticalPoint(cx, cy, rx, ry, angle + delta);

            // Path:
            // 1. Start at P2
            // 2. Arc to P1 (Major arc usually, or the one NOT crossing the tail angle)
            //    We want the long way around.
            // 3. Q Curve from P1 -> Control -> Tip
            // 4. Q Curve from Tip -> Control -> P2

            // Note: SVG Arc flag: large-arc-flag sweep-flag
            // ellipse: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
            // We go from P2 to P1. 
            // If delta is small, P2 to P1 via 'long path' means large-arc=1.

            return `M ${p2.x} ${p2.y} 
                    A ${rx} ${ry} 0 1 1 ${p1.x} ${p1.y} 
                    Q ${tailControl!.x} ${tailControl!.y} ${tailTip.x} ${tailTip.y} 
                    Q ${tailControl!.x} ${tailControl!.y} ${p2.x} ${p2.y} Z`;
        }
        else {
            // RECTANGLE LOGIC (Simplified for Bézier: Use perimeter walk or just simple cut)
            // To ensure perfect rect shape minus gap, we ideally walk the rect.
            // For now, let's keep it simple: Draw full rect logic but insert curve at gap.

            // 1. Get exact intersection points
            // p1 angle - delta? Rect "angle" isn't uniform.
            // Better approach idea: Get vector perpendicular to tail vector... (omitted for simplicity)
            // Shift angle slightly for 'angular width' approximation is easier though

            // Shift angle slightly for 'angular width' approximation is easier though
            // Let's use getRectPoint with angle +/- delta
            // We approximate 'radius' of rect as max(w,h) for delta calc?
            const approxR = Math.max(width, height) / 2;
            const delta = (tailWidth / 2) / approxR;

            p1 = getRectPoint(cx, cy, width, height, angle - delta);
            p2 = getRectPoint(cx, cy, width, height, angle + delta);

            // We need to trace the rectangle from P2 to P1 clockwise (or CCW depending on SVG coord).
            // This is complex to generate generically for a rounded rect.
            // FALLBACK: Use the previous consistent logic but replace the simplistic lines with Curves
            // The previous logic identified which "Edge" the tail base hit.

            // For Bézier tail on Rect, simply drawing M P2... path ... L P1 Q ... Z might cut through if not careful.
            // Let's reuse the Robust "Segmented" approach but injecting Q curves instead of L to tip.

            // Refined Logic:
            // Identify Edge of simple Base point (center of tail)
            const base = getRectPoint(cx, cy, width, height, angle);
            const r = Math.min(balloon.borderRadius ?? 20, rx, ry);
            const halfT = tailWidth / 2;

            const isTop = Math.abs(base.y - ymin) < 1;
            const isBottom = Math.abs(base.y - ymax) < 1;
            const isLeft = Math.abs(base.x - xmin) < 1;
            // Right is default else

            let path = `M ${xmin + r} ${ymin}`; // Start Top-Left after corner

            // TOP
            if (isTop) {
                // Gap is around 'base.x'
                const t1 = Math.max(xmin + r, base.x - halfT);
                const t2 = Math.min(xmax - r, base.x + halfT);
                path += ` L ${t1} ${ymin} 
                          Q ${tailControl!.x} ${tailControl!.y} ${tailTip.x} ${tailTip.y}
                          Q ${tailControl!.x} ${tailControl!.y} ${t2} ${ymin}`;
            }
            path += ` L ${xmax - r} ${ymin} A ${r} ${r} 0 0 1 ${xmax} ${ymin + r}`; // Top edge end + TR Corner

            // RIGHT
            if (!isTop && !isBottom && !isLeft) { // isRight
                const t1 = Math.max(ymin + r, base.y - halfT);
                const t2 = Math.min(ymax - r, base.y + halfT);
                path += ` L ${xmax} ${t1}
                           Q ${tailControl!.x} ${tailControl!.y} ${tailTip.x} ${tailTip.y}
                           Q ${tailControl!.x} ${tailControl!.y} ${xmax} ${t2}`;
            }
            path += ` L ${xmax} ${ymax - r} A ${r} ${r} 0 0 1 ${xmax - r} ${ymax}`; // Right edge end + BR Corner

            // BOTTOM
            if (isBottom) {
                const t2 = Math.min(xmax - r, base.x + halfT); // Right side of gap
                const t1 = Math.max(xmin + r, base.x - halfT); // Left side of gap
                path += ` L ${t2} ${ymax}
                          Q ${tailControl!.x} ${tailControl!.y} ${tailTip.x} ${tailTip.y}
                          Q ${tailControl!.x} ${tailControl!.y} ${t1} ${ymax}`;
            }
            path += ` L ${xmin + r} ${ymax} A ${r} ${r} 0 0 1 ${xmin} ${ymax - r}`; // Bot edge end + BL Corner

            // LEFT
            if (isLeft) {
                const t2 = Math.min(ymax - r, base.y + halfT);
                const t1 = Math.max(ymin + r, base.y - halfT);
                path += ` L ${xmin} ${t2}
                          Q ${tailControl!.x} ${tailControl!.y} ${tailTip.x} ${tailTip.y}
                          Q ${tailControl!.x} ${tailControl!.y} ${xmin} ${t1}`;
            }
            path += ` L ${xmin} ${ymin + r} A ${r} ${r} 0 0 1 ${xmin + r} ${ymin}`; // Left edge end + TL Corner

            path += " Z";
            return path;
        }

    }, [balloon, xmin, width, ymin, height]); // Depend full balloon to catch nested prop changes


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

    const handleControlStart = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        isDraggingControl.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        // Default control if null
        const cx = xmin + width / 2;
        const cy = ymin + height / 2;
        const tx = balloon.tailTip?.x || cx;
        const ty = balloon.tailTip?.y || cy;
        startControl.current = balloon.tailControl ? { ...balloon.tailControl } : { x: (cx + tx) / 2, y: (cy + ty) / 2 };
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
        else if (isDraggingControl.current && startControl.current) {
            onUpdate(balloon.id, { tailControl: { x: startControl.current.x + deltaX, y: startControl.current.y + deltaY } });
        }
    };

    const handleMouseUp = () => {
        const wasDragging = isDragging.current;
        const wasResizing = isResizing.current;
        const wasTail = isDraggingTail.current;
        const wasControl = isDraggingControl.current;

        isDragging.current = false;
        isResizing.current = false;
        isDraggingTail.current = false;
        isDraggingControl.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Commit History on Drag End
        if (onCommit) {
            if (wasDragging) onCommit('Mover Balão');
            else if (wasResizing) onCommit('Redimensionar Balão');
            else if (wasTail) onCommit('Ajustar Rabinho');
            else if (wasControl) onCommit('Curvar Rabinho');
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

    // Calculate control pos for rendering handle if it doesn't exist yet
    const cx = xmin + width / 2;
    const cy = ymin + height / 2;
    const tx = balloon.tailTip?.x || cx;
    const ty = balloon.tailTip?.y || cy;
    const controlPos = balloon.tailControl || { x: (cx + tx) / 2, y: (cy + ty) / 2 };

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
                    fill={balloon.color || "white"}
                    stroke={isSelected ? "#3b82f6" : (balloon.borderColor || "black")}
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
                            return <circle key={i} cx={bx} cy={by} r={size} fill={balloon.color || "white"} stroke="black" strokeWidth={balloon.borderWidth ?? 3} />
                        })}
                    </g>
                )}

                {/* 3. Visual Guide for Control Point (When Selected) */}
                {isSelected && balloon.tailTip && !isThought && (
                    <path
                        d={`M ${balloon.tailTip.x} ${balloon.tailTip.y} L ${controlPos.x} ${controlPos.y} M ${cx} ${cy} L ${controlPos.x} ${controlPos.y}`}
                        stroke="#3b82f6"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                        opacity="0.5"
                    />
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
                                fontFamily: balloon.fontFamily || '"Comic Neue", cursive',
                                fontSize: `${balloon.customFontSize ?? 14}px`,
                                color: balloon.textColor || 'black',
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
                                fontFamily: balloon.fontFamily || '"Comic Neue", cursive',
                                fontSize: `${balloon.customFontSize ?? 14}px`,
                                color: balloon.textColor || 'black',
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

            {/* Extra Handles (Tail & Control) */}
            {isSelected && balloon.tailTip && !isThought && (
                <>
                    {/* Tail Tip Handle (Green/Orange) */}
                    <div
                        className="absolute w-3 h-3 bg-emerald-500 rounded-full cursor-pointer z-50 hover:scale-125 transition-transform shadow-sm border border-white"
                        style={{ top: `calc(${(balloon.tailTip.y / 1000) * 100}% - 6px)`, left: `calc(${(balloon.tailTip.x / 1000) * 100}% - 6px)` }}
                        onMouseDown={handleTailStart}
                        title="Mover Ponta"
                    />

                    {/* Control Point Handle (Yellow/Amber) - Smaller */}
                    <div
                        className="absolute w-2.5 h-2.5 bg-amber-400 rounded-full cursor-all-scroll z-50 hover:scale-125 transition-transform shadow-sm border border-white"
                        style={{ top: `calc(${(controlPos.y / 1000) * 100}% - 5px)`, left: `calc(${(controlPos.x / 1000) * 100}% - 5px)` }}
                        onMouseDown={handleControlStart}
                        title="Curvar Rabinho (Bézier)"
                    />
                </>
            )}

            {/* Simple Tail Handle for Thought Bubbles (No curve) */}
            {isSelected && balloon.tailTip && isThought && (
                <div
                    className="absolute w-3 h-3 bg-emerald-500 rounded-full cursor-pointer z-50 hover:scale-125 transition-transform shadow-sm border border-white"
                    style={{ top: `calc(${(balloon.tailTip.y / 1000) * 100}% - 6px)`, left: `calc(${(balloon.tailTip.x / 1000) * 100}% - 6px)` }}
                    onMouseDown={handleTailStart}
                    title="Mover Pensamento"
                />
            )}
        </>
    );
});
