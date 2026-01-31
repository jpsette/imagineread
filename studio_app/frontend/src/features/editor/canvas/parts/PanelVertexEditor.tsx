import React from 'react';
import { Circle, Line } from 'react-konva';
import { Panel } from '@shared/types';

interface PanelVertexEditorProps {
    panel: Panel;
    width: number;
    height: number;
    onChange: (newAttrs: Partial<Panel>) => void;
}

export const PanelVertexEditor: React.FC<PanelVertexEditorProps> = ({
    panel,
    width,
    height,
    onChange
}) => {
    const lineRef = React.useRef<any>(null);

    // 1. DERIVE POINTS (Materialize implicit box if needed)
    // Points are RELATIVE to the Group (0,0 is box top-left)
    const points = React.useMemo(() => {
        if (panel.points && panel.points.length >= 6) { // Minimum 3 points (6 numbers)
            // Normalize relative to box
            // Panel box_2d is [top, left, bottom, right] -> [minY, minX, maxY, maxX]
            const minX = panel.box_2d[1];
            const minY = panel.box_2d[0];

            const pts: { x: number, y: number }[] = [];
            for (let i = 0; i < panel.points.length; i += 2) {
                pts.push({
                    x: panel.points[i] - minX,
                    y: panel.points[i + 1] - minY
                });
            }
            return pts;
        } else {
            // Default 4 Corners if points are missing/invalid
            return [
                { x: 0, y: 0 },
                { x: width, y: 0 },
                { x: width, y: height },
                { x: 0, y: height }
            ];
        }
    }, [panel.points, panel.box_2d, width, height]);

    // Local Mutable State
    const currentPointsRef = React.useRef(points);

    React.useEffect(() => {
        currentPointsRef.current = points;
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

        const newPoints = [...currentPointsRef.current];
        newPoints[index] = { x: newRelX, y: newRelY };
        currentPointsRef.current = newPoints;

        if (lineRef.current) {
            lineRef.current.points(newPoints.flatMap(p => [p.x, p.y]));
            lineRef.current.getLayer()?.batchDraw();
        }
    };

    // HANDLER: Drag End
    const handlePointDragEnd = () => {
        const newPointsLocal = [...currentPointsRef.current];

        // Convert to Absolute [x,y,x,y...]
        const minX = panel.box_2d[1];
        const minY = panel.box_2d[0];

        const newAbsFlatPoints: number[] = [];
        newPointsLocal.forEach(p => {
            newAbsFlatPoints.push(minX + p.x);
            newAbsFlatPoints.push(minY + p.y);
        });

        // Recalculate Box
        const xs = newPointsLocal.map(p => minX + p.x);
        const ys = newPointsLocal.map(p => minY + p.y);
        const newMinX = Math.min(...xs);
        const newMaxX = Math.max(...xs);
        const newMinY = Math.min(...ys);
        const newMaxY = Math.max(...ys);

        onChange({
            points: newAbsFlatPoints,
            box_2d: [newMinY, newMinX, newMaxY, newMaxX]
        });
    };

    // HANDLER: Add Point
    const handleLineDblClick = (e: any) => {
        const pos = e.target.getRelativePointerPosition();
        if (!pos) return;

        const currentPts = currentPointsRef.current;
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
            const newRelPoints = [...currentPts];
            newRelPoints.splice(minIndex + 1, 0, { x: pos.x, y: pos.y });

            // Helper to save immediately
            const minX = panel.box_2d[1];
            const minY = panel.box_2d[0];
            const newAbsFlatPoints: number[] = [];
            newRelPoints.forEach(p => {
                newAbsFlatPoints.push(minX + p.x);
                newAbsFlatPoints.push(minY + p.y);
            });

            onChange({ points: newAbsFlatPoints });
        }
    };

    return (
        <React.Fragment>
            {/* Visual Guide Line (Dashed) */}
            <Line
                ref={lineRef}
                points={points.flatMap(p => [p.x, p.y])}
                closed={true}
                stroke="#0033CC" // Match Panel Color
                strokeWidth={1}
                dash={[4, 4]}
                fill="rgba(0, 51, 204, 0.1)"
                onDblClick={handleLineDblClick}
                opacity={0.8}
            />

            {/* Draggable Vertices */}
            {points.map((p, i) => (
                <Circle
                    key={`v-${i}`}
                    name="vertex-handle"
                    x={p.x}
                    y={p.y}
                    radius={6}
                    fill="#fff"
                    stroke="#0033CC"
                    strokeWidth={1} // Keep consistent with panel style or use thin border as requested? User asked for "same properties"
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
