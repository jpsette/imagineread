import { Command } from './types';
import { useEditorStore } from '../store';
import { Panel } from '@shared/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

// --- SET PANELS (Auto-Detect / Bulk) ---
export class SetPanelsCommand implements Command {
    id = generateId();
    label = 'Set Panels';
    private prevPanels: Panel[];

    constructor(private newPanels: Panel[], label?: string) {
        if (label) this.label = label;
        this.prevPanels = useEditorStore.getState().panels;
    }

    execute() {
        useEditorStore.getState().setPanels(this.newPanels);
    }

    undo() {
        useEditorStore.getState().setPanels(this.prevPanels);
    }
}

// --- UPDATE PANEL ---
export class UpdatePanelCommand implements Command {
    id = generateId();
    label = 'Update Panel';
    private prevPanel: Panel | undefined;

    constructor(private panelId: string, private updates: Partial<Panel>) {
        // Capture specific panel state
        this.prevPanel = useEditorStore.getState().panels.find(p => p.id === panelId);
    }

    execute() {
        if (!this.prevPanel) return;

        // Manual store update for panels (since store doesn't have explicit updatePanel action yet)
        // Or we use setPanels logic
        const currentPanels = useEditorStore.getState().panels;
        const newPanels = currentPanels.map(p => p.id === this.panelId ? { ...p, ...this.updates } : p);

        useEditorStore.getState().setPanels(newPanels);
    }

    undo() {
        if (!this.prevPanel) return;

        // Revert to old value
        const currentPanels = useEditorStore.getState().panels;
        // We restore the precise previous object state for this ID
        // Note: This reverts ALL fields of the panel to the old state, which is safer than partial revert
        const newPanels = currentPanels.map(p => p.id === this.panelId ? this.prevPanel! : p);

        useEditorStore.getState().setPanels(newPanels);
    }
}

// --- REMOVE PANEL ---
export class RemovePanelCommand implements Command {
    id = generateId();
    label = 'Remove Panel';
    private panel: Panel | undefined;

    constructor(private panelId: string) {
        this.panel = useEditorStore.getState().panels.find(p => p.id === panelId);
    }

    execute() {
        if (!this.panel) return;
        useEditorStore.getState().removePanel(this.panelId);
    }

    undo() {
        if (!this.panel) return;
        const currentPanels = useEditorStore.getState().panels;
        // Restore at the end? Or preserve order?
        // Preserving order is hard without index tracking.
        // For panels, order matters (z-index). Ideally we track index.
        // For now, appending is acceptable MVP.
        useEditorStore.getState().setPanels([...currentPanels, this.panel]);
    }
}

// --- ADD PANEL ---
export class AddPanelCommand implements Command {
    id = generateId();
    label = 'Add Panel';

    constructor(private panel: Panel) { }

    execute() {
        const currentPanels = useEditorStore.getState().panels;
        useEditorStore.getState().setPanels([...currentPanels, this.panel]);
    }

    undo() {
        useEditorStore.getState().removePanel(this.panel.id);
    }
}
