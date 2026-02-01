import React from 'react';

import { Balloon } from '@shared/types';
import { useEditorStore } from '@features/editor/store';

interface LineStyleSectionProps {
    selectedBalloon: Balloon | undefined;
    hasSelectedBalloon: boolean;
}

export const LineStyleSection: React.FC<LineStyleSectionProps> = ({ selectedBalloon, hasSelectedBalloon }) => {
    const { updateBalloonUndoable } = useEditorStore();

    return (
        <>
            {/* Line Style Control */}
            <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5">
                <span className="text-[10px] text-zinc-400 font-medium flex-1">Estilo da Linha</span>
                <div className="flex gap-1">
                    {[
                        { value: 'solid', label: '━━━', title: 'Lisa' },
                        { value: 'dashed', label: '╍╍╍', title: 'Tracejada' },
                        { value: 'dotted', label: '•••', title: 'Pontilhada' }
                    ].map((style) => (
                        <button
                            key={style.value}
                            onClick={() => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, {
                                borderStyle: style.value as any,
                                dashSize: undefined,
                                dashGap: undefined
                            })}
                            disabled={!hasSelectedBalloon}
                            title={style.title}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${(selectedBalloon?.borderStyle || 'solid') === style.value
                                ? 'bg-neon-blue/30 text-white border border-neon-blue/50'
                                : 'bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            {style.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Line Customization Sliders */}
            <div className="mt-2 space-y-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2">
                {/* Line Width */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 font-medium flex-1">Espessura</span>
                    <input
                        type="range"
                        min="0" max="20" step="1"
                        value={selectedBalloon?.borderWidth ?? 1}
                        onChange={(e) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { borderWidth: Number(e.target.value) })}
                        className="w-24 h-1 accent-neon-blue"
                        disabled={!hasSelectedBalloon}
                    />
                    <span className="text-[10px] text-white font-bold w-6 text-center">
                        {selectedBalloon?.borderWidth ?? 1}
                    </span>
                </div>
                {/* Dash Size */}
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium flex-1 ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-zinc-400' : 'text-zinc-600'}`}>Tamanho</span>
                    <input
                        type="range"
                        min="0" max="20" step="1"
                        value={selectedBalloon?.dashSize ?? (selectedBalloon?.borderStyle === 'dotted' ? 2 : 8)}
                        onChange={(e) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { dashSize: Number(e.target.value) })}
                        className="w-24 h-1 accent-neon-blue disabled:opacity-30"
                        disabled={!hasSelectedBalloon || !selectedBalloon?.borderStyle || selectedBalloon.borderStyle === 'solid'}
                    />
                    <span className={`text-[10px] font-bold w-6 text-center ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-white' : 'text-zinc-600'}`}>
                        {selectedBalloon?.dashSize ?? (selectedBalloon?.borderStyle === 'dotted' ? 2 : 8)}
                    </span>
                </div>
                {/* Dash Gap */}
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium flex-1 ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-zinc-400' : 'text-zinc-600'}`}>Espaçamento</span>
                    <input
                        type="range"
                        min="0" max="20" step="1"
                        value={selectedBalloon?.dashGap ?? (selectedBalloon?.borderStyle === 'dotted' ? 4 : 4)}
                        onChange={(e) => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { dashGap: Number(e.target.value) })}
                        className="w-24 h-1 accent-neon-blue disabled:opacity-30"
                        disabled={!hasSelectedBalloon || !selectedBalloon?.borderStyle || selectedBalloon.borderStyle === 'solid'}
                    />
                    <span className={`text-[10px] font-bold w-6 text-center ${selectedBalloon?.borderStyle && selectedBalloon.borderStyle !== 'solid' ? 'text-white' : 'text-zinc-600'}`}>
                        {selectedBalloon?.dashGap ?? (selectedBalloon?.borderStyle === 'dotted' ? 4 : 4)}
                    </span>
                </div>
            </div>

            {/* Stroke Alignment Control */}
            <div className="mt-2 flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5">
                <span className="text-[10px] text-zinc-400 font-medium flex-1">Expansão da Linha</span>
                <div className="flex gap-1">
                    {[
                        { value: 'inner', label: 'Int', title: 'Interno - Linha expande para dentro' },
                        { value: 'center', label: 'Cen', title: 'Central - Linha expande para dentro e fora' },
                        { value: 'outer', label: 'Ext', title: 'Externo - Linha expande para fora' }
                    ].map((align) => (
                        <button
                            key={align.value}
                            onClick={() => selectedBalloon && updateBalloonUndoable(selectedBalloon.id, { strokeAlign: align.value as any })}
                            disabled={!hasSelectedBalloon}
                            title={align.title}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${(selectedBalloon?.strokeAlign || 'center') === align.value
                                ? 'bg-neon-blue/30 text-white border border-neon-blue/50'
                                : 'bg-white/5 text-zinc-400 border border-transparent hover:bg-white/10'
                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                            {align.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};
