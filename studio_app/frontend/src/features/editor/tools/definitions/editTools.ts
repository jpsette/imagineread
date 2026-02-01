import { MousePointer2, Square, Circle, Cloud, Zap, Trash2 } from 'lucide-react';
import { ToolDefinition } from '../ToolRegistry';

export const coreTools: ToolDefinition[] = [
    {
        id: 'select',
        label: 'Mover',
        icon: MousePointer2,
        shortcut: 'V',
        category: 'core'
    },
    {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        shortcut: 'Del',
        category: 'core'
    }
];

export const shapeTools: ToolDefinition[] = [
    {
        id: 'balloon-square',
        label: 'Quadrado',
        icon: Square,
        category: 'shape'
    },
    {
        id: 'balloon-circle',
        label: 'Redondo',
        icon: Circle,
        category: 'shape'
    },
    {
        id: 'balloon-thought',
        label: 'Pensamento',
        icon: Cloud,
        category: 'shape'
    },
    {
        id: 'balloon-shout',
        label: 'Grito',
        icon: Zap,
        category: 'shape'
    }
];
