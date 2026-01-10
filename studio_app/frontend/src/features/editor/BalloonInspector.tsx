import React, { useState } from 'react';
import { Balloon } from '../../types';
import { DraggableWindow } from '../../ui/DraggableWindow';
import { DebouncedTextarea } from '../../ui/DebouncedTextarea';
import { MessageSquare, Circle, Cloud, Zap, Trash2, Copy } from 'lucide-react';

interface BalloonInspectorProps {
    selectedBalloon: Balloon | null;
    onUpdate: (id: string, updates: Partial<Balloon>) => void;
    onDelete: () => void;
    onDuplicate?: () => void; // Optional for now
    onClose: () => void;
}

export const BalloonInspector: React.FC<BalloonInspectorProps> = ({
    selectedBalloon,
    onUpdate,
    onDelete,
    onDuplicate,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'style' | 'text' | 'shape'>('style');

    const update = (updates: Partial<Balloon>) => {
        if (selectedBalloon) {
            onUpdate(selectedBalloon.id, updates);
        }
    };

    if (!selectedBalloon) {
        return (
            <DraggableWindow
                title="Propriedades"
                initialPosition={{ x: window.innerWidth - 320, y: 100 }}
                initialSize={{ width: 300, height: 200 }}
                onClose={onClose}
                docked={false}
            >
                <div className="h-full flex flex-col items-center justify-center text-text-secondary p-8 text-center bg-app-bg">
                    <div className="p-4 rounded-full bg-[#27272a] mb-4 opacity-50">
                        <MessageSquare size={24} />
                    </div>
                    <p className="text-xs">Selecione um balão para visualizar suas propriedades.</p>
                </div>
            </DraggableWindow>
        );
    }

    return (
        <DraggableWindow
            title="Propriedades"
            initialPosition={{ x: window.innerWidth - 350, y: 120 }}
            initialSize={{ width: 320, height: 500 }}
            onClose={onClose}
        >
            <div className="flex flex-col h-full bg-[#141416]">
                {/* Tabs */}
                <div className="flex border-b border-[#27272a] bg-[#18181b]">
                    {[
                        { id: 'style', label: 'Estilo' },
                        { id: 'text', label: 'Texto' },
                        { id: 'shape', label: 'Forma' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab.id ? 'text-accent-blue border-b-2 border-accent-blue bg-[#27272a]' : 'text-text-secondary hover:text-white hover:bg-[#27272a]'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                    {/* --- STYLE TAB --- */}
                    {activeTab === 'style' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Type Switcher */}
                            <div className="bg-[#27272a] p-1 rounded-lg flex gap-1">
                                <button
                                    onClick={() => update({ type: 'speech' })}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedBalloon.type === 'speech' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Fala
                                </button>
                                <button
                                    onClick={() => update({ type: 'thought' })}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedBalloon.type === 'thought' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Pensamento
                                </button>
                                <button
                                    onClick={() => update({ type: 'whisper' })}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedBalloon.type === 'whisper' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Sussurro
                                </button>
                            </div>

                            {/* Fill Color */}
                            <div className="space-y-2">
                                <label className="text-xs text-[#71717a] font-bold uppercase">Cor do Balão</label>
                                <div className="flex items-center gap-2 bg-[#27272a] p-2 rounded-lg">
                                    <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden relative">
                                        <input
                                            type="color"
                                            value={selectedBalloon.color || '#ffffff'}
                                            onChange={(e) => update({ color: e.target.value })}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer p-0 border-none"
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-gray-300 uppercase">{selectedBalloon.color || '#ffffff'}</span>
                                </div>
                            </div>

                            {/* Opacity */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-[#71717a] font-bold uppercase">Opacidade</label>
                                    <span className="text-xs font-mono text-gray-300">{Math.round((selectedBalloon.opacity ?? 1) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={selectedBalloon.opacity ?? 1}
                                    onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
                                    className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Border Width */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-[#71717a] font-bold uppercase">Espessura da Borda</label>
                                    <span className="text-xs font-mono text-gray-300">{selectedBalloon.borderWidth ?? 3}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={selectedBalloon.borderWidth ?? 3}
                                    onChange={(e) => update({ borderWidth: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-[#27272a] grid grid-cols-2 gap-2">
                                <button onClick={onDuplicate} className="p-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-md text-xs font-medium text-gray-300 flex items-center justify-center gap-2">
                                    <Copy size={14} /> Duplicar
                                </button>
                                <button onClick={onDelete} className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-md text-xs font-medium flex items-center justify-center gap-2">
                                    <Trash2 size={14} /> Excluir
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- TEXT TAB --- */}
                    {activeTab === 'text' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="space-y-2">
                                <label className="text-xs text-[#71717a] font-bold uppercase">Conteúdo</label>
                                <DebouncedTextarea
                                    value={selectedBalloon.text || ''}
                                    onChange={(val) => update({ text: val })}
                                    rows={6}
                                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-sm text-gray-200 focus:border-blue-500 outline-none resize-none leading-relaxed font-comic shadow-inner"
                                    placeholder="Digite o texto do balão..."
                                />
                            </div>

                            {/* Font Family */}
                            <div className="space-y-2">
                                <label className="text-xs text-[#71717a] font-bold uppercase">Fonte</label>
                                <select
                                    className="w-full bg-[#27272a] border border-[#27272a] text-gray-200 text-xs rounded p-2 outline-none focus:border-blue-500"
                                    value={selectedBalloon.fontFamily || 'Comic Neue'}
                                    onChange={(e) => update({ fontFamily: e.target.value })}
                                >
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
                                        <input
                                            type="color"
                                            value={selectedBalloon.textColor || '#000000'}
                                            onChange={(e) => update({ textColor: e.target.value })}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] cursor-pointer p-0 border-none"
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-gray-300 uppercase">{selectedBalloon.textColor || '#000000'}</span>
                                </div>
                            </div>

                            {/* Font Size */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs text-[#71717a] font-bold uppercase">Tamanho da Fonte</label>
                                    <span className="text-xs font-mono text-gray-300">{selectedBalloon.customFontSize}px</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => update({ customFontSize: Math.max(6, (selectedBalloon.customFontSize ?? 12) - 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200">–</button>
                                    <input
                                        type="range"
                                        min="6"
                                        max="60"
                                        value={selectedBalloon.customFontSize ?? 12}
                                        onChange={(e) => update({ customFontSize: parseInt(e.target.value) })}
                                        className="flex-1 h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                    <input
                                        type="number"
                                        min="6"
                                        max="100"
                                        value={selectedBalloon.customFontSize ?? 12}
                                        onChange={(e) => update({ customFontSize: parseInt(e.target.value) })}
                                        className="w-12 bg-[#27272a] text-gray-200 text-xs text-center rounded p-1 border-none outline-none focus:border-blue-500 border border-[#27272a]"
                                    />
                                    <button onClick={() => update({ customFontSize: Math.min(100, (selectedBalloon.customFontSize ?? 12) + 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200">+</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SHAPE TAB --- */}
                    {activeTab === 'shape' && (
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
                                        className={`p-4 rounded-xl flex flex-col items-center gap-3 border-2 transition-all ${selectedBalloon.shape === opt.id ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-[#27272a] border-transparent text-[#71717a] hover:bg-[#3f3f46]'}`}
                                    >
                                        {opt.icon}
                                        <span className="text-xs font-bold">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Border Radius (Only for Rect) */}
                            {selectedBalloon.shape === 'rectangle' && (
                                <div className="space-y-2 pt-4 border-t border-[#27272a]">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-[#71717a] font-bold uppercase">Arredondamento</label>
                                        <span className="text-xs font-mono text-gray-300">{selectedBalloon.borderRadius ?? 20}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={selectedBalloon.borderRadius ?? 20}
                                        onChange={(e) => update({ borderRadius: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            )}

                            {/* Roughness (Only for Procedural) */}
                            {(selectedBalloon.shape === 'cloud' || selectedBalloon.shape === 'scream') && (
                                <div className="space-y-2 pt-4 border-t border-[#27272a]">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-[#71717a] font-bold uppercase">Intensidade</label>
                                        <span className="text-xs font-mono text-gray-300">{(selectedBalloon.roughness ?? 1).toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={selectedBalloon.roughness ?? 1}
                                        onChange={(e) => update({ roughness: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-[#27272a] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            )}

                            {/* Tail Controls */}
                            <div className="mt-8 pt-4 border-t border-[#27272a]">
                                <button
                                    onClick={() => {
                                        if (selectedBalloon.tailTip) {
                                            update({ tailTip: null });
                                        } else {
                                            const [ymin, xmin, ymax, xmax] = selectedBalloon.box_2d;
                                            const cx = xmin + (xmax - xmin) / 2;
                                            const cy = ymax;
                                            update({ tailTip: { x: cx + 50, y: cy + 50 } });
                                        }
                                    }}
                                    className={`w-full py-3 rounded-lg text-xs font-bold uppercase border dashed transition-all ${selectedBalloon.tailTip ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20' : 'border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'}`}
                                >
                                    {selectedBalloon.tailTip ? 'Remover Rabinho' : 'Adicionar Rabinho'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DraggableWindow>
    );
};
