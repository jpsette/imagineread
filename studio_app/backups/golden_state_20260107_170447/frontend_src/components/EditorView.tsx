import React, { useRef, useState, useEffect } from 'react'
import { ZoomIn, ZoomOut, X, MessageSquare, Cloud, Zap, Circle, MousePointer2, Wand2, Plus, Trash2 } from 'lucide-react'
import { API_ENDPOINTS } from '../config';

// --- Types ---
type BubbleShape = 'rectangle' | 'ellipse' | 'cloud' | 'scream';
type BubbleType = 'speech' | 'thought' | 'whisper';

interface DetectedBalloon {
    id: number;
    confidence: number;
    polygon: number[][]; // [[x,y], [x,y]...]
    box?: number[]; // [x, y, w, h] - needed for OCR cropping
    text?: string;
}

interface Bubble {
    id: string;
    text: string;

    // Core Layout
    box_2d: number[]; // [ymin, xmin, ymax, xmax] 0-1000
    polygon?: number[][]; // Optional polygon for better inpainting

    // Styling
    shape: BubbleShape;
    type: BubbleType;

    // Appearance
    borderRadius?: number; // For Rect
    roughness?: number;    // For Cloud (bump size) / Scream (spike intensity)
    borderWidth?: number;

    // Text
    customFontSize?: number;

    // Tail
    tailTip?: { x: number, y: number } | null;
    tailCurve?: { x: number, y: number } | null;
    tailWidth?: number;
}

interface EditorViewProps {
    imageUrl: string
    onBack: () => void
    comicName?: string // New
    pageName?: string // New
}

const EditorView: React.FC<EditorViewProps> = ({ imageUrl, onBack, comicName, pageName }) => {
    // --- State ---

    const [analyzingYOLO, setAnalyzingYOLO] = useState(false);
    const [readingOCR, setReadingOCR] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanImageUrl, setCleanImageUrl] = useState<string | null>(null);
    const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | null>(null); // New State
    const [showClean, setShowClean] = useState(false); // Toggle view
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [detectedBalloons, setDetectedBalloons] = useState<DetectedBalloon[]>([]);
    const zoom = 1; // Fixed zoom - dynamic zoom causes reflow issues

    // Image Dimensions for SVG ViewBox
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

    // Interaction
    const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false); // <--- Ref for drag state

    // --- Helpers ---
    const pointsToPath = (points: number[][]) => {
        if (!points || points.length === 0) return '';
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
        return `${d} Z`;
    };

    // --- Actions ---


    const handleCleanPage = async () => {
        if (bubbles.length === 0) {
            alert("Não há balões detectados para limpar.");
            return;
        }
        setIsCleaning(true);
        try {
            const response = await fetch(API_ENDPOINTS.CLEAN_IMAGE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_path: imageUrl,
                    balloons: bubbles.map(b => {
                        // Coordinates in State are 0-1000.
                        // We need to convert back to PIXELS for the backend script.
                        const scaleX = imgNaturalSize.w / 1000;
                        const scaleY = imgNaturalSize.h / 1000;

                        const [y1, x1, y2, x2] = b.box_2d;

                        // Scale Box
                        const px = x1 * scaleX;
                        const py = y1 * scaleY;
                        const w = (x2 - x1) * scaleX;
                        const h = (y2 - y1) * scaleY;

                        // Scale Polygon (if exists)
                        let scaledPolygon: number[][] = [];
                        if (b.polygon) {
                            scaledPolygon = b.polygon.map(pt => [pt[0] * scaleX, pt[1] * scaleY]);
                        }

                        return {
                            box: [px, py, w, h],
                            polygon: scaledPolygon
                        };
                    })
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Erro na limpeza');
            }

            const data = await response.json();

            // Logic: Show Mask Preview first if available
            if (data.debug_mask_url) {
                setMaskPreviewUrl(data.debug_mask_url);
                setCleanImageUrl(data.clean_image_url); // Store it but don't show yet
                // Show clean view is effectively showing 'currentImageUrl' which will be mask if set
            } else {
                // Fallback if no mask returned
                setCleanImageUrl(data.clean_image_url);
                setShowClean(true);
            }

        } catch (error: any) {
            console.error(error);
            alert(`Erro ao limpar imagem: ${error.message}`);
        } finally {
            setIsCleaning(false);
        }
    };

    const handleYOLOAnalyze = async () => {
        setAnalyzingYOLO(true);
        try {
            const response = await fetch(API_ENDPOINTS.ANALYZE_YOLO, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_path: imageUrl }) // YOLO endpoint expects "image_path"
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || 'Erro na análise YOLO');

            // Success: Store balloons and notify
            const balloons = data.balloons || [];
            if (!data.balloons) {
                console.warn("YOLO response missing balloons:", data);
            }

            if (balloons.length === 0) {
                alert("0 balões! Erro: " + JSON.stringify(data));
            }

            setDetectedBalloons(balloons);
            alert(`Processamento YOLO concluído!\n\n${balloons.length} balões detectados.\nConfira as áreas verdes na imagem.`);

        } catch (error: any) {
            console.error("Full YOLO Error:", error);
            alert(`Erro YOLO: ${error.message}`);
        } finally {
            setAnalyzingYOLO(false);
        }
    };

    const handleOCR = async () => {
        if (detectedBalloons.length === 0) {
            alert("Nenhum balão detectado para ler.");
            return;
        }

        setReadingOCR(true);
        try {
            const response = await fetch(API_ENDPOINTS.READ_TEXT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_path: imageUrl, balloons: detectedBalloons })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.detail || 'Erro no OCR');

            const updatedBalloons = data.balloons || [];

            // Convert to Editable Bubbles
            const newBubbles: Bubble[] = updatedBalloons.map((b: DetectedBalloon, i: number) => {
                // Coordinate Conversion (Pixels -> 0-1000)
                const scaleX = 1000 / imgNaturalSize.w;
                const scaleY = 1000 / imgNaturalSize.h;

                // b.box is [x, y, w, h]
                const bx = b.box ? b.box[0] : 0;
                const by = b.box ? b.box[1] : 0;
                const bw = b.box ? b.box[2] : 100;
                const bh = b.box ? b.box[3] : 100;

                const x1 = bx * scaleX;
                const y1 = by * scaleY;
                const x2 = (bx + bw) * scaleX;
                const y2 = (by + bh) * scaleY;

                return {
                    id: `ocr-${Date.now()}-${i}`,
                    text: b.text || '',
                    box_2d: [y1, x1, y2, x2], // [ymin, xmin, ymax, xmax]
                    shape: 'rectangle',
                    type: 'speech',
                    customFontSize: 13,
                    borderRadius: 20,
                    borderWidth: 1,
                    tailWidth: 40,
                    roughness: 1,
                    tailTip: null // No tail detected yet, user will add
                };
            });

            setBubbles(newBubbles);
            setDetectedBalloons([]); // Clear debug view

            alert(`OCR Concluído!\n\n${newBubbles.length} balões convertidos para edição!`);

        } catch (error: any) {
            console.error("OCR Error:", error);
            alert(`Erro OCR: ${error.message}`);
        } finally {
            setReadingOCR(false);
        }
    };


    const updateBubble = (id: string, updates: Partial<Bubble>) => {
        setBubbles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const getSelectedBubble = () => bubbles.find(b => b.id === selectedBubbleId);

    const addTailToSelected = () => {
        if (!selectedBubbleId) return;
        const bubble = getSelectedBubble();
        if (!bubble) return;

        const [, xmin, ymax, xmax] = bubble.box_2d;
        const centerX = xmin + (xmax - xmin) / 2;
        const bottomY = ymax;

        updateBubble(selectedBubbleId, {
            tailTip: { x: centerX + 50, y: bottomY + 100 },
            tailCurve: null
        });
    }

    // --- MANUAL MANAGEMENT ---
    const handleAddBalloon = () => {
        // Create a default bubble in center (approx)
        // 1000x1000 coord system
        const newId = `manual-${Date.now()}`;
        const newBubble: Bubble = {
            id: newId,
            text: '',
            box_2d: [400, 400, 600, 600], // [ymin, xmin, ymax, xmax] -> 200x200 box at center
            shape: 'rectangle',
            type: 'speech',
            customFontSize: 13,
            borderRadius: 20,
            borderWidth: 1,
            tailWidth: 40,
            roughness: 1,
            tailTip: null
        };
        setBubbles(prev => [...prev, newBubble]);
        setSelectedBubbleId(newId);
    };

    const handleDeleteBalloon = () => {
        if (!selectedBubbleId) return;
        if (confirm("Tem certeza que deseja excluir este balão?")) {
            setBubbles(prev => prev.filter(b => b.id !== selectedBubbleId));
            setSelectedBubbleId(null);
        }
    };

    // Keyboard Shortcut for Delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBubbleId) {
                // Ensure we are not editing text
                if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
                    setBubbles(prev => prev.filter(b => b.id !== selectedBubbleId));
                    setSelectedBubbleId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedBubbleId]);



    // Effective Image to Show
    let currentImageUrl = imageUrl;
    if (maskPreviewUrl) {
        currentImageUrl = maskPreviewUrl;
    } else if (showClean && cleanImageUrl) {
        currentImageUrl = cleanImageUrl;
    }

    return (
        <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col font-sans text-gray-200">
            {/* Top Bar - REDESIGNED */}
            <div className="bg-[#141416] border-b border-[#27272a] px-4 py-3 flex items-center justify-between shadow-sm z-50 h-14">
                {/* 1. Breadcrumbs Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                    >
                        {comicName || 'Quadrinho'}
                    </button>
                    <span className="text-gray-600">/</span>
                    <span className="text-sm font-bold text-white">{pageName || 'Página'}</span>
                </div>

                {/* 2. Placeholder Menus (Center) */}
                {/* 2. Primary Menus (Center) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
                    {/* Real Menus from Home */}
                    {[
                        'Editorial',
                        'Tradução',
                        'Animação',
                        'Leitura Guiada',
                        'Acessibilidade',
                        'Limpar'
                    ].map(menu => (
                        <button
                            key={menu}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${menu === 'Limpar' && showClean ? 'bg-purple-900/20 text-purple-400 border border-purple-500/30' : 'text-text-secondary hover:bg-white/10 hover:text-white'}`}
                        >
                            {menu}
                        </button>
                    ))}
                </div>

                {/* 3. Actions & Close */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-red-900/20 hover:text-red-400 text-gray-400 transition-colors"
                        title="Fechar Editor"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Sub-Toolbar (Existing Tools moved down?? or keep them floating?) */}
            {/* The user didn't ask to move tools, but said '3 Menus'. I'll keep the tools in a secondary bar or just below if needed.
                For now I will render the existing tool buttons in a secondary lighter bar below the main header, because the main header is now 'Navigation + Menu'.
             */}
            <div className="bg-[#18181b] border-b border-[#27272a] px-4 py-2 flex items-center justify-center gap-4 shadow-inner">
                <button
                    onClick={handleAddBalloon}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-medium transition-colors border border-[#3f3f46]"
                    title="Adicionar Balão Manualmente"
                >
                    <Plus size={14} />
                    Add Balão
                </button>


                <button
                    onClick={handleYOLOAnalyze}
                    disabled={analyzingYOLO}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-xs text-white transition-all shadow-lg shadow-orange-500/10 transform hover:scale-105 active:scale-95
                             ${analyzingYOLO
                            ? 'bg-[#27272a] text-gray-500 cursor-wait'
                            : 'bg-orange-600 hover:bg-orange-500'
                        }`}
                >
                    <Zap size={14} fill="currentColor" />
                    {analyzingYOLO ? 'YOLO...' : 'Detectar'}
                </button>

                <button
                    onClick={handleOCR}
                    disabled={readingOCR || detectedBalloons.length === 0}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-xs text-white transition-all shadow-lg shadow-purple-500/10 transform hover:scale-105 active:scale-95
                             ${readingOCR
                            ? 'bg-[#27272a] text-gray-500 cursor-wait'
                            : 'bg-purple-600 hover:bg-purple-500'
                        }`}
                >
                    <MessageSquare size={14} fill="currentColor" />
                    {readingOCR ? 'Lendo...' : 'Ler Texto'}
                </button>

                {/* Clean Button */}
                {cleanImageUrl ? (
                    <button
                        onMouseDown={() => setShowClean(false)}
                        onMouseUp={() => setShowClean(true)}
                        onMouseLeave={() => setShowClean(true)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm border bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/30`}
                    >
                        <Wand2 size={14} />
                        Segure para Comparar
                    </button>
                ) : (
                    <button
                        onClick={handleCleanPage}
                        disabled={isCleaning || bubbles.length === 0}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm border
                                ${isCleaning
                                ? 'bg-[#27272a] text-purple-400/50 border-transparent cursor-not-allowed'
                                : 'bg-[#27272a] text-purple-400 border-[#3f3f46] hover:bg-[#3f3f46] hover:border-[#52525b]'
                            }`}
                    >
                        {isCleaning ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : <Wand2 size={14} />}
                        {isCleaning ? 'Limpando...' : 'Limpar Página'}
                    </button>
                )}
            </div>

            {/* MASK PREVIEW OVERLAY CONTROLS */}
            {maskPreviewUrl && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#18181b] border border-[#27272a] p-4 rounded-xl shadow-2xl z-[100] flex flex-col items-center gap-3 animate-slideDown">
                    <div className="text-sm font-bold text-white uppercase tracking-wider">Aprovar Máscara</div>
                    <div className="text-xs text-gray-400">Verifique se as áreas brancas cobrem os balões.</div>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => {
                                setMaskPreviewUrl(null);
                                setCleanImageUrl(null);
                            }}
                            className="flex-1 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-lg text-xs font-bold text-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                setMaskPreviewUrl(null);
                                setShowClean(true);
                            }}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-bold text-white transition-colors shadow-lg shadow-green-900/20"
                        >
                            APROVAR LIMPEZA
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden flex relative">
                {/* Canvas Area with Drag-to-Scroll */}
                <div
                    className="flex-1 bg-[#09090b] overflow-auto relative cursor-grab active:cursor-grabbing p-10 flex"
                    onMouseDown={(e) => {
                        // Start Panning
                        isPanning.current = true;
                        // Deselect bubble if clicking background
                        setSelectedBubbleId(null);
                    }}
                    onMouseUp={() => isPanning.current = false}
                    onMouseLeave={() => isPanning.current = false}
                    onMouseMove={(e) => {
                        if (isPanning.current && e.buttons === 1) {
                            e.preventDefault();
                            e.currentTarget.scrollLeft -= e.movementX;
                            e.currentTarget.scrollTop -= e.movementY;
                        }
                    }}
                >
                    <div
                        ref={containerRef}
                        style={{
                            maxWidth: "100%", // Use CSS max-width instead of calculated dimensions
                            maxHeight: "100%",
                            transition: 'width 0.1s ease-out, height 0.1s ease-out'
                        }}
                        className="relative bg-white shadow-2xl ring-1 ring-white/10 m-auto shrink-0"
                    >
                        <img
                            src={currentImageUrl}
                            alt="Comic Page"
                            className="max-w-none block select-none shadow-2xl w-full h-full"
                            draggable={false}
                            onLoad={(e) => setImgNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                            style={{
                                pointerEvents: 'none'
                            }}
                        />

                        {/* YOLO SVG Overlay (Debug Layer - Hidden for now) */}
                        {/* {detectedBalloons.length > 0 && imgNaturalSize.w > 0 && (
                            <svg
                                className="absolute top-0 left-0 w-full h-full pointer-events-auto"
                                viewBox={`0 0 ${imgNaturalSize.w} ${imgNaturalSize.h}`}
                                style={{ pointerEvents: 'none' }} // Let clicks pass through empty areas
                            >
                                {detectedBalloons.map(b => {
                                    const isSelectedBubble = selectedBubbleId === `yolo-${b.id}`;
                                    const d = pointsToPath(b.polygon);

                                    return (
                                        <path
                                            key={b.id}
                                            d={d}
                                            stroke="green"
                                            strokeWidth="2"
                                            fill="rgba(0, 255, 0, 0.3)"
                                            onClick={() => alert(`Balão ID: ${b.id}\nConfiança: ${b.confidence.toFixed(2)}\n${b.text ? 'Texto: ' + b.text : '(Texto não lido)'}`)}
                                            style={{
                                                cursor: 'pointer',
                                                vectorEffect: 'non-scaling-stroke'
                                            }}
                                        />
                                    );
                                })}
                            </svg>
                        )} */}
                        {bubbles.map((bubble) => (
                            <VectorBubble
                                isZooming={false} // This prop seems unused or specific to interaction logic
                                zoom={zoom} // <--- Pass the zoom level
                                isSelected={selectedBubbleId === bubble.id}
                                key={bubble.id}
                                bubble={bubble}
                                containerRef={containerRef}
                                onSelect={() => setSelectedBubbleId(bubble.id)}
                                onUpdateBox={(b) => updateBubble(bubble.id, { box_2d: b })}
                                onUpdateTail={(t) => updateBubble(bubble.id, { tailTip: t })}
                                onUpdateText={(text) => updateBubble(bubble.id, { text })}
                            />
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-[#141416] border-l border-[#27272a] flex flex-col z-20 shadow-2xl">
                    <div className="px-6 py-3 border-b border-[#27272a] bg-[#141416] flex justify-between items-center">
                        <h3 className="text-[10px] uppercase tracking-widest text-[#71717a] font-bold">Propriedades</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {selectedBubbleId ? (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                {/* Shape Selector */}
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
                                                onClick={() => updateBubble(selectedBubbleId, { shape: opt.id as any })}
                                                className={`p-3 rounded-lg flex flex-col items-center gap-2 border transition-all ${getSelectedBubble()?.shape === opt.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-[#27272a] border-transparent text-[#71717a] hover:bg-[#3f3f46] hover:text-gray-200'}`}
                                            >
                                                {opt.icon}
                                                <span className="text-[10px] font-medium">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Style Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs text-[#71717a] font-bold uppercase">Estilo</label>
                                    <div className="flex gap-1 bg-[#27272a] p-1 rounded-lg">
                                        <button onClick={() => updateBubble(selectedBubbleId, { type: 'speech' })} className={`flex-1 py-1.5 text-xs rounded-md transition-all ${getSelectedBubble()?.type === 'speech' ? 'bg-blue-600 text-white shadow' : 'text-[#71717a] hover:text-gray-200'}`}>Fala</button>
                                        <button onClick={() => updateBubble(selectedBubbleId, { type: 'thought' })} className={`flex-1 py-1.5 text-xs rounded-md transition-all ${getSelectedBubble()?.type === 'thought' ? 'bg-blue-600 text-white shadow' : 'text-[#71717a] hover:text-gray-200'}`}>Pensamento</button>
                                        <button onClick={() => updateBubble(selectedBubbleId, { type: 'whisper' })} className={`flex-1 py-1.5 text-xs rounded-md transition-all ${getSelectedBubble()?.type === 'whisper' ? 'bg-blue-600 text-white shadow' : 'text-[#71717a] hover:text-gray-200'}`}>Sussurro</button>
                                    </div>
                                </div>

                                {/* Dynamic Sliders based on Shape */}
                                <div className="space-y-5 border-t border-[#27272a] pt-5">
                                    {getSelectedBubble()?.shape === 'rectangle' && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between"><label className="text-xs text-[#71717a]">Arredondamento</label><span className="text-xs text-gray-400">{Math.round(getSelectedBubble()?.borderRadius ?? 20)}</span></div>
                                            <input type="range" min="0" max="50" value={getSelectedBubble()?.borderRadius ?? 20} onChange={(e) => updateBubble(selectedBubbleId, { borderRadius: parseInt(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded cursor-pointer accent-blue-500 appearance-none" />
                                        </div>
                                    )}
                                    {(getSelectedBubble()?.shape === 'cloud' || getSelectedBubble()?.shape === 'scream') && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between"><label className="text-xs text-[#71717a]">Intensidade</label><span className="text-xs text-gray-400">{getSelectedBubble()?.roughness ?? 1}</span></div>
                                            <input type="range" min="0.1" max="5" step="0.1" value={getSelectedBubble()?.roughness ?? 1} onChange={(e) => updateBubble(selectedBubbleId, { roughness: parseFloat(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded cursor-pointer accent-blue-500 appearance-none" />
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center"><label className="text-xs text-[#71717a]">Espessura da Borda</label><span className="text-xs text-gray-400">{getSelectedBubble()?.borderWidth ?? 3}px</span></div>
                                        <input type="range" min="0" max="30" value={getSelectedBubble()?.borderWidth ?? 3} onChange={(e) => updateBubble(selectedBubbleId, { borderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded cursor-pointer accent-blue-500 appearance-none" />
                                    </div>

                                    {getSelectedBubble()?.tailTip && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center"><label className="text-xs text-[#71717a]">Largura da Base</label><span className="text-xs text-gray-400">{getSelectedBubble()?.tailWidth ?? 40}px</span></div>
                                            <input type="range" min="5" max="100" value={getSelectedBubble()?.tailWidth ?? 40} onChange={(e) => updateBubble(selectedBubbleId, { tailWidth: parseInt(e.target.value) })} className="w-full h-1 bg-[#27272a] rounded cursor-pointer accent-blue-500 appearance-none" />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center"><label className="text-xs text-[#71717a]">Tamanho da Fonte</label><span className="text-xs text-gray-400">{getSelectedBubble()?.customFontSize}px</span></div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateBubble(selectedBubbleId, { customFontSize: Math.max(6, (getSelectedBubble()?.customFontSize ?? 16) - 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200 font-bold transition-colors">-</button>
                                            <input
                                                type="number"
                                                value={getSelectedBubble()?.customFontSize ?? 16}
                                                onChange={(e) => updateBubble(selectedBubbleId, { customFontSize: parseInt(e.target.value) })}
                                                className="flex-1 bg-[#18181b] border border-[#27272a] rounded text-center text-xs py-1.5 focus:border-blue-500 outline-none text-gray-200"
                                            />
                                            <button onClick={() => updateBubble(selectedBubbleId, { customFontSize: Math.min(100, (getSelectedBubble()?.customFontSize ?? 16) + 1) })} className="w-8 h-8 flex items-center justify-center bg-[#27272a] hover:bg-[#3f3f46] rounded text-gray-200 font-bold transition-colors">+</button>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#27272a] pt-5">
                                        <label className="text-xs text-[#71717a] font-bold uppercase mb-2 block">Texto</label>
                                        <textarea
                                            value={getSelectedBubble()?.text || ''}
                                            onChange={(e) => updateBubble(selectedBubbleId, { text: e.target.value })}
                                            rows={4}
                                            className="w-full bg-[#18181b] border border-[#27272a] rounded p-3 text-xs text-gray-200 focus:border-blue-500 outline-none resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#27272a]">
                                    <button onClick={addTailToSelected} className="w-full py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-blue-400 border border-blue-900/30 rounded-lg text-xs font-bold uppercase transition-all shadow-sm hover:shadow-md hover:border-blue-500/50">
                                        {getSelectedBubble()?.tailTip ? 'Reposicionar Rabinho' : 'Adicionar Rabinho'}
                                    </button>
                                </div>

                                {/* Delete Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={handleDeleteBalloon}
                                        className="w-full py-2.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 hover:border-red-500/50 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} />
                                        Excluir Balão
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#52525b] text-xs p-8 text-center border-2 border-dashed border-[#27272a] rounded-xl">
                                <MousePointer2 className="mb-3 opacity-50" size={32} />
                                <p className="mb-4">Selecione um balão na imagem para editar suas propriedades.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- SUPER VECTOR ENGINE ---

interface VectorProps {
    bubble: Bubble;
    containerRef: React.RefObject<HTMLDivElement>;
    isSelected: boolean;
    isZooming: boolean;
    zoom: number; // <--- New Prop
    onSelect: () => void;
    onUpdateBox: (newBox: number[]) => void;
    onUpdateTail: (newTail: { x: number, y: number }) => void;
    onUpdateText: (text: string) => void;
}

const VectorBubble: React.FC<VectorProps> = ({ bubble, containerRef, isSelected, onSelect, onUpdateBox, onUpdateTail, onUpdateText, zoom = 1 }) => {
    // Refs
    const isDragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startBox = useRef(bubble.box_2d);

    // Resize/Edit Refs
    const isResizing = useRef(false);
    const isDraggingTail = useRef(false);
    const resizeHandle = useRef<string | null>(null);
    const startTail = useRef<{ x: number, y: number } | null>(null);

    // Local State
    const [isEditing, setIsEditing] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const [ymin, xmin, ymax, xmax] = bubble.box_2d;

    // --- MATH HELPERS ---
    const getRectIntersection = (angle: number, w: number, h: number) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        if (Math.abs(cos) * h > Math.abs(sin) * w) {
            const x = (Math.sign(cos) * w) / 2;
            const y = x * (sin / cos);
            return { x, y };
        } else {
            const y = (Math.sign(sin) * h) / 2;
            const x = y * (cos / sin);
            return { x, y };
        }
    };

    const getEllipseIntersection = (angle: number, w: number, h: number) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const a = w / 2;
        const b = h / 2;
        const r = 1 / Math.sqrt((cos * cos) / (a * a) + (sin * sin) / (b * b));
        return { x: r * cos, y: r * sin };
    };

    // --- EVENT HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isSelected) {
            onSelect();
            setIsEditing(false); // Reset edit on select
        }
        e.stopPropagation();
        if (!containerRef.current) return;
        isDragging.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startBox.current = [...bubble.box_2d];
        bindEvents();
    };

    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation(); e.preventDefault();
        isResizing.current = true;
        resizeHandle.current = handle;
        startPos.current = { x: e.clientX, y: e.clientY };
        startBox.current = [...bubble.box_2d];
        bindEvents();
    };

    const handleTailStart = (e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        isDraggingTail.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        startTail.current = bubble.tailTip ? { ...bubble.tailTip } : { x: 0, y: 0 };
        bindEvents();
    }

    const bindEvents = () => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scaleX = 1000 / rect.width;
        const scaleY = 1000 / rect.height;

        const deltaX = (e.clientX - startPos.current.x) * scaleX;
        const deltaY = (e.clientY - startPos.current.y) * scaleY;

        if (isDragging.current) {
            const [oy1, ox1, oy2, ox2] = startBox.current;
            onUpdateBox([oy1 + deltaY, ox1 + deltaX, oy2 + deltaY, ox2 + deltaX]);
        }
        else if (isResizing.current) {
            let [y1, x1, y2, x2] = startBox.current;
            if (resizeHandle.current?.includes('n')) y1 += deltaY;
            if (resizeHandle.current?.includes('s')) y2 += deltaY;
            if (resizeHandle.current?.includes('w')) x1 += deltaX;
            if (resizeHandle.current?.includes('e')) x2 += deltaX;
            if (y2 - y1 < 20) y2 = y1 + 20;
            if (x2 - x1 < 20) x2 = x1 + 20;
            onUpdateBox([y1, x1, y2, x2]);
        }
        else if (isDraggingTail.current && startTail.current) {
            onUpdateTail({ x: startTail.current.x + deltaX, y: startTail.current.y + deltaY });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        isResizing.current = false;
        isDraggingTail.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // Toggle Edit Mode
    const toggleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(!isEditing);
        if (!isEditing) {
            // Give focus next tick
            setTimeout(() => textAreaRef.current?.focus(), 50);
        }
    };

    // --- RENDER LOGIC ---
    const w = xmax - xmin;
    const h = ymax - ymin;
    const cx = xmin + w / 2;
    const cy = ymin + h / 2;

    let mainPathD = "";

    // 1. Body Geometry
    if (bubble.shape === 'rectangle') {
        const r = bubble.borderRadius ?? 20;
        const rSafe = Math.min(r, w / 2, h / 2);
        mainPathD = `M ${xmin + rSafe} ${ymin} H ${xmax - rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmax} ${ymin + rSafe} V ${ymax - rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmax - rSafe} ${ymax} H ${xmin + rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmin} ${ymax - rSafe} V ${ymin + rSafe} A ${rSafe} ${rSafe} 0 0 1 ${xmin + rSafe} ${ymin} Z`;
    }
    else if (bubble.shape === 'ellipse') {
        const rx = w / 2;
        const ry = h / 2;
        mainPathD = `M ${xmin} ${cy} A ${rx} ${ry} 0 1 0 ${xmax} ${cy} A ${rx} ${ry} 0 1 0 ${xmin} ${cy} Z`;
    }
    else {
        // Procedural
        const segments = bubble.shape === 'cloud' ? 12 : 30;
        const rx = w / 2; const ry = h / 2;
        const roughness = bubble.roughness ?? 1;

        if (bubble.shape === 'cloud') {
            mainPathD = `M ${cx + rx} ${cy}`;
            for (let i = 1; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const prevAngle = ((i - 1) / segments) * Math.PI * 2;
                const px = cx + rx * Math.cos(angle);
                const py = cy + ry * Math.sin(angle);
                const midAngle = (angle + prevAngle) / 2;
                const bumpSize = 1.3 * roughness;
                const cpX = cx + rx * Math.cos(midAngle) * bumpSize;
                const cpY = cy + ry * Math.sin(midAngle) * bumpSize;
                mainPathD += ` Q ${cpX} ${cpY} ${px} ${py}`;
            }
            mainPathD += " Z";
        } else {
            // Scream
            const points = [];
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const spike = (i % 2) * 40 * roughness;
                const rLocalX = rx + (Math.cos(angle) * spike);
                const rLocalY = ry + (Math.sin(angle) * spike);
                const px = cx + Math.cos(angle) * rLocalX;
                const py = cy + Math.sin(angle) * rLocalY;
                points.push({ x: px, y: py });
            }
            mainPathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ") + " Z";
        }
    }

    // 2. Tail Geometry (No more Curve Control)
    let tailPathD = "";
    let connectorPatch = null;
    const isThought = bubble.type === 'thought';
    const isWhisper = bubble.type === 'whisper';

    if (bubble.tailTip && !isThought) {
        // Simple V-Shape with logic
        const dx = bubble.tailTip.x - cx;
        const dy = bubble.tailTip.y - cy;
        const angle = Math.atan2(dy, dx);

        // Intersection
        let perimeterPt = { x: cx, y: cy };
        if (bubble.shape === 'ellipse' || bubble.shape === 'cloud' || bubble.shape === 'scream') {
            perimeterPt = getEllipseIntersection(angle, w, h);
        } else {
            perimeterPt = getRectIntersection(angle, w, h);
        }
        const anchorX = cx + perimeterPt.x;
        const anchorY = cy + perimeterPt.y;

        const tailW = bubble.tailWidth ?? 40;
        const perpAngle = angle + Math.PI / 2;
        const bx1 = anchorX + Math.cos(perpAngle) * (tailW / 2);
        const by1 = anchorY + Math.sin(perpAngle) * (tailW / 2);
        const bx2 = anchorX - Math.cos(perpAngle) * (tailW / 2);
        const by2 = anchorY - Math.sin(perpAngle) * (tailW / 2);

        // Curve Point (Green Dot Position)
        // Assuming tailControl is available from bubble.tailControl or similar
        // For now, let's define a placeholder if not explicitly provided in bubble
        // Curve Point: Not used for straight tail, but we keep calculations for the patch if needed
        // For 100% straight tail, we just go from Base -> Tip -> Base

        // Tail Path (Straight Triangle, OPEN at the base to avoid stroke there)
        // M bx1 by1 (Start at one base corner)
        // L tipX tipY (Go to tip)
        // L bx2 by2 (Go to other base corner)
        // No 'Z' so no line is drawn back to bx1
        tailPathD = `M ${bx1} ${by1} L ${bubble.tailTip.x} ${bubble.tailTip.y} L ${bx2} ${by2}`;

        // Inner Point for Patch (Move slightly inwards from anchor to cover border)
        // Use a slightly larger offset to ensure coverage
        const innerX = anchorX - Math.cos(angle) * 8;
        const innerY = anchorY - Math.sin(angle) * 8;

        // Connector Patch (To hide bubble border at intersection)
        connectorPatch = (
            <path
                d={`M ${bx1} ${by1} L ${bx2} ${by2} L ${innerX} ${innerY} Z`}
                fill="white"
                stroke="none"
            />
        );
    }

    return (
        <>
            <svg
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                style={{ overflow: 'visible', zIndex: isSelected ? 30 : 20 }}
                viewBox="0 0 1000 1000" preserveAspectRatio="none"
            >
                {/* 1. Main Body */}
                <path
                    d={mainPathD}
                    fill="white"
                    stroke="black"
                    strokeWidth={bubble.borderWidth ?? 3}
                    strokeDasharray={isWhisper ? "10,10" : ""}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />

                {/* 2. Tail */}
                {!isThought && bubble.tailTip && (
                    <path
                        d={tailPathD}
                        fill="white"
                        stroke="black"
                        strokeWidth={bubble.borderWidth ?? 3}
                        strokeLinejoin="round"
                    />
                )}

                {/* 3. Patch */}
                {connectorPatch}

                {/* 4. Thought Content */}
                {isThought && bubble.tailTip && (
                    <g>
                        {[0.2, 0.45, 0.75].map((t, i) => {
                            const size = 15 + i * 10;
                            const tip = bubble.tailTip!;
                            const bx = tip.x + (cx - tip.x) * t;
                            const by = tip.y + (cy - tip.y) * t;
                            return <circle key={i} cx={bx} cy={by} r={size} fill="white" stroke="black" strokeWidth={bubble.borderWidth ?? 3} />
                        })}
                    </g>
                )}
            </svg>

            {/* Interaction & Text Layer */}
            <div
                className={`absolute flex items-center justify-center text-center cursor-move select-none`}
                style={{
                    top: `${(ymin / 1000) * 100}%`,
                    left: `${(xmin / 1000) * 100}%`,
                    height: `${h / 10}%`,
                    width: `${w / 10}%`,
                    zIndex: isSelected ? 31 : 21
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="w-full h-full p-2 relative z-10 font-bold leading-tight flex items-center justify-center">
                    {isEditing ? (
                        <textarea
                            ref={textAreaRef}
                            className="w-full h-full bg-transparent resize-none border-none outline-none text-center font-bold leading-tight pointer-events-auto"
                            style={{
                                fontFamily: '"Comic Neue", cursive',
                                fontSize: `${(bubble.customFontSize ?? 13) * zoom}px`, // <--- SCALED
                                color: 'black',
                                overflow: 'hidden'
                            }}
                            value={bubble.text}
                            onChange={(e) => onUpdateText(e.target.value)}
                            onBlur={() => setIsEditing(false)}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div style={{ fontFamily: '"Comic Neue", cursive', fontSize: `${(bubble.customFontSize ?? 13) * zoom}px`, color: 'black' }}>
                            {bubble.text}
                        </div>
                    )}
                </div>

                {isSelected && (
                    <>
                        {/* Handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize z-40 shadow-sm" onMouseDown={(e) => handleResizeStart(e, 'se')} />

                        {/* Edit Button */}
                        <button
                            onClick={toggleEdit}
                            className="absolute -top-8 -right-1 bg-white text-blue-600 p-1 rounded-full shadow-md border hover:bg-gray-50 z-50 pointer-events-auto transition-transform hover:scale-110"
                            title="Editar Texto"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* Tail Handle */}
            {isSelected && bubble.tailTip && (
                <div
                    className="absolute w-3 h-3 bg-orange-500 rounded-full cursor-pointer z-50 hover:scale-125 transition-transform shadow-sm border border-white"
                    style={{ top: `calc(${(bubble.tailTip.y / 1000) * 100}% - 6px)`, left: `calc(${(bubble.tailTip.x / 1000) * 100}% - 6px)` }}
                    onMouseDown={handleTailStart}
                    title="Mover Rabinho"
                />
            )}
        </>
    )
}

export default EditorView
