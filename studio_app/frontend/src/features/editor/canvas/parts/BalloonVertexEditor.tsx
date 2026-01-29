import React from 'react';
import { Circle, Line } from 'react-konva';
import { Balloon } from '../../../../types';

interface BalloonVertexEditorProps {
    balloon: Balloon;
    width: number; // Width of the Group (Box)
    height: number; // Height of the Group (Box)
    onChange: (newAttrs: Partial<Balloon>) => void;
}

export const BalloonVertexEditor: React.FC<BalloonVertexEditorProps> = ({
    balloon,
    width,
    height,
    onChange
}) => {
    const lineRef = React.useRef<any>(null); // Ref to the visual line

    // 1. DERIVE POINTS (Materialize implicit box if needed)
    // Points are RELATIVE to the Group (0,0 is box top-left)
    const points = React.useMemo(() => {
        if (balloon.points && balloon.points.length > 2) {
            // Normalize relative to box
            const minX = balloon.box_2d[1];
            const minY = balloon.box_2d[0];
            return balloon.points.map(p => ({
                x: p.x - minX,
                y: p.y - minY
            }));
        } else {
            // Default 4 Corners for a Box
            // Order: TL, TR, BR, BL
            return [
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: height },
                { x: 0, y: height }
            ];
        }
    }, [balloon.points, balloon.box_2d, width, height]);

    // Local Mutable State for Dragging (Avoids Re-renders)
    const currentPointsRef = React.useRef(points);

    // Sync Ref when Props Change (e.g. Undo/Redo or Point Added)
    React.useEffect(() => {
        currentPointsRef.current = points;
        // Also update the visual line immediately to match new props
        if (lineRef.current) {
            lineRef.current.points(points.flatMap(p => [p.x, p.y]));
            lineRef.current.getLayer()?.batchDraw();
        }
    }, [points]);

    // HANDLER: Dragging a Vertex
    const handlePointDragMove = (index: number, e: any) => {
        const node = e.target;
        const newRelX = node.x();
        const newRelY = node.y();

        // 1. Update Local Ref
        const newPoints = [...currentPointsRef.current];
        newPoints[index] = { x: newRelX, y: newRelY };
        currentPointsRef.current = newPoints;

        // 2. Direct Visual Update (Bypass React)
        if (lineRef.current) {
            lineRef.current.points(newPoints.flatMap(p => [p.x, p.y]));
            // Batch draw for performance
            lineRef.current.getLayer()?.batchDraw();
        }

        // NO onChange() call here! Prevents re-render loop.
    };

    // HANDLER: Drag End (Commit to Store)
    const handlePointDragEnd = () => {
        const newPointsLocal = [...currentPointsRef.current];

        // Convert ALL points to Absolute for Save
        const minX = balloon.box_2d[1];
        const minY = balloon.box_2d[0];

        const newAbsPoints = newPointsLocal.map(p => ({
            x: minX + p.x,
            y: minY + p.y
        }));

        // Calculate Snap Box
        const xs = newAbsPoints.map(p => p.x);
        const ys = newAbsPoints.map(p => p.y);
        const newMinX = Math.min(...xs);
        const newMaxX = Math.max(...xs);
        const newMinY = Math.min(...ys);
        const newMaxY = Math.max(...ys);

        // Commit to Store
        onChange({
            points: newAbsPoints,
            box_2d: [newMinY, newMinX, newMaxY, newMaxX]
        });
    };

    // HANDLER: Add Point on Line (Double Click)
    const handleLineDblClick = (e: any) => {
        // Get relative position correctly from Konva
        const pos = e.target.getRelativePointerPosition();
        if (!pos) return;

        // Use Ref for current state to be safe
        const currentPts = currentPointsRef.current;

        // Find closest segment to insert point
        let minIndex = -1;
        let minDist = Infinity;

        for (let i = 0; i < currentPts.length; i++) {
            const p1 = currentPts[i];
            const p2 = currentPts[(i + 1) % currentPts.length];

            const l2 = (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
            if (l2 === 0) continue;

            let t = ((pos.x - p1.x) * (p2.x - p1.x) + (pos.y - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0, Math.min(1, t));

            const projX = p1.x + t * (p2.x - p1.x);
            const projY = p1.y + t * (p2.y - p1.y);

            const dist = Math.sqrt((pos.x - projX) ** 2 + (pos.y - projY) ** 2);

            if (dist < minDist) {
                minDist = dist;
                minIndex = i;
            }
        }

        if (minIndex !== -1 && minDist < 20) {
            // Insert point locally
            const newRelPoints = [...currentPts];
            newRelPoints.splice(minIndex + 1, 0, { x: pos.x, y: pos.y });

            // Convert to Absolute for Store
            const minX = balloon.box_2d[1];
            const minY = balloon.box_2d[0];
            const newAbsPoints = newRelPoints.map(p => ({
                x: minX + p.x,
                y: minY + p.y
            }));

            // Commit Immediately
            onChange({ points: newAbsPoints });
        }
    };

    return (
        <React.Fragment>
            {/* 1. VISUAL GUIDES (Lines between points) */}
            <Line
                ref={lineRef}
                points={points.flatMap(p => [p.x, p.y])}
                closed={true}
                stroke="#ff0000"
                strokeWidth={1}
                dash={[4, 4]}
                fill="rgba(255, 0, 0, 0.2)"
                onDblClick={handleLineDblClick}
                opacity={0.8}
            />

            {/* 2. DRAGGABLE VIRTEX ANCHORS */}
            {points.map((p, i) => (
                <Circle
                    key={`vertex-${i}-${p.x}-${p.y}`} // Stable key based on content? Or just index? Index is better for React reuse but key needs to change if we add points. using index is fine if we re-render on structure change.
                    x={p.x}
                    y={p.y}
                    radius={6}
                    fill="#ff0000"
                    stroke="white"
                    strokeWidth={2}
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
        </React.Fragment>
    );
};
