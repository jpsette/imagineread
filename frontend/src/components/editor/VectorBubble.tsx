import React, { useState, useRef } from 'react';
import { Balloon } from '../../types';

interface VectorProps {
    balloon: Balloon;
    containerRef: React.RefObject<HTMLDivElement>;
    isSelected: boolean;
    zoom: number;
    onSelect: () => void;
    onUpdateBox: (newBox: number[]) => void;
    onUpdateTail: (newTail: { x: number, y: number }) => void;
    onUpdateText: (text: string) => void;
}

export const VectorBubble: React.FC<VectorProps> = ({
    balloon,
    containerRef,
    isSelected,
    zoom,
    onSelect,
    onUpdateBox,
    onUpdateTail,
    onUpdateText
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

    // --- MATH HELPERS ---
    const getRectIntersection = (angle: number, w: number, h: number) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        if (Math.abs(cos) * h > Math.abs(sin) * w) {
            const x = (Math.sign(cos) * w) / 2;
            const y = x * (sin / cos);
            return { x, y };
        } else {
            const y = (Math.sign(sin) * h) / 2;
            const x = y * (cos / sin);
            return { x, y };
        }
    };

    const getEllipseIntersection = (angle: number, w: number, h: number) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a = w / 2;
        const b = h / 2;
        const r = 1 / Math.sqrt((cos * cos) / (a * a) + (sin * sin) / (b * b));
        return { x: r * cos, y: r * sin };
    };

    // --- EVENT HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isSelected) {
            onSelect();
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
            onUpdateBox([oy1 + deltaY, ox1 + deltaX, oy2 + deltaY, ox2 + deltaX]);
        }
        else if (isResizing.current) {
            let [y1, x1, y2, x2] = startBox.current;
            if (resizeHandle.current?.includes('n')) y1 += deltaY;
            if (resizeHandle.current?.includes('s')) y2 += deltaY;
            if (resizeHandle.current?.includes('w')) x1 += deltaX;
            if (resizeHandle.current?.includes('e')) x2 += deltaX;

            // Minimum size constraint
            if (y2 - y1 < 20) y2 = y1 + 20;
            if (x2 - x1 < 20) x2 = x1 + 20;

            onUpdateBox([y1, x1, y2, x2]);
        }
        else if (isDraggingTail.current && startTail.current) {
            onUpdateTail({ x: startTail.current.x + deltaX, y: startTail.current.y + deltaY });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        isResizing.current = false;
        isDraggingTail.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const toggleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(!isEditing);
        if (!isEditing) {
            setTimeout(() => textAreaRef.current?.focus(), 50);
        }
    };

    // --- RENDER CALCS ---
    const w = xmax - xmin;
    const h = ymax - ymin;
    const cx = xmin + w / 2;
    const cy = ymin + h / 2;

    let mainPathD = "";

    // 1. Body Geometry
    if (balloon.shape === 'rectangle') {
        const r = balloon.borderRadius ?? 20;
        const rSafe = Math.min(r, w / 2, h / 2);
        mainPathD = `M ${xmin + rSafe} ${ymin} H ${xmax - rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmax} ${ymin + rSafe} V ${ymax - rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmax - rSafe} ${ymax} H ${xmin + rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmin} ${ymax - rSafe} V ${ymin + rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmin + rSafe} ${ymin} Z`;
    }
    else if (balloon.shape === 'ellipse') {
        const rx = w / 2;
        const ry = h / 2;
        mainPathD = `M ${xmin} ${cy} A ${rx} ${ry} 0 1 0 ${xmax} ${cy} A ${rx} ${ry} 0 1 0 ${xmin} ${cy} Z`;
    }
    else {
        // Procedural
        const segments = balloon.shape === 'cloud' ? 12 : 30;
        const rx = w / 2; const ry = h / 2;
        const roughness = balloon.roughness ?? 1;

        if (balloon.shape === 'cloud') {
            mainPathD = `M ${cx + rx} ${cy}`;
            for (let i = 1; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const prevAngle = ((i - 1) / segments) * Math.PI * 2;
                const px = cx + rx * Math.cos(angle);
                const py = cy + ry * Math.sin(angle);
                const midAngle = (angle + prevAngle) / 2;
                const bumpSize = 1.3 * roughness;
                const cpX = cx + rx * Math.cos(midAngle) * bumpSize;
                const cpY = cy + ry * Math.sin(midAngle) * bumpSize;
                mainPathD += ` Q ${cpX} ${cpY} ${px} ${py}`;
            }
            mainPathD += " Z";
        } else {
            // Scream
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const spike = (i % 2) * 40 * roughness;
                const rLocalX = rx + (Math.cos(angle) * spike);
                const rLocalY = ry + (Math.sin(angle) * spike);
                const px = cx + Math.cos(angle) * rLocalX;
                const py = cy + Math.sin(angle) * rLocalY;
                points.push({ x: px, y: py });
            }
            mainPathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ") + " Z";
        }
    }

    // 2. Tail Geometry
    let tailPathD = "";
    let connectorPatch = null;
    const isThought = balloon.type === 'thought';
    const isWhisper = balloon.type === 'whisper';

    if (balloon.tailTip && !isThought) {
        const dx = balloon.tailTip.x - cx;
        const dy = balloon.tailTip.y - cy;
        const angle = Math.atan2(dy, dx);

        let perimeterPt = { x: cx, y: cy };
        if (balloon.shape === 'ellipse' || balloon.shape === 'cloud' || balloon.shape === 'scream') {
            perimeterPt = getEllipseIntersection(angle, w, h);
        } else {
            perimeterPt = getRectIntersection(angle, w, h);
        }
        const anchorX = cx + perimeterPt.x;
        const anchorY = cy + perimeterPt.y;

        const tailW = balloon.tailWidth ?? 40;
        const perpAngle = angle + Math.PI / 2;
        const bx1 = anchorX + Math.cos(perpAngle) * (tailW / 2);
        const by1 = anchorY + Math.sin(perpAngle) * (tailW / 2);
        const bx2 = anchorX - Math.cos(perpAngle) * (tailW / 2);
        const by2 = anchorY - Math.sin(perpAngle) * (tailW / 2);

        tailPathD = `M ${bx1} ${by1} L ${balloon.tailTip.x} ${balloon.tailTip.y} L ${bx2} ${by2}`;

        const innerX = anchorX - Math.cos(angle) * 8;
        const innerY = anchorY - Math.sin(angle) * 8;

        connectorPatch = (
            <path
                d={`M ${bx1} ${by1} L ${bx2} ${by2} L ${innerX} ${innerY} Z`}
                fill="white"
                stroke="none"
            />
        );
    }

    return (
        <>
            <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible', zIndex: isSelected ? 30 : 20 }}
                viewBox="0 0 1000 1000" preserveAspectRatio="none"
            >
                {/* 1. Main Body */}
                <path
                    d={mainPathD}
                    fill="white"
                    stroke="black"
                    strokeWidth={balloon.borderWidth ?? 3}
                    strokeDasharray={isWhisper ? "10,10" : ""}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* 2. Tail */}
                {!isThought && balloon.tailTip && (
                    <path
                        d={tailPathD}
                        fill="white"
                        stroke="black"
                        strokeWidth={balloon.borderWidth ?? 3}
                        strokeLinejoin="round"
                    />
                )}

                {/* 3. Patch */}
                {connectorPatch}

                {/* 4. Thought Content */}
                {isThought && balloon.tailTip && (
                    <g>
                        {[0.2, 0.45, 0.75].map((t, i) => {
                            const size = 15 + i * 10;
                            const tip = balloon.tailTip!;
                            const bx = tip.x + (cx - tip.x) * t;
                            const by = tip.y + (cy - tip.y) * t;
                            return <circle key={i} cx={bx} cy={by} r={size} fill="white" stroke="black" strokeWidth={balloon.borderWidth ?? 3} />
                        })}
                    </g>
                )}
            </svg>

            {/* Interaction & Text Layer */}
            <div
                className={`absolute flex items-center justify-center text-center cursor-move select-none`}
                style={{
                    top: `${(ymin / 1000) * 100}%`,
                    left: `${(xmin / 1000) * 100}%`,
                    height: `${h / 10}%`,
                    width: `${w / 10}%`,
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
                            onChange={(e) => onUpdateText(e.target.value)}
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
                        {/* Handles */}
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
};
