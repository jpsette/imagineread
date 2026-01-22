import { LucideIcon } from 'lucide-react';
import { EditorTool } from '../../../types';
import { coreTools, shapeTools } from './definitions/editTools';

export interface ToolDefinition {
    id: EditorTool;
    label: string;
    icon: LucideIcon;
    shortcut?: string;
    description?: string;
    category: 'core' | 'shape' | 'utility';
}

class Registry {
    private tools: Map<string, ToolDefinition> = new Map();

    constructor() {
        this.initialize();
    }

    private initialize() {
        // Register Edit Tools
        [...coreTools, ...shapeTools].forEach(tool => this.register(tool));
    }

    register(tool: ToolDefinition) {
        this.tools.set(tool.id, tool);
    }

    getAll(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    getByCategory(category: ToolDefinition['category']): ToolDefinition[] {
        return this.getAll().filter(t => t.category === category);
    }

    get(id: string): ToolDefinition | undefined {
        return this.tools.get(id);
    }
}

export const ToolRegistry = new Registry();

