import { EditorMode } from '@shared/types';

export interface ModeDefinition {
    key: EditorMode;
    label: string;
    description?: string;
}

export const editorModes: ModeDefinition[] = [
    { key: 'vectorize', label: 'Vetorizar' },
    { key: 'translate', label: 'Texto' },
    { key: 'edit', label: 'Objeto' },
    { key: 'animate', label: 'Leitor' }
];
