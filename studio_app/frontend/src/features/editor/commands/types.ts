export interface Command<T = void> {
    /** Unique ID for this specific command instance */
    id: string;
    /** Human readable label for UI (e.g. "Move Balloon", "Add Panel") */
    label: string;

    /** Execute the command updates. Returns result T (usually void) */
    execute(): T | Promise<T>;
    /** Revert the changes made by execute */
    undo(): void | Promise<void>;
    /** Re-apply changes (often same as execute, but can be optimized) */
    redo?: () => void | Promise<void>;

    /** If true, this command merges with the previous one (e.g. dragging slider) */
    mergeable?: boolean;
}
