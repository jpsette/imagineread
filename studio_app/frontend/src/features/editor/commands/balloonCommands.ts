import { Command } from './types';
import { useEditorStore } from '../store'; // Direct store access
import { Balloon } from '@shared/types';

// Utility to generate unique IDs for commands
const generateId = () => Math.random().toString(36).substr(2, 9);

// --- ADD BALLOON ---
export class AddBalloonCommand implements Command {
    id = generateId();
    label = 'Add Balloon';

    constructor(private balloon: Balloon) { }

    execute() {
        useEditorStore.getState().addBalloon(this.balloon);
    }

    undo() {
        useEditorStore.getState().removeBalloon(this.balloon.id);
    }
}

// --- REMOVE BALLOON ---
export class RemoveBalloonCommand implements Command {
    id = generateId();
    label = 'Remove Balloon';
    private balloon: Balloon | undefined;

    constructor(private balloonId: string) {
        // Capture state eagerly or lazily?
        // Eagerly is safer if external deletions happen.
        this.balloon = useEditorStore.getState().balloons.find(b => b.id === balloonId);
    }

    execute() {
        if (this.balloon) {
            useEditorStore.getState().removeBalloon(this.balloonId);
        }
    }

    undo() {
        if (this.balloon) {
            useEditorStore.getState().addBalloon(this.balloon);
        }
    }
}

// --- UPDATE BALLOON (Move, Resize, Text) ---
export class UpdateBalloonCommand implements Command {
    id = generateId();
    label = 'Update Balloon';

    private prevBalloon: Balloon | undefined;
    private newUpdates: Partial<Balloon>;
    private balloonId: string;

    constructor(balloonId: string, updates: Partial<Balloon>) {
        this.balloonId = balloonId;
        this.newUpdates = updates;
        // Capture previous state immediately upon creation
        // This assumes creation happens BEFORE the update is applied directly
        this.prevBalloon = useEditorStore.getState().balloons.find(b => b.id === balloonId);
    }

    execute() {
        if (!this.prevBalloon) return; // Guard
        useEditorStore.getState().updateBalloon(this.balloonId, this.newUpdates);
    }

    undo() {
        if (!this.prevBalloon) return;
        // Revert only the changed fields to avoid overwriting newer unrelated changes?
        // Or revert the whole object? 
        // Safer to revert specific fields if we track diffs, but for now reverting based on captured state.
        // Actually, we should only revert the keys in `newUpdates`.

        const reversal: Partial<Balloon> = {};
        (Object.keys(this.newUpdates) as Array<keyof Balloon>).forEach(key => {
            // @ts-ignore
            reversal[key] = this.prevBalloon![key];
        });

        useEditorStore.getState().updateBalloon(this.balloonId, reversal);
    }
}

// --- BULK SET BALLOONS (Import/OCR/Clear) ---
export class SetBalloonsCommand implements Command {
    id = generateId();
    label = 'Set Balloons';
    private prevBalloons: Balloon[];

    constructor(private newBalloons: Balloon[], label?: string) {
        if (label) this.label = label;
        this.prevBalloons = useEditorStore.getState().balloons;
    }

    execute() {
        useEditorStore.getState().setBalloons(this.newBalloons);
    }

    undo() {
        useEditorStore.getState().setBalloons(this.prevBalloons);
    }
}
