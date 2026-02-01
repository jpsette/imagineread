import React from 'react';
import { Circle, Path } from 'react-konva';
import { Balloon } from '@shared/types';
import { generatePathData, findClosestEdge } from './pathUtils';

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
            return [
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: height },
                { x: 0, y: height }
            ];
        }
    }, [balloon.points, minX, minY, width, height]);

    // 2. DERIVE CURVE CONTROL POINTS (relative)
    const curveControlPoints = React.useMemo(() => {
        if (balloon.curveControlPoints && balloon.curveControlPoints.length === points.length) {
            return balloon.curveControlPoints.map(cp =>
                cp ? { x: cp.x - minX, y: cp.y - minY } : null
            );
        }
        // Default: null for all edges (straight lines)
        return points.map(() => null);
    }, [balloon.curveControlPoints, points, minX, minY]);

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

        onChange({
            points: newAbsPoints,
            box_2d: [Math.min(...ys), Math.min(...xs), Math.max(...ys), Math.max(...xs)]
        });
    };

    // HANDLER: Line Drag Start (for curve creation)
    const handleLineDragStart = (e: any) => {
        if (!curveEditingEnabled) return;

        const pos = e.target.getRelativePointerPosition();
        if (!pos) return;

        // Find closest edge using utility function
        const { index: closestEdge, distance: minDist } = findClosestEdge(currentPointsRef.current, pos);

        if (closestEdge !== -1 && minDist < 15) {
            isDraggingLineRef.current = true;
            draggingEdgeIndexRef.current = closestEdge;

            // Set cursor
            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'grabbing';
        }
    };

    // HANDLER: Line Drag Move (curve creation)
    const handleLineDragMove = (e: any) => {
        if (!isDraggingLineRef.current || !curveEditingEnabled) return;

        const pos = e.target.getRelativePointerPosition();
        if (!pos) return;

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
    const handleLineDragEnd = () => {
        if (!isDraggingLineRef.current) return;

        isDraggingLineRef.current = false;
        const edgeIndex = draggingEdgeIndexRef.current;
        draggingEdgeIndexRef.current = -1;

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
                stroke={curveEditingEnabled ? "#a855f7" : "#ff0000"}
                strokeWidth={curveEditingEnabled ? 2 : 1}
                dash={curveEditingEnabled ? undefined : [4, 4]}
                fill={curveEditingEnabled ? "rgba(168, 85, 247, 0.15)" : "rgba(255, 0, 0, 0.2)"}
                onDblClick={handleLineDblClick}
                onMouseDown={curveEditingEnabled ? handleLineDragStart : undefined}
                onMouseMove={curveEditingEnabled ? handleLineDragMove : undefined}
                onMouseUp={curveEditingEnabled ? handleLineDragEnd : undefined}
                onMouseLeave={curveEditingEnabled ? handleLineDragEnd : undefined}
                onMouseEnter={e => {
                    const container = e.target.getStage()?.container();
                    if (container) container.style.cursor = curveEditingEnabled ? 'grab' : 'default';
                }}
                opacity={0.9}
            />

            {/* Vertex handles (circles) - only show when NOT in curve mode */}
            {!curveEditingEnabled && points.map((p, i) => (
                <Circle
                    key={`vertex-${i}`}
                    name="vertex-handle"
                    x={p.x}
                    y={p.y}
                    radius={4}
                    fill="#ff0000"
                    draggable
                    onDragMove={(e) => handlePointDragMove(i, e)}
                    onDragEnd={handlePointDragEnd}
                    onMouseEnter={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'crosshair';
                    }}
                    onMouseLeave={e => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'default';
                    }}
                />
            ))}

            {/* Control point indicators (small squares) - show in curve mode for existing curves */}
            {curveEditingEnabled && curveControlPoints.map((cp, i) => cp && (
                <Circle
                    key={`control-${i}`}
                    x={cp.x}
                    y={cp.y}
                    radius={3}
                    fill="#a855f7"
                    stroke="#fff"
                    strokeWidth={1}
                    listening={false}
                />
            ))}
        </React.Fragment>
    );
};
