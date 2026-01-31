import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableItemProps {
    id: string;
    children: React.ReactNode;
    className?: string;
    data?: any;
    accepts?: string[]; // Optional type filtering
}

export function DroppableItem({ id, children, className, data }: DroppableItemProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data
    });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'ring-2 ring-accent-blue bg-accent-blue/10 scale-[1.02] transition-all' : ''}`}
        >
            {children}
        </div>
    );
}
