import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Path, Rect } from 'react-konva';
import { Balloon } from '@shared/types';
import { generatePathData, generateCubicPathData, findClosestEdge, VertexHandle } from './pathUtils';
import { BezierHandles } from './BezierHandles';

interface BalloonVertexEditorProps {
    balloon: Balloon;
    width: number; // Width of the Group (Box)
    height: number; // Height of the Group (Box)
    curveEditingEnabled?: boolean; // Enable curve editing mode
    onChange: (newAttrs: Partial<Balloon>) => void;
}

const BalloonVertexEditorComponent: React.FC<BalloonVertexEditorProps> = ({
    balloon,
    width,
    height,
    curveEditingEnabled = false,
    onChange
}) => {
    const pathRef = useRef<any>(null);
    const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);

    // Cleanup: Reset cursor when component unmounts
    useEffect(() => {
        return () => {
            // Find and reset the Konva stage container cursor
            const stages = document.querySelectorAll('.konvajs-content');
            stages.forEach(stage => {
                (stage as HTMLElement).style.cursor = '';
            });
        };
    }, []);

    // Box offset for converting between relative and absolute coords
    const minX = balloon.box_2d[1];
    const minY = balloon.box_2d[0];

    // 1. DERIVE POINTS - For visual editing overlay
    // If balloon has explicit points, use them.
    // Otherwise, derive visual points from borderRadius (without modifying the balloon)
    const points = useMemo(() => {
        if (balloon.points && balloon.points.length > 2) {
            // Use explicit points (already converted from borderRadius or custom polygon)
            return balloon.points.map(p => ({
                x: p.x - minX,
                y: p.y - minY
            }));
        }

        // Derive visual points from borderRadius for editing overlay
        // The balloon is NOT modified - this is just for display
        const r = Math.min(balloon.borderRadius || 0, width / 2, height / 2);

        if (r > 0) {
            // 8 vertices for rounded corners (2 per corner)
            return [
                { x: r, y: 0 },           // 0 - after top-left curve
                { x: width - r, y: 0 },   // 1 - before top-right curve
                { x: width, y: r },       // 2 - after top-right curve
                { x: width, y: height - r }, // 3 - before bottom-right curve
                { x: width - r, y: height }, // 4 - after bottom-right curve
                { x: r, y: height },      // 5 - before bottom-left curve
                { x: 0, y: height - r },  // 6 - after bottom-left curve
                { x: 0, y: r }            // 7 - before top-left curve
            ];
        }

        // Sharp corners - 4 vertices
        return [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: height },
            { x: 0, y: height }
        ];
    }, [balloon.points, balloon.borderRadius, minX, minY, width, height]);

    // 2. DERIVE CURVE CONTROL POINTS (relative) - for legacy quadratic curves
    const curveControlPoints = useMemo(() => {
        if (balloon.curveControlPoints && balloon.curveControlPoints.length === points.length) {
            return balloon.curveControlPoints.map(cp =>
                cp ? { x: cp.x - minX, y: cp.y - minY } : null
            );
        }
        return points.map(() => null);
    }, [balloon.curveControlPoints, points, minX, minY]);

    // 3. DERIVE VERTEX HANDLES for cubic bezier (for editing overlay visualization)
    // This derives handles for DISPLAY in the editor overlay.
    // The actual balloon rendering uses its own logic in BalloonVector.tsx
    const BEZIER_K = 0.5523;
    const derivedVertexHandles: VertexHandle[] = useMemo(() => {
        // Use explicit handles from balloon data if they exist
        if (balloon.vertexHandles && balloon.vertexHandles.length === points.length) {
            return balloon.vertexHandles.map(vh => ({
                handleIn: vh?.handleIn ? { x: vh.handleIn.x - minX, y: vh.handleIn.y - minY } : undefined,
                handleOut: vh?.handleOut ? { x: vh.handleOut.x - minX, y: vh.handleOut.y - minY } : undefined
            }));
        }

        // Derive handles from borderRadius for 8-point rounded rect visualization
        const r = Math.min(balloon.borderRadius || 0, width / 2, height / 2);
        if (r > 0 && points.length === 8) {
            const k = r * BEZIER_K;
            // Generate handles for curves between points (all in relative coords)
            return [
                { handleIn: { x: r - k, y: 0 } },           // 0: handleIn for 7→0 curve
                { handleOut: { x: width - r + k, y: 0 } },  // 1: handleOut for 1→2 curve
                { handleIn: { x: width, y: r - k } },       // 2: handleIn for 1→2 curve
                { handleOut: { x: width, y: height - r + k } }, // 3: handleOut for 3→4 curve
                { handleIn: { x: width - r + k, y: height } },  // 4: handleIn for 3→4 curve
                { handleOut: { x: r - k, y: height } },     // 5: handleOut for 5→6 curve
                { handleIn: { x: 0, y: height - r + k } },  // 6: handleIn for 5→6 curve
                { handleOut: { x: 0, y: r - k } }           // 7: handleOut for 7→0 curve
            ];
        }

        // No handles for sharp corners
        return points.map(() => ({}));
    }, [balloon.vertexHandles, balloon.borderRadius, points, minX, minY, width, height]);

    // Local refs for dragging
    const currentPointsRef = useRef(points);
    const currentControlPointsRef = useRef(curveControlPoints);
    const currentVertexHandlesRef = useRef(derivedVertexHandles);
    const isDraggingLineRef = useRef(false);
    const draggingEdgeIndexRef = useRef(-1);

    // Sync refs when props change
    useEffect(() => {
        currentPointsRef.current = points;
        currentControlPointsRef.current = curveControlPoints;
        currentVertexHandlesRef.current = derivedVertexHandles;
    }, [points, curveControlPoints, derivedVertexHandles]);

    // generatePathData is now imported from pathUtils

    // HANDLER: Dragging a Vertex
    const handlePointDragMove = (index: number, e: any) => {
        const node = e.target;
        const newX = node.x();
        const newY = node.y();

        // Calculate delta (how much the vertex moved)
        const oldPoint = currentPointsRef.current[index];
        const dx = newX - oldPoint.x;
        const dy = newY - oldPoint.y;

        // Update point position
        const newPoints = [...currentPointsRef.current];
        newPoints[index] = { x: newX, y: newY };
        currentPointsRef.current = newPoints;

        // CRITICAL: Also move the handles associated with this vertex
        // When a vertex moves, its handleIn and handleOut should move with it
        const handles = [...currentVertexHandlesRef.current];
        if (handles[index]) {
            const vh = handles[index];
            handles[index] = {
                handleIn: vh.handleIn ? { x: vh.handleIn.x + dx, y: vh.handleIn.y + dy } : undefined,
                handleOut: vh.handleOut ? { x: vh.handleOut.x + dx, y: vh.handleOut.y + dy } : undefined
            };
            currentVertexHandlesRef.current = handles;
        }

        // Update visual - use cubic bezier if we have handles
        if (pathRef.current) {
            const currentHandles = currentVertexHandlesRef.current;
            const hasHandles = currentHandles.some(vh => vh?.handleIn || vh?.handleOut);

            if (hasHandles && currentHandles.length > 0) {
                pathRef.current.data(generateCubicPathData(newPoints, currentHandles, 0, 0));
            } else {
                pathRef.current.data(generatePathData(newPoints, currentControlPointsRef.current));
            }
            pathRef.current.getLayer()?.batchDraw();
        }
    };

    // HANDLER: Drag End (Commit to Store)
    const handlePointDragEnd = () => {
        const newPointsLocal = [...currentPointsRef.current];

        // Convert relative points back to absolute using ORIGINAL minX/minY
        // This prevents the "jumping" issue - we don't recalculate box_2d bounds
        const newAbsPoints = newPointsLocal.map(p => ({
            x: minX + p.x,
            y: minY + p.y
        }));

        // Also save control points to preserve curves (using original offset)
        const currentCP = currentControlPointsRef.current;
        const newAbsControlPoints = currentCP.map(cp =>
            cp ? { x: minX + cp.x, y: minY + cp.y } : null
        );

        // Save vertex handles if they exist (to preserve curves)
        const currentHandles = currentVertexHandlesRef.current;
        const hasHandles = currentHandles.some(vh => vh?.handleIn || vh?.handleOut);

        // Build the update object
        const updateData: Partial<Balloon> = {
            points: newAbsPoints,
            curveControlPoints: newAbsControlPoints
            // NOTE: We intentionally do NOT update box_2d here
            // box_2d should only change during resize/transform operations
        };

        // If we have handles (from borderRadius or user-defined), convert and save them
        if (hasHandles) {
            updateData.vertexHandles = currentHandles.map(vh => ({
                handleIn: vh?.handleIn ? { x: minX + vh.handleIn.x, y: minY + vh.handleIn.y } : undefined,
                handleOut: vh?.handleOut ? { x: minX + vh.handleOut.x, y: minY + vh.handleOut.y } : undefined
            }));
            // Clear borderRadius since we're now using explicit vertexHandles
            updateData.borderRadius = 0;
        }

        onChange(updateData);
    };

    // HANDLER: Line Drag Start (for curve creation)
    const handleLineDragStart = (e: any) => {
        if (!curveEditingEnabled) return;

        // Cancel bubble to prevent parent Group drag
        e.cancelBubble = true;

        // Get pointer position relative to this component's coordinate system
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // Convert stage coordinates to local coordinates (relative to balloon)
        const groupNode = e.target.findAncestor('Group');
        const transform = groupNode?.getAbsoluteTransform().copy().invert();
        const pos = transform ? transform.point(pointerPos) : pointerPos;

        // Find closest edge using utility function
        const { index: closestEdge, distance: minDist } = findClosestEdge(currentPointsRef.current, pos);

        if (closestEdge !== -1 && minDist < 20) {
            isDraggingLineRef.current = true;
            draggingEdgeIndexRef.current = closestEdge;

            // Initialize control point at cursor position
            const newControlPoints = [...currentControlPointsRef.current];
            newControlPoints[closestEdge] = { x: pos.x, y: pos.y };
            currentControlPointsRef.current = newControlPoints;

            // Set cursor
            const container = stage.container();
            if (container) container.style.cursor = 'grabbing';
        }
    };

    // HANDLER: Line Drag Move (curve creation)
    const handleLineDragMove = (e: any) => {
        if (!isDraggingLineRef.current || !curveEditingEnabled) return;

        // Cancel bubble to prevent parent interaction
        e.cancelBubble = true;

        // Get pointer position relative to this component's coordinate system
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // Convert stage coordinates to local coordinates
        const groupNode = e.target.findAncestor('Group');
        const transform = groupNode?.getAbsoluteTransform().copy().invert();
        const pos = transform ? transform.point(pointerPos) : pointerPos;

        const edgeIndex = draggingEdgeIndexRef.current;
        if (edgeIndex === -1) return;

        // Update control point for this edge
        const newControlPoints = [...currentControlPointsRef.current];
        newControlPoints[edgeIndex] = { x: pos.x, y: pos.y };
        currentControlPointsRef.current = newControlPoints;

        // Update visual
        if (pathRef.current) {
            pathRef.current.data(generatePathData(currentPointsRef.current, newControlPoints));
            pathRef.current.getLayer()?.batchDraw();
        }
    };

    // HANDLER: Line Drag End (commit curve)
    const handleLineDragEnd = (e?: any) => {
        if (!isDraggingLineRef.current) return;

        // Cancel bubble if event exists
        if (e) e.cancelBubble = true;

        isDraggingLineRef.current = false;
        const edgeIndex = draggingEdgeIndexRef.current;
        draggingEdgeIndexRef.current = -1;

        // Reset cursor
        if (e) {
            const stage = e.target?.getStage();
            const container = stage?.container();
            if (container) container.style.cursor = 'grab';
        }

        if (edgeIndex === -1) return;

        // Convert control points to absolute
        const newAbsControlPoints = currentControlPointsRef.current.map(cp =>
            cp ? { x: minX + cp.x, y: minY + cp.y } : null
        );

        onChange({ curveControlPoints: newAbsControlPoints });
    };

    // HANDLER: Add Point on Line (Double Click)
    const handleLineDblClick = (e: any) => {
        const pos = e.target.getRelativePointerPosition();
        if (!pos) return;

        // Find closest edge using utility function
        const currentRelPoints = currentPointsRef.current;
        const { index: minIndex, distance: minDist } = findClosestEdge(currentRelPoints, pos);

        if (minIndex !== -1 && minDist < 20) {
            // Create new points array with new point inserted
            const newRelPoints = [...currentRelPoints];
            newRelPoints.splice(minIndex + 1, 0, { x: pos.x, y: pos.y });

            const newAbsPoints = newRelPoints.map(p => ({
                x: minX + p.x,
                y: minY + p.y
            }));

            // Handle control points (legacy quadratic)
            const newControlPoints = [...currentControlPointsRef.current];
            newControlPoints.splice(minIndex + 1, 0, null);
            const newAbsControlPoints = newControlPoints.map(cp =>
                cp ? { x: minX + cp.x, y: minY + cp.y } : null
            );

            // Handle vertex handles (cubic bezier)
            // Use the ABSOLUTE handles from balloon, not the derived relative ones
            let existingAbsHandles = balloon.vertexHandles || [];

            // If balloon has borderRadius but no explicit handles, generate them
            if (currentRelPoints.length === 8 && balloon.borderRadius && balloon.borderRadius > 0 && existingAbsHandles.length === 0) {
                const r = balloon.borderRadius;
                const clampedR = Math.min(r, width / 2, height / 2);
                const k = clampedR * BEZIER_K;

                // Generate ABSOLUTE handles for the 8-point rounded rect
                existingAbsHandles = [
                    { handleIn: { x: minX + clampedR - k, y: minY } },
                    { handleOut: { x: minX + width - clampedR + k, y: minY } },
                    { handleIn: { x: minX + width, y: minY + clampedR - k } },
                    { handleOut: { x: minX + width, y: minY + height - clampedR + k } },
                    { handleIn: { x: minX + width - clampedR + k, y: minY + height } },
                    { handleOut: { x: minX + clampedR - k, y: minY + height } },
                    { handleIn: { x: minX, y: minY + height - clampedR + k } },
                    { handleOut: { x: minX, y: minY + clampedR - k } }
                ];
            }

            // Ensure handles array matches original points length
            while (existingAbsHandles.length < currentRelPoints.length) {
                existingAbsHandles.push({});
            }

            // Insert empty handle for the new point
            const newVertexHandles = [...existingAbsHandles];
            newVertexHandles.splice(minIndex + 1, 0, {});

            onChange({
                points: newAbsPoints,
                curveControlPoints: newAbsControlPoints,
                vertexHandles: newVertexHandles,
                borderRadius: 0  // Clear borderRadius since now explicit
            });
        }
    };

    // Generate path data for current state (memoized to avoid recalculation)
    // Use cubic bezier path when we have handles (either user-defined or auto-generated for rounded rect)
    const hasCubicHandles = derivedVertexHandles.some(vh => vh?.handleIn || vh?.handleOut);

    const pathData = useMemo(() => {
        if (hasCubicHandles && derivedVertexHandles.length > 0) {
            // Use cubic bezier curves with vertex handles
            // Note: derivedVertexHandles are already in relative coords
            return generateCubicPathData(points, derivedVertexHandles, 0, 0);
        }
        // Fall back to quadratic curves or straight lines
        return generatePathData(points, curveControlPoints);
    }, [points, curveControlPoints, derivedVertexHandles, hasCubicHandles]);

    return (
        <React.Fragment>
            {/* Visual guide - Path with curves */}
            <Path
                ref={pathRef}
                data={pathData}
                stroke="#3b82f6"
                strokeWidth={1}
                fill="transparent"
                onDblClick={handleLineDblClick}
                hitStrokeWidth={15}
            />

            {/* Invisible overlay for curve drag - captures mouse events reliably */}
            {curveEditingEnabled && (
                <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill="transparent"
                    onMouseDown={handleLineDragStart}
                    onMouseMove={handleLineDragMove}
                    onMouseUp={handleLineDragEnd}
                    onMouseLeave={(e) => {
                        handleLineDragEnd(e);
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                    onDblClick={handleLineDblClick}
                    onMouseEnter={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'crosshair';
                    }}
                />
            )}

            {/* Vertex handles (small squares) - ALWAYS show when vertex editing is active */}
            {points.map((p, i) => (
                <Rect
                    key={`vertex-${i}`}
                    name="vertex-handle"
                    x={p.x - 3}
                    y={p.y - 3}
                    width={6}
                    height={6}
                    fill={selectedVertexIndex === i ? "#1d4ed8" : "#3b82f6"}
                    stroke={selectedVertexIndex === i ? "#fff" : undefined}
                    strokeWidth={selectedVertexIndex === i ? 1 : 0}
                    draggable
                    dragBoundFunc={(pos) => {
                        // Offset back to center since Rect is positioned by corner
                        return { x: pos.x, y: pos.y };
                    }}
                    onDragMove={(e) => {
                        // Adjust for the offset since Rect uses corner positioning
                        const node = e.target;
                        const newX = node.x() + 3;
                        const newY = node.y() + 3;
                        handlePointDragMove(i, { target: { x: () => newX, y: () => newY } });
                    }}
                    onDragEnd={handlePointDragEnd}
                    onClick={(e) => {
                        e.cancelBubble = true;
                        if (curveEditingEnabled) {
                            setSelectedVertexIndex(selectedVertexIndex === i ? null : i);
                        }
                    }}
                    onMouseEnter={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = curveEditingEnabled ? 'pointer' : 'crosshair';
                    }}
                    onMouseLeave={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                />
            ))}

            {/* Bezier handles - show ONLY for selected vertex when curve mode is active */}
            {curveEditingEnabled && selectedVertexIndex !== null && (
                <BezierHandles
                    balloon={balloon}
                    points={points}
                    minX={minX}
                    minY={minY}
                    selectedVertexIndex={selectedVertexIndex}
                    onVertexSelect={setSelectedVertexIndex}
                    onChange={onChange}
                />
            )}
        </React.Fragment>
    );
};

// Memoized export to prevent unnecessary re-renders when parent changes
export const BalloonVertexEditor = React.memo(BalloonVertexEditorComponent);
