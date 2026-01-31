import { EditorMode } from '@shared/types';

export interface ModeDefinition {
    key: EditorMode;
    label: string;
    description?: string;
}

export const editorModes: ModeDefinition[] = [
    { key: 'vectorize', label: 'Vetorizar' },
    { key: 'edit', label: 'Editar' },
    { key: 'translate', label: 'Traduzir' },
    { key: 'animate', label: 'Animar' }
];
