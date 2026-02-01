import React from 'react';
import { Path, Rect } from 'react-konva';
import { Balloon } from '@shared/types';
import { generatePathData, findClosestEdge } from './pathUtils';
import { BezierHandles } from './BezierHandles';

interface BalloonVertexEditorProps {
    balloon: Balloon;
    width: number; // Width of the Group (Box)
    height: number; // Height of the Group (Box)
    curveEditingEnabled?: boolean; // Enable curve editing mode
    onChange: (newAttrs: Partial<Balloon>) => void;
}

export const BalloonVertexEditor: React.FC<BalloonVertexEditorProps> = ({
    balloon,
    width,
    height,
    curveEditingEnabled = false,
    onChange
}) => {
    const pathRef = React.useRef<any>(null);
    const [selectedVertexIndex, setSelectedVertexIndex] = React.useState<number | null>(null);

    // Box offset for converting between relative and absolute coords
    const minX = balloon.box_2d[1];
    const minY = balloon.box_2d[0];

    // 1. DERIVE POINTS (Materialize implicit box if needed)
    const points = React.useMemo(() => {
        if (balloon.points && balloon.points.length > 2) {
            return balloon.points.map(p => ({
                x: p.x - minX,
                y: p.y - minY
            }));
        } else {
            // For rounded rectangles, create 8 vertices (2 per corner)
            const r = Math.min(balloon.borderRadius || 0, width / 2, height / 2);

            if (r > 0) {
                // 8 vertices for rounded corners
                // Each corner contributes 2 points (where straight edges meet the curve)
                return [
                    // Top-left corner
                    { x: r, y: 0 },          // After top-left curve (start of top edge)
                    // Top-right corner  
                    { x: width - r, y: 0 },  // Before top-right curve (end of top edge)
                    { x: width, y: r },      // After top-right curve (start of right edge)
                    // Bottom-right corner
                    { x: width, y: height - r },  // Before bottom-right curve (end of right edge)
                    { x: width - r, y: height },  // After bottom-right curve (start of bottom edge)
                    // Bottom-left corner
                    { x: r, y: height },     // Before bottom-left curve (end of bottom edge)
                    { x: 0, y: height - r }, // After bottom-left curve (start of left edge)
                    // Back to top-left
                    { x: 0, y: r }           // Before top-left curve (end of left edge)
                ];
            } else {
                // Sharp corners - 4 vertices
                return [
                    { x: 0, y: 0 },
                    { x: width, y: 0 },
                    { x: width, y: height },
                    { x: 0, y: height }
                ];
            }
        }
    }, [balloon.points, balloon.borderRadius, minX, minY, width, height]);

    // 2. DERIVE CURVE CONTROL POINTS (relative)
    // For rounded rectangles with 8 vertices, odd segments (1, 3, 5, 7) are corners and need curves
    const curveControlPoints = React.useMemo(() => {
        if (balloon.curveControlPoints && balloon.curveControlPoints.length === points.length) {
            return balloon.curveControlPoints.map(cp =>
                cp ? { x: cp.x - minX, y: cp.y - minY } : null
            );
        }

        // Auto-generate control points for rounded corners
        const r = balloon.borderRadius || 0;
        if (r > 0 && points.length === 8) {
            // For rounded corners, segments 1, 3, 5, 7 need control points (the corners)
            // Control point is at the actual corner position
            return [
                null,                           // 0: top edge (straight)
                { x: width, y: 0 },             // 1: top-right corner → control at corner
                null,                           // 2: right edge (straight)
                { x: width, y: height },        // 3: bottom-right corner → control at corner
                null,                           // 4: bottom edge (straight)
                { x: 0, y: height },            // 5: bottom-left corner → control at corner
                null,                           // 6: left edge (straight)
                { x: 0, y: 0 }                  // 7: top-left corner → control at corner
            ];
        }

        // Default: null for all edges (straight lines)
        return points.map(() => null);
    }, [balloon.curveControlPoints, balloon.borderRadius, points, minX, minY, width, height]);

    // Local refs for dragging
    const currentPointsRef = React.useRef(points);
    const currentControlPointsRef = React.useRef(curveControlPoints);
    const isDraggingLineRef = React.useRef(false);
    const draggingEdgeIndexRef = React.useRef(-1);

    // Sync refs when props change
    React.useEffect(() => {
        currentPointsRef.current = points;
        currentControlPointsRef.current = curveControlPoints;
    }, [points, curveControlPoints]);

    // generatePathData is now imported from pathUtils

    // HANDLER: Dragging a Vertex
    const handlePointDragMove = (index: number, e: any) => {
        const node = e.target;
        const newPoints = [...currentPointsRef.current];
        newPoints[index] = { x: node.x(), y: node.y() };
        currentPointsRef.current = newPoints;

        // Update visual
        if (pathRef.current) {
            pathRef.current.data(generatePathData(newPoints, currentControlPointsRef.current));
            pathRef.current.getLayer()?.batchDraw();
        }
    };

    // HANDLER: Drag End (Commit to Store)
    const handlePointDragEnd = () => {
        const newPointsLocal = [...currentPointsRef.current];
        const newAbsPoints = newPointsLocal.map(p => ({
            x: minX + p.x,
            y: minY + p.y
        }));

        const xs = newAbsPoints.map(p => p.x);
        const ys = newAbsPoints.map(p => p.y);

        // Also save control points to preserve curves
        const currentCP = currentControlPointsRef.current;
        const newAbsControlPoints = currentCP.map(cp =>
            cp ? { x: minX + cp.x, y: minY + cp.y } : null
        );

        onChange({
            points: newAbsPoints,
            curveControlPoints: newAbsControlPoints,
            box_2d: [Math.min(...ys), Math.min(...xs), Math.max(...ys), Math.max(...xs)]
        });
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

    // HANDLER: Add Point on Line (Double Click) - only if not in curve mode
    const handleLineDblClick = (e: any) => {
        if (curveEditingEnabled) return; // In curve mode, dbl-click doesn't add points

        const pos = e.target.getRelativePointerPosition();
        if (!pos) return;

        // Find closest edge using utility function
        const { index: minIndex, distance: minDist } = findClosestEdge(currentPointsRef.current, pos);

        if (minIndex !== -1 && minDist < 20) {
            const newRelPoints = [...currentPointsRef.current];
            newRelPoints.splice(minIndex + 1, 0, { x: pos.x, y: pos.y });

            const newAbsPoints = newRelPoints.map(p => ({
                x: minX + p.x,
                y: minY + p.y
            }));

            // Also add null control point for the new edge
            const newControlPoints = [...currentControlPointsRef.current];
            newControlPoints.splice(minIndex + 1, 0, null);
            const newAbsControlPoints = newControlPoints.map(cp =>
                cp ? { x: minX + cp.x, y: minY + cp.y } : null
            );

            onChange({ points: newAbsPoints, curveControlPoints: newAbsControlPoints });
        }
    };

    // Generate path data for current state
    const pathData = generatePathData(points, curveControlPoints);

    return (
        <React.Fragment>
            {/* Visual guide - Path with curves */}
            <Path
                ref={pathRef}
                data={pathData}
                stroke="#3b82f6"
                strokeWidth={0.5}
                fill="rgba(59, 130, 246, 0.05)"
                onDblClick={handleLineDblClick}
                hitStrokeWidth={15}
                opacity={0.9}
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
                    onMouseLeave={handleLineDragEnd}
                    onMouseEnter={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'grab';
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

            {/* Bezier handles - show for selected vertex when curve mode is active */}
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
