import React, { useRef } from 'react'
import { ZoomIn, ZoomOut, X, MessageSquare, Cloud, Zap, Circle, MousePointer2, Wand2, Plus, Trash2 } from 'lucide-react'
import { useEditorLogic } from '../hooks/useEditorLogic';
import { VectorBubble } from './editor/VectorBubble';
import { Balloon } from '../types';
import { DebouncedTextarea } from './DebouncedTextarea';

interface EditorViewProps {
    imageUrl: string
    fileId: string
    initialBalloons?: Balloon[]
    cleanUrl?: string
    onBack: () => void
    comicName?: string
    pageName?: string
}

const EditorView: React.FC<EditorViewProps> = ({ imageUrl, fileId, initialBalloons, cleanUrl, onBack, comicName, pageName }) => {
    // Refs for layout
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);

    // Logic Hook
    const editor = useEditorLogic(fileId, initialBalloons, imageUrl, onBack);

    // Initial Scroll Center (Should ideally be in hook or purely layout effect?)
    // Keeping here as it touches DOM directly
    React.useEffect(() => {
        if (scrollContainerRef.current && editor.imgNaturalSize.w > 0) {
            const container = scrollContainerRef.current;
            const centerX = (container.scrollWidth - container.clientWidth) / 2;
            const centerY = (container.scrollHeight - container.clientHeight) / 2;
            container.scrollLeft = centerX;
            container.scrollTop = centerY;
        }
    }, [editor.imgNaturalSize]);

    // Effective Image
    let currentImageUrl = imageUrl;
    if (editor.maskPreviewUrl) {
        currentImageUrl = editor.maskPreviewUrl;
    } else if (editor.showClean && editor.cleanImageUrl) {
        currentImageUrl = editor.cleanImageUrl;
    } else if (editor.showClean && cleanUrl) {
        currentImageUrl = cleanUrl;
    }

    return (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-gray-200">
            {/* Top Bar */}
            <div className="bg-[#141416] border-b border-[#27272a] px-4 py-3 flex items-center justify-between shadow-sm z-50 h-14">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                        {comicName || 'Quadrinho'}
                    </button>
                    <span className="text-gray-600">/</span>
                    <span className="text-sm font-bold text-white">{pageName || 'Página'}</span>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
                    {['Editorial', 'Tradução', 'Animação', 'Leitura Guiada', 'Acessibilidade', 'Limpar'].map(menu => (
                        <button
                            key={menu}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${menu === 'Limpar' && editor.showClean ? 'bg-purple-900/20 text-purple-400 border border-purple-500/30' : 'text-text-secondary hover:bg-white/10 hover:text-white'}`}
                        >
                            {menu}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-lg hover:bg-red-900/20 hover:text-red-400 text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Sub-Toolbar */}
            <div className="bg-[#18181b] border-b border-[#27272a] px-4 py-2 flex items-center justify-center gap-4 shadow-inner">
                <button
                    onClick={editor.handleAddBalloon}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-medium transition-colors border border-[#3f3f46]"
                >
                    <Plus size={14} /> Add Balão
                </button>

                <button
                    onClick={editor.handleYOLOAnalyze}
                    disabled={editor.analyzingYOLO}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-xs text-white transition-all shadow-lg shadow-orange-500/10 transform hover:scale-105 active:scale-95 ${editor.analyzingYOLO ? 'bg-[#27272a] text-gray-500 cursor-wait' : 'bg-orange-600 hover:bg-orange-500'}`}
                >
                    <Zap size={14} fill="currentColor" /> {editor.analyzingYOLO ? 'YOLO...' : 'Detectar'}
                </button>

                <button
                    onClick={editor.handleImportBalloons}
                    disabled={editor.yoloDetections.length === 0}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-xs text-white transition-all shadow-lg shadow-blue-500/10 transform hover:scale-105 active:scale-95 ${editor.yoloDetections.length === 0 ? 'bg-[#27272a] text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                    <Wand2 size={14} /> Importar Balões
                </button>

                <button
                    onClick={editor.handleOCR}
                    disabled={editor.readingOCR || editor.yoloDetections.length === 0}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-xs text-white transition-all shadow-lg shadow-purple-500/10 transform hover:scale-105 active:scale-95 ${editor.readingOCR ? 'bg-[#27272a] text-gray-500 cursor-wait' : 'bg-purple-600 hover:bg-purple-500'}`}
                >
                    <MessageSquare size={14} fill="currentColor" /> {editor.readingOCR ? 'Lendo...' : 'Ler Texto'}
                </button>

                {/* Clean Button */}
                {editor.cleanImageUrl || (cleanUrl) ? (
                    <button
                        onMouseDown={() => editor.setShowClean(false)}
                        onMouseUp={() => editor.setShowClean(true)}
                        onMouseLeave={() => editor.setShowClean(true)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm border bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/30`}
                    >
                        <Wand2 size={14} /> Comparar
                    </button>
                ) : (
                    <button
                        onClick={editor.handleCleanPage}
                        disabled={editor.isCleaning || editor.balloons.length === 0}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm border ${editor.isCleaning ? 'bg-[#27272a] text-purple-400/50 border-transparent cursor-not-allowed' : 'bg-[#27272a] text-purple-400 border-[#3f3f46] hover:bg-[#3f3f46] hover:border-[#52525b]'}`}
                    >
                        {editor.isCleaning ? 'Limpando...' : 'Limpar Página'}
                    </button>
                )}

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 ml-auto">
                    <button onClick={() => editor.setZoom(Math.max(1, editor.zoom - 0.25))} disabled={editor.zoom <= 1} className="p-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white"><ZoomOut size={16} /></button>
                    <span className="text-xs text-gray-400 w-12 text-center font-mono">{Math.round(editor.zoom * 100)}%</span>
                    <button onClick={() => editor.setZoom(Math.min(2, editor.zoom + 0.25))} disabled={editor.zoom >= 2} className="p-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white"><ZoomIn size={16} /></button>
                </div>
            </div>

            {/* Mask Preview Overlay */}
            {editor.maskPreviewUrl && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#18181b] border border-[#27272a] p-4 rounded-xl shadow-2xl z-[100] flex flex-col items-center gap-3 animate-slideDown">
                    <div className="text-sm font-bold text-white uppercase tracking-wider">Aprovar Máscara</div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => { editor.setMaskPreviewUrl(null); editor.setCleanImageUrl(null); }} className="flex-1 px-4 py-2 bg-[#27272a] rounded-lg text-gray-300">Cancelar</button>
                        <button onClick={() => { editor.setMaskPreviewUrl(null); editor.setShowClean(true); }} className="flex-1 px-4 py-2 bg-green-600 rounded-lg text-white font-bold">APROVAR</button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden flex relative">
                {/* Canvas */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 bg-[#09090b] overflow-auto relative flex justify-center items-center"
                    style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
                    onMouseDown={() => { isPanning.current = true; editor.setSelectedBubbleId(null); }}
                    onMouseUp={() => isPanning.current = false}
                    onMouseLeave={() => isPanning.current = false}
                    onMouseMove={(e) => {
                        if (isPanning.current && e.buttons === 1) {
                            e.preventDefault();
                            e.currentTarget.scrollLeft -= e.movementX;
                            e.currentTarget.scrollTop -= e.movementY;
                        }
                    }}
                    onWheel={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            const delta = e.deltaY > 0 ? -0.1 : 0.1;
                            editor.setZoom(Math.max(1, Math.min(2, editor.zoom + delta)));
                        }
                    }}
                >
                    <div
                        ref={containerRef}
                        className="relative bg-white shadow-2xl ring-1 ring-white/10"
                        style={{
                            transform: `scale(${editor.zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s ease-out'
                        }}
                    >
                        <img
                            src={currentImageUrl}
                            alt="Comic Page"
                            className="block select-none"
                            draggable={false}
                            onLoad={(e) => editor.setImgNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                            style={{ pointerEvents: 'none', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }}
                        />

                        {editor.balloons.map((bubble) => (
                            <VectorBubble
                                key={bubble.id}
                                balloon={bubble}
                                containerRef={containerRef}
                                isSelected={editor.selectedBubbleId === bubble.id}
                                zoom={editor.zoom}
                                onSelect={editor.setSelectedBubbleId}
                                onUpdate={editor.updateBubble}
                            />
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-[#141416] border-l border-[#27272a] flex flex-col z-20 shadow-2xl">
                    <div className="px-6 py-3 border-b border-[#27272a] bg-[#141416]"><h3 className="text-[10px] uppercase tracking-widest text-[#71717a] font-bold">Propriedades</h3></div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {editor.selectedBubbleId ? (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                {/* Format */}
                                <div className="space-y-2">
                                    <label className="text-xs text-[#71717a] font-bold uppercase">Formato</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: 'rectangle', icon: <MessageSquare size={16} />, label: 'Rect' },
                                            { id: 'ellipse', icon: <Circle size={16} />, label: 'Oval' },
                                            { id: 'cloud', icon: <Cloud size={16} />, label: 'Cloud' },
                                            { id: 'scream', icon: <Zap size={16} />, label: 'Scream' },
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => editor.updateBubble(editor.selectedBubbleId!, { shape: opt.id as any })}
                                                className={`p-3 rounded-lg flex flex-col items-center gap-2 border transition-all ${editor.getSelectedBubble()?.shape === opt.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#27272a] border-transparent text-[#71717a]'}`}
                                            >
                                                {opt.icon}
                                                <span className="text-[10px] font-medium">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Style */}
                                <div className="space-y-2">
                                    <div className="flex gap-1 bg-[#27272a] p-1 rounded-lg">
                                        <button onClick={() => editor.updateBubble(editor.selectedBubbleId!, { type: 'speech' })} className={`flex-1 py-1.5 text-xs rounded-md ${editor.getSelectedBubble()?.type === 'speech' ? 'bg-blue-600' : ''}`}>Fala</button>
                                        <button onClick={() => editor.updateBubble(editor.selectedBubbleId!, { type: 'thought' })} className={`flex-1 py-1.5 text-xs rounded-md ${editor.getSelectedBubble()?.type === 'thought' ? 'bg-blue-600' : ''}`}>Pensamento</button>
                                    </div>
                                </div>

                                {/* Sliders */}
                                <div className="space-y-5 border-t border-[#27272a] pt-5">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center"><label className="text-xs text-[#71717a]">Espessura da Borda</label><span className="text-xs text-gray-400">{editor.getSelectedBubble()?.borderWidth ?? 3}px</span></div>
                                        <input type="range" min="0" max="30" value={editor.getSelectedBubble()?.borderWidth ?? 3} onChange={(e) => editor.updateBubble(editor.selectedBubbleId!, { borderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded cursor-pointer accent-blue-500 appearance-none" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center"><label className="text-xs text-[#71717a]">Tamanho da Fonte</label><span className="text-xs text-gray-400">{editor.getSelectedBubble()?.customFontSize}px</span></div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => editor.updateBubble(editor.selectedBubbleId!, { customFontSize: Math.max(6, (editor.getSelectedBubble()?.customFontSize ?? 10) - 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200 font-bold">-</button>
                                            <input
                                                type="number"
                                                value={editor.getSelectedBubble()?.customFontSize ?? 16}
                                                onChange={(e) => editor.updateBubble(editor.selectedBubbleId!, { customFontSize: parseInt(e.target.value) })}
                                                className="flex-1 bg-[#18181b] border border-[#27272a] rounded text-center text-xs py-1.5 focus:border-blue-500 outline-none text-gray-200"
                                            />
                                            <button onClick={() => editor.updateBubble(editor.selectedBubbleId!, { customFontSize: Math.min(100, (editor.getSelectedBubble()?.customFontSize ?? 16) + 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200 font-bold">+</button>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#27272a] pt-5">
                                        <label className="text-xs text-[#71717a] font-bold uppercase mb-2 block">Texto</label>
                                        <DebouncedTextarea
                                            value={editor.getSelectedBubble()?.text || ''}
                                            onChange={(val) => editor.updateBubble(editor.selectedBubbleId!, { text: val })}
                                            rows={4}
                                            className="w-full bg-[#18181b] border border-[#27272a] rounded p-3 text-xs text-gray-200 focus:border-blue-500 outline-none resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#27272a]">
                                    <button onClick={editor.addTailToSelected} className="w-full py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-blue-400 border border-blue-900/30 rounded-lg text-xs font-bold uppercase">
                                        {editor.getSelectedBubble()?.tailTip ? 'Reposicionar Rabinho' : 'Adicionar Rabinho'}
                                    </button>
                                </div>

                                <div className="pt-2">
                                    <button onClick={editor.handleDeleteBalloon} className="w-full py-2.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2">
                                        <Trash2 size={14} /> Excluir Balão
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#52525b] text-xs p-8 text-center border-2 border-dashed border-[#27272a] rounded-xl">
                                <MousePointer2 className="mb-3 opacity-50" size={32} />
                                <p>Selecione um balão na imagem para editar suas propriedades.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditorView;
