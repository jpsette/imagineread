
import React from 'react';
import { VectorizeMenu } from './menus/VectorizeMenu';
import { EditMenu } from './menus/EditMenu';
import { TranslationMenu } from './menus/TranslationMenu';
import { AnimationMenu } from './menus/AnimationMenu';

// Re-using types if needed, or string literal is fine
type EditorMode = 'vectorize' | 'edit' | 'translate' | 'animate';

interface EditorSidebarProps {
    activeMode: EditorMode;
    sidebarWidth: number;
    setIsResizing: (isResizing: boolean) => void;

    // Props for Vectorize Menu (We pass them all down)
    vectorizeProps: any; // Using any for simplicity here to avoid duplicating the huge interface, or import it.
    // Ideally: import { VectorizeMenuProps } from './menus/VectorizeMenu';
    // But for now, let's keep it clean.
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
    activeMode,
    sidebarWidth,
    setIsResizing,
    vectorizeProps
}) => {
    return (
        <aside
            style={{ width: sidebarWidth }}
            className="absolute top-0 left-0 h-full bg-[#252526] border-r border-[#333] shadow-2xl z-20 flex flex-col"
        >
            {/* Sidebar Header */}
            <div className="h-12 border-b border-[#333] flex items-center px-4 shrink-0 bg-[#2d2d2d]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {activeMode === 'vectorize' && 'Vetorizar'}
                    {activeMode === 'edit' && 'Editar'}
                    {activeMode === 'translate' && 'Traduzir'}
                    {activeMode === 'animate' && 'Animar'}
                </span>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {activeMode === 'vectorize' && (
                    <VectorizeMenu {...vectorizeProps} />
                )}

                {activeMode === 'edit' && <EditMenu />}
                {activeMode === 'translate' && <TranslationMenu />}
                {activeMode === 'animate' && <AnimationMenu />}

            </div>

            {/* Resizer Handle */}
            <div
                onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500/50 transition-colors z-30"
                title="Arrastar largura"
            />
        </aside>
    );
};
