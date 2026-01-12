import React from 'react';
import { Balloon } from '../../types';
import { DebouncedTextarea } from '../../ui/DebouncedTextarea';
import {
    MessageSquare, Circle, Cloud, Zap, Trash2, Copy,
    Plus, Type, Square, AlignLeft, AlignCenter, AlignRight,
    Minus, BoxSelect
} from 'lucide-react';

interface PanelProps {
    balloon: Balloon | null;
    onUpdate: (id: string, updates: Partial<Balloon>) => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onCreate?: (type: 'text' | 'shape' | 'speech') => void;
    // Vertex mode props kept optional for compatibility, but unused in UI
    isVertexMode?: boolean;
    onToggleVertexMode?: () => void;
}

// Helper to safely call update
const useUpdate = (balloon: Balloon | null, onUpdate: (id: string, u: Partial<Balloon>) => void) => {
    return (updates: Partial<Balloon>) => {
        if (balloon) {
            onUpdate(balloon.id, updates);
        }
    };
};

export const StylePanel: React.FC<PanelProps> = ({ balloon, onUpdate, onDelete, onDuplicate }) => {
    const update = useUpdate(balloon, onUpdate);

    if (!balloon) return <div className="p-4 text-xs text-center text-gray-500">Nenhum balão selecionado</div>;

    return (
        <div className="p-4 space-y-6 animate-fadeIn h-full overflow-y-auto custom-scrollbar bg-[#141416]">
            {/* Type Switcher */}
            <div className="bg-[#27272a] p-1 rounded-lg flex gap-1">
                <button onClick={() => update({ type: 'speech' })} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${balloon.type === 'speech' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Fala</button>
                <button onClick={() => update({ type: 'thought' })} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${balloon.type === 'thought' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Pensamento</button>
                <button onClick={() => update({ type: 'whisper' })} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${balloon.type === 'whisper' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>Sussurro</button>
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
                <label className="text-xs text-[#71717a] font-bold uppercase">Cor do Balão</label>
                <div className="flex items-center gap-2 bg-[#27272a] p-2 rounded-lg">
                    <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden relative">
                        <input type="color" value={balloon.color || '#ffffff'} onChange={(e) => update({ color: e.target.value })} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer p-0 border-none" />
                    </div>
                    <span className="text-xs font-mono text-gray-300 uppercase">{balloon.color || '#ffffff'}</span>
                </div>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs text-[#71717a] font-bold uppercase">Opacidade</label>
                    <span className="text-xs font-mono text-gray-300">{Math.round((balloon.opacity ?? 1) * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.1" value={balloon.opacity ?? 1} onChange={(e) => update({ opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>

            {/* Border Width */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs text-[#71717a] font-bold uppercase">Espessura da Borda</label>
                    <span className="text-xs font-mono text-gray-300">{balloon.borderWidth ?? 3}px</span>
                </div>
                <input type="range" min="0" max="20" step="1" value={balloon.borderWidth ?? 3} onChange={(e) => update({ borderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#27272a] grid grid-cols-2 gap-2">
                {onDuplicate && <button onClick={onDuplicate} className="p-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-md text-xs font-medium text-gray-300 flex items-center justify-center gap-2"><Copy size={14} /> Duplicar</button>}
                {onDelete && <button onClick={onDelete} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-md text-xs font-medium flex items-center justify-center gap-2"><Trash2 size={14} /> Excluir</button>}
            </div>
        </div>
    );
};

export const TextPanel: React.FC<PanelProps> = ({ balloon, onUpdate, onCreate }) => {
    const update = useUpdate(balloon, onUpdate);

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto custom-scrollbar bg-[#141416] text-gray-200">
            {/* GLOBAL ACTIONS (Always Visible) */}
            {onCreate && (
                <button
                    onClick={() => onCreate('text')}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold flex items-center justify-center gap-2 transition-colors"
                >
                    <Type size={16} />
                    <span>Adicionar Texto Solto</span>
                </button>
            )}

            <hr className="border-[#27272a]" />

            {/* EDITING CONTEXT */}
            {!balloon ? (
                <div className="text-gray-500 text-center text-xs py-4">
                    Selecione um texto para editar.
                </div>
            ) : (
                <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-2">
                        <label className="text-xs text-[#71717a] font-bold uppercase">Conteúdo</label>
                        <DebouncedTextarea
                            value={balloon.text || ''}
                            onChange={(val) => update({ text: val })}
                            rows={6}
                            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-sm text-gray-200 focus:border-blue-500 outline-none resize-none leading-relaxed font-comic shadow-inner"
                            placeholder="Digite o texto do balão..."
                        />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-2">
                        <label className="text-xs text-[#71717a] font-bold uppercase">Fonte</label>
                        <select className="w-full bg-[#27272a] border border-[#27272a] text-gray-200 text-xs rounded p-2 outline-none focus:border-blue-500" value={balloon.fontFamily || 'Comic Neue'} onChange={(e) => update({ fontFamily: e.target.value })}>
                            <option value="Comic Neue">Comic Neue</option>
                            <option value="Anime Ace">Anime Ace</option>
                            <option value="Wild Words">Wild Words</option>
                            <option value="Verdana">System (Verdana)</option>
                        </select>
                    </div>

                    {/* Text Color */}
                    <div className="space-y-2">
                        <label className="text-xs text-[#71717a] font-bold uppercase">Cor do Texto</label>
                        <div className="flex items-center gap-2 bg-[#27272a] p-2 rounded-lg">
                            <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden relative">
                                <input type="color" value={balloon.textColor || '#000000'} onChange={(e) => update({ textColor: e.target.value })} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer p-0 border-none" />
                            </div>
                            <span className="text-xs font-mono text-gray-300 uppercase">{balloon.textColor || '#000000'}</span>
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-[#71717a] font-bold uppercase">Tamanho da Fonte</label>
                            <span className="text-xs font-mono text-gray-300">{balloon.customFontSize}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => update({ customFontSize: Math.max(6, (balloon.customFontSize ?? 12) - 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200"><Minus size={14} /></button>
                            <input type="range" min="6" max="60" value={balloon.customFontSize ?? 12} onChange={(e) => update({ customFontSize: parseInt(e.target.value) })} className="flex-1 h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                            <input type="number" min="6" max="100" value={balloon.customFontSize ?? 12} onChange={(e) => update({ customFontSize: parseInt(e.target.value) })} className="w-12 bg-[#27272a] text-gray-200 text-xs text-center rounded p-1 border-none outline-none focus:border-blue-500 border border-[#27272a]" />
                            <button onClick={() => update({ customFontSize: Math.min(100, (balloon.customFontSize ?? 12) + 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200"><Plus size={14} /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const ShapePanel: React.FC<PanelProps> = ({ balloon, onUpdate, onCreate }) => {
    const update = useUpdate(balloon, onUpdate);

    return (
        <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto custom-scrollbar bg-[#141416] text-gray-200">
            {/* MASK MODE ACTIONS */}
            {balloon?.type === 'mask' && (
                <div className="mb-4">
                    <button
                        onClick={() => update({
                            type: 'speech',
                            color: '#ffffff',
                            borderColor: '#000000',
                            opacity: 1
                        })}
                        className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700 font-bold flex items-center justify-center gap-2 transition-colors animate-pulse"
                    >
                        <Zap size={16} />
                        <span>Confirmar Máscara</span>
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                        Ajuste a área vermelha e clique em confirmar para transformar em balão.
                    </p>
                    <hr className="border-[#27272a] my-4" />
                </div>
            )}

            {/* GLOBAL ACTIONS (Always Visible) */}
            {onCreate && (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onCreate('speech')}
                        className="py-2 bg-white text-gray-900 rounded hover:bg-gray-100 font-bold border border-white flex items-center justify-center gap-2 transition-colors"
                    >
                        <MessageSquare size={16} />
                        <span>+ Balão</span>
                    </button>
                    <button
                        onClick={() => onCreate('shape')} // 'shape' = empty box
                        className="py-2 bg-transparent text-white rounded hover:bg-gray-800 border border-gray-600 flex items-center justify-center gap-2 transition-colors"
                    >
                        <Square size={16} />
                        <span>+ Forma</span>
                    </button>
                </div>
            )}

            <hr className="border-[#27272a]" />

            {/* EDITING CONTEXT */}
            {!balloon ? (
                <div className="text-gray-500 text-center text-xs py-4">
                    Selecione um balão para editar.
                </div>
            ) : (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'rectangle', icon: <MessageSquare size={20} />, label: 'Retângulo' },
                            { id: 'ellipse', icon: <Circle size={20} />, label: 'Elipse' },
                            { id: 'cloud', icon: <Cloud size={20} />, label: 'Nuvem' },
                            { id: 'scream', icon: <Zap size={20} />, label: 'Grito' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => update({ shape: opt.id as any })}
                                className={`p-4 rounded-xl flex flex-col items-center gap-3 border-2 transition-all ${balloon.shape === opt.id ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#27272a] border-transparent text-[#71717a] hover:bg-[#3f3f46]'}`}
                            >
                                {opt.icon}
                                <span className="text-xs font-bold">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Border Radius (Only for Rect) */}
                    {balloon.shape === 'rectangle' && (
                        <div className="space-y-2 pt-4 border-t border-[#27272a]">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-[#71717a] font-bold uppercase">Arredondamento</label>
                                <span className="text-xs font-mono text-gray-300">{balloon.borderRadius ?? 20}</span>
                            </div>
                            <input type="range" min="0" max="100" value={balloon.borderRadius ?? 20} onChange={(e) => update({ borderRadius: parseInt(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                    )}

                    {/* Roughness (Only for Procedural) */}
                    {(balloon.shape === 'cloud' || balloon.shape === 'scream') && (
                        <div className="space-y-2 pt-4 border-t border-[#27272a]">
                            <div className="flex justify-between items-center">
                                <label className="text-xs text-[#71717a] font-bold uppercase">Intensidade</label>
                                <span className="text-xs font-mono text-gray-300">{(balloon.roughness ?? 1).toFixed(1)}</span>
                            </div>
                            <input type="range" min="0.5" max="3" step="0.1" value={balloon.roughness ?? 1} onChange={(e) => update({ roughness: parseFloat(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                    )}

                    {/* Tail Controls */}
                    <div className="mt-8 pt-4 border-t border-[#27272a]">
                        <button
                            onClick={() => {
                                if (balloon.tailTip) {
                                    update({ tailTip: null });
                                } else {
                                    const [, xmin, ymax, xmax] = balloon.box_2d;
                                    const cx = xmin + (xmax - xmin) / 2;
                                    const cy = ymax;
                                    update({ tailTip: { x: cx + 50, y: cy + 50 } });
                                }
                            }}
                            className={`w-full py-3 rounded-lg text-xs font-bold uppercase border dashed transition-all ${balloon.tailTip ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'}`}
                        >
                            {balloon.tailTip ? 'Remover Rabinho' : 'Adicionar Rabinho'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
