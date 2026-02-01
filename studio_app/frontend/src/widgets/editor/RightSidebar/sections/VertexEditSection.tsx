import React from 'react';

import { VertexToggleButton } from '@features/editor/components/ui/VertexToggleButton';
import { CurveToggleButton } from '@features/editor/components/ui/CurveToggleButton';

export const VertexEditSection: React.FC = () => {
    return (
        <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-300 font-semibold uppercase tracking-wide">Vértices</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2">
                <span className="text-[10px] text-zinc-400 font-medium flex-1">Editar Vértices</span>
                <VertexToggleButton />
            </div>
            <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2">
                <span className="text-[10px] text-zinc-400 font-medium flex-1">Curvar Arestas</span>
                <CurveToggleButton />
            </div>
        </div>
    );
};
