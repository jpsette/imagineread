
import React, { useRef, useState, useEffect } from 'react';
import { useEditorLogic } from '../../hooks/useEditorLogic'; // Real Logic Hook
import { Balloon } from '../../types';
import { EditorCanvas } from './canvas/EditorCanvas';
import { api } from '../../services/api'; // Correct API Import
import { useEditorStore } from './store'; // Correct local import
import { useAppStore } from '../../store/useAppStore'; // Correct global import
import {
    Scan,
    Check,
    Eye,
    EyeOff,
    MessageCircle,
    Type,
    Eraser,
    Image as ImageIcon,
    Sparkles,
    Save,
    RotateCcw,
    Trash2
} from 'lucide-react';

// --- TYPES ---
type WorkflowStep = 'idle' | 'mask' | 'confirmed';
type EditorMode = 'vectorize' | 'edit' | 'translate' | 'animate';

interface EditorViewProps {
    imageUrl: string;
    fileId: string;
    initialBalloons?: Balloon[] | null;
    cleanUrl?: string | null;
    onBack?: () => void; // Optional to match generic use if needed
    comicName?: string;
    pageName?: string;
}

export const EditorView: React.FC<EditorViewProps> = ({
    imageUrl,
    fileId,
    initialBalloons,
    cleanUrl,
    onBack = () => window.history.back()
}) => {
    // --- GLOBAL STORE ---
    const { balloons, setBalloons } = useEditorStore();

    // --- CORE LOGIC (For Coordinate Scaling & Selection) ---
    const editor = useEditorLogic(fileId, initialBalloons, imageUrl);
    const { imgNaturalSize, selectedBubbleId } = editor;

    // --- LOCAL STATE ---
    // Layout & Navigation
    const [activeMode, setActiveMode] = useState<EditorMode>('vectorize');
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isResizing, setIsResizing] = useState(false);

    // Workflow Logic
    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');
    const [isProcessing, setIsProcessing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Visual Toggles
    const [showMasks, setShowMasks] = useState(true);
    const [showBalloons, setShowBalloons] = useState(true);
    const [showText, setShowText] = useState(true);
    const [isOriginalImage, setIsOriginalImage] = useState(true);
    const [localCleanUrl, setLocalCleanUrl] = useState<string | null>(cleanUrl || null);

    // --- INITIALIZATION ---
    useEffect(() => {
        // Reset state on page load
        setWorkflowStep('idle');
        setLocalCleanUrl(cleanUrl || null);
        setIsOriginalImage(true);
        setShowMasks(true);
        setShowBalloons(true);
        setShowText(true);

        // CRITICAL: Reset balloons store for the new file.
        // Prevents balloons from previous page carrying over.
        setBalloons(initialBalloons || []);

    }, [fileId, imageUrl, cleanUrl, initialBalloons]); // Deep dependency on data

    // Sync Workflow Step based on data
    useEffect(() => {
        if (balloons.length > 0 && workflowStep === 'idle') {
            const hasMasks = balloons.some(b => b.type === 'mask');
            // If we have masks, we are in 'mask' or 'confirmed'?
            // If we have balloons (white), we are likely 'confirmed' and moved on.
            const hasBalloons = balloons.some(b => b.type === 'balloon');

            if (hasBalloons) {
                setWorkflowStep('confirmed');
            } else if (hasMasks) {
                setWorkflowStep('mask');
            }
        }
    }, [balloons, workflowStep]);


    // --- RESIZING LOGIC ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = Math.max(250, Math.min(450, e.clientX));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
        } else {
            document.body.style.cursor = 'default'; // Reset
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);


    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // IGNORE if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // DELETE / BACKSPACE
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (editor.selectedBubbleId) {
                    editor.handleDeleteBalloon();
                }
            }

            // UNDO (Cmd+Z or Ctrl+Z)
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                const { undo } = useAppStore.getState();
                const prevState = undo(balloons);
                if (prevState) {
                    setBalloons(prevState);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editor.selectedBubbleId, balloons, setBalloons]);
    const handleCreateMask = async () => {
        setIsProcessing(true);
        try {
            console.log("Chamando YOLO...");
            const data = await api.detectBalloons(imageUrl);
            const rawBalloons = data.balloons;

            if (!rawBalloons || !Array.isArray(rawBalloons) || rawBalloons.length === 0) {
                alert('Nenhum balão encontrado.');
                return;
            }

            // Coordinate Conversion Logic (Essential)
            const newMasks: Balloon[] = rawBalloons.map((b: any, index: number) => {
                const rawBox = b.box || b.box_2d || b.bbox;
                if (!Array.isArray(rawBox) || rawBox.length < 4) return null;

                let x, y, width, height;
                const [v1, v2, v3, v4] = rawBox.map(Number);
                const { w: imageWidth, h: imageHeight } = imgNaturalSize;
                // Fallbacks
                const safeW = imageWidth || 1000;
                const safeH = imageHeight || 1000;

                // Check if normalized (0-1)
                if (v1 < 1 && v2 < 1 && v3 < 1 && v4 < 1) {
                    x = v2 * safeW;
                    y = v1 * safeH;
                    width = (v4 - v2) * safeW;
                    height = (v3 - v1) * safeH;
                } else {
                    x = v1; y = v2; width = v3; height = v4;
                }

                return {
                    id: `mask - ${Date.now()} -${index} `,
                    type: 'mask',
                    text: b.text || '',
                    box_2d: [y, x, y + height, x + width],
                    shape: 'rectangle',
                    color: 'rgba(255, 0, 0, 0.4)',
                    borderColor: 'red',
                    borderWidth: 2,
                    borderRadius: 4,
                    opacity: 1
                } as unknown as Balloon;
            }).filter((item): item is Balloon => item !== null);

            if (newMasks.length > 0) {
                const existingNonMasks = balloons.filter(b => b.type !== 'mask');
                setBalloons([...existingNonMasks, ...newMasks]);
                setWorkflowStep('mask');
                setShowMasks(true);

                // AUTO-SELECT FIRST MASK
                if (newMasks[0]) {
                    editor.setSelectedBubbleId(newMasks[0].id);
                }
            }

        } catch (e: any) {
            console.error(e);
            alert("Erro ao detectar máscaras: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. CONFIRMAR MÁSCARA
    const handleConfirmMask = () => {
        // Only verify if we have masks or are in mask step
        if (workflowStep === 'mask' || balloons.some(b => b.type === 'mask')) {
            setWorkflowStep('confirmed');
            editor.setSelectedBubbleId(null); // Deselect on confirm
        }
    };

    // 3. DETECTAR BALÃO (Visual Conversion)
    const handleDetectBalloon = () => {
        console.log("Detectando Balão - Convertendo...");
        // Converts RED MASKS -> WHITE BALLOONS (But keeps Masks for Inpainting)
        const newList = balloons.flatMap(b => {
            // Force strict type check
            if (b.type === 'mask') {
                const speechBalloon = {
                    ...b,
                    id: `balloon - ${b.id} `, // FORCE RE-MOUNT with new ID
                    type: 'balloon',
                    color: '#ffffff',
                    borderColor: '#000000',
                    borderWidth: 2,
                    borderRadius: 10,
                    opacity: 1,
                    text: b.text || ""
                } as unknown as Balloon;

                // Return BOTH: Original Mask + New Balloon
                return [b, speechBalloon];
            }
            return [b];
        });

        setBalloons(newList);
        setShowMasks(false); // Auto-hide masks to reduce clutter, but keep them available
    };

    // 4. DETECTAR TEXTO (OCR)
    const handleDetectText = async () => {
        const targetBalloons = balloons.filter(b => b.type === 'balloon');
        if (targetBalloons.length === 0) {
            alert("Converta as máscaras em balões primeiro.");
            return;
        }

        setIsProcessing(true);
        console.log("Chamando OCR (Gemini/Vision)...");

        try {
            // Prepare payload
            // BACKEND FIX: perform_ocr expects "box" as [x, y, w, h]
            // Frontend box_2d is [y1, x1, y2, x2] (normalized or pixel? It is pixel here)
            const apiBalloons = targetBalloons.map(b => {
                const [y1, x1, y2, x2] = b.box_2d;
                return {
                    box: [x1, y1, x2 - x1, y2 - y1], // Correct: [x, y, w, h]
                    text: "",
                    class_name: 'text_bubble'
                };
            });

            console.log("Enviando para OCR:", apiBalloons);
            const result = await api.runOcr(imageUrl, apiBalloons as any);
            console.log("OCR Result:", result);

            if (result && result.balloons) {
                // Update Text
                const updatedBalloons = balloons.map(b => {
                    if (b.type === 'balloon') {
                        // Attempt 1: Match by ID if possible (Future)
                        // Attempt 2: Match by Index (Current)
                        const matchIndex = targetBalloons.indexOf(b);
                        if (matchIndex !== -1 && result.balloons[matchIndex]) {
                            const newText = result.balloons[matchIndex].text;
                            // Only update if text found
                            if (newText) {
                                return { ...b, text: newText };
                            }
                        }
                    }
                    return b;
                });
                setBalloons(updatedBalloons);
            }

        } catch (e: any) {
            console.error(e);
            alert("Erro no OCR: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 5. LIMPAR IMAGEM (Inpainting)
    const handleCleanImage = async () => {
        if (!confirm("Isso irá gerar uma versão sem balões. Continuar?")) return;

        setIsProcessing(true);
        console.log("Chamando Inpainting...");

        try {
            const result = await api.cleanPage(imageUrl, balloons, fileId);
            if (result && result.clean_image_url) {
                setLocalCleanUrl(result.clean_image_url);
                setIsOriginalImage(false); // Switch view
            }
        } catch (e: any) {
            console.error(e);
            alert("Erro na limpeza: " + e.message);
        } finally {
            setIsProcessing(false);
        }
    };



    // --- SAVE LOGIC ---
    const handleSave = async () => {
        if (saveStatus === 'saving') return;

        setSaveStatus('saving');
        try {
            await api.updateFileBalloons(fileId, balloons);
            setSaveStatus('saved');

            // Revert to idle after 2 seconds
            setTimeout(() => {
                setSaveStatus('idle');
            }, 2000);

        } catch (e) {
            console.error("Erro ao salvar:", e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };


    // --- HELPER DE ESTILO (Updated for Disabled Select-None) ---
    // STANDARDIZED: px-4 py-2 text-sm font-medium rounded-md
    const getButtonStyle = (disabled: boolean) =>
        `w-full py-2 px-4 mb-2 text-left rounded-md text-sm font-medium transition-all flex items-center gap-3 select-none border border-transparent ${disabled
            ? 'bg-[#333] text-gray-500 cursor-not-allowed opacity-50'
            : 'bg-[#3f3f46] hover:bg-[#52525b] text-white shadow-sm active:transform active:scale-[0.98]'
        }`;

    // VIEW LOGIC
    const displaySrc = isOriginalImage ? imageUrl : (localCleanUrl || imageUrl);

    // Sort logic: Render Balloons FIRST, then Masks ON TOP (so they are visible)
    const visibleBalloons = React.useMemo(() => {
        let filtered = balloons;

        if (!showMasks) filtered = filtered.filter(b => b.type !== 'mask');
        if (!showBalloons) filtered = filtered.filter(b => b.type !== 'balloon');

        // Hide Text Content if toggle off
        if (!showText) {
            filtered = filtered.map(b => ({ ...b, text: '' }));
        }

        return [...filtered].sort((a, b) => {
            if (a.type === 'mask' && b.type !== 'mask') return 1; // Mask comes later (top)
            if (a.type !== 'mask' && b.type === 'mask') return -1; // Balloon comes first (bottom)
            return 0;
        });
    }, [balloons, showMasks, showBalloons, showText]);


    return (
        <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] overflow-hidden text-sans">

            {/* --- HEADER --- */}
            <header className="relative h-12 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-4 z-50 shrink-0">
                {/* Left: Voltar */}
                <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                    ← Voltar
                </button>

                {/* Center: Navigation Tabs */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-6 h-full">
                    {[
                        { id: 'vectorize', label: 'VETORIZAR' },
                        { id: 'edit', label: 'Editar' },
                        { id: 'translate', label: 'Traduzir' },
                        { id: 'animate', label: 'Animar' }
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setActiveMode(mode.id as EditorMode)}
                            className={`h-full px-2 text-sm font-medium transition-all relative ${activeMode === mode.id
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {mode.label}
                            {activeMode === mode.id && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-w-[140px] justify-center
                            ${saveStatus === 'idle' ? 'bg-[#007AFF] hover:bg-[#0062cc] text-white' : ''}
                            ${saveStatus === 'saving' ? 'bg-gray-700 text-gray-400 cursor-wait' : ''}
                            ${saveStatus === 'saved' ? 'bg-emerald-600 text-white' : ''}
                            ${saveStatus === 'error' ? 'bg-red-600 text-white' : ''}
                        `}
                    >
                        {saveStatus === 'idle' && <><Save size={16} /> Salvar Alterações</>}
                        {saveStatus === 'saving' && <><span className="animate-spin">⏳</span> Salvando...</>}
                        {saveStatus === 'saved' && <><Check size={16} /> Salvo</>}
                        {saveStatus === 'error' && <>Erro ao Salvar</>}
                    </button>

                    {/* Close */}
                    <button onClick={onBack} className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-[#333]">
                        ✕
                    </button>
                </div>
            </header>

            {/* --- MAIN AREA --- */}
            <div className="flex-1 relative w-full h-full bg-[#1e1e1e] overflow-hidden">

                {/* 1. CANVAS LAYER (Background) */}
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <EditorCanvas
                        imageUrl={displaySrc}
                        balloons={visibleBalloons}
                        selectedId={editor.selectedBubbleId}
                        onSelect={(id) => editor.setSelectedBubbleId(id)}
                        onUpdate={(id, attrs) => {
                            const next = balloons.map(b => b.id === id ? { ...b, ...attrs } : b);
                            setBalloons(next);
                        }}
                    />
                </div>

                {/* 2. SIDEBAR LAYER (Floating) */}
                <aside
                    style={{ width: sidebarWidth }}
                    className="absolute top-0 left-0 h-full bg-[#252526] border-r border-[#333] shadow-2xl z-20 flex flex-col"
                >
                    {/* Sidebar Header */}
                    <div className="h-12 border-b border-[#333] flex items-center px-4 shrink-0 bg-[#2d2d2d]">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {activeMode === 'vectorize' ? 'VETORIZAR' : activeMode.toUpperCase()}
                        </span>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                        {/* FERRAMENTAS DO MODO VETORIZAR */}
                        {activeMode === 'vectorize' && (
                            <div className="flex flex-col">

                                {/* 1. Criar Máscara (Logica Dividida) */}
                                {(workflowStep === 'mask' || workflowStep === 'confirmed') ? (
                                    <div className="flex gap-1 mb-2 h-[38px]"> {/* Fixed Height to match standardized buttons */}
                                        {/* Status: Gerado */}
                                        <div className="flex-1 bg-emerald-600 text-white px-4 rounded-l-md flex items-center gap-2 select-none text-sm font-medium">
                                            <Check className="w-4 h-4" />
                                            <span>Gerado</span>
                                        </div>
                                        {/* Action: Refazer */}
                                        <button
                                            onClick={handleCreateMask}
                                            disabled={isProcessing}
                                            className="bg-[#3f3f46] hover:bg-[#52525b] text-white px-3 rounded-r-md flex items-center justify-center transition-colors border-l border-[#333]"
                                            title="Refazer Detecção"
                                        >
                                            <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                ) : (
                                    /* Botão Normal: Gerar Máscara */
                                    <button
                                        className={getButtonStyle(isProcessing)}
                                        onClick={handleCreateMask}
                                        disabled={isProcessing}
                                    >
                                        <Scan className="w-5 h-5" /> <span>Gerar Máscara</span>
                                    </button>
                                )}

                                {/* 2. Confirmar Máscara */}
                                <button
                                    className={`${getButtonStyle(workflowStep !== 'mask' && workflowStep !== 'confirmed')} ${workflowStep === 'confirmed' ? '!bg-emerald-600 !text-white hover:!bg-emerald-700' : ''
                                        }`}
                                    disabled={workflowStep !== 'mask' && workflowStep !== 'confirmed'}
                                    onClick={handleConfirmMask}
                                >
                                    {workflowStep === 'confirmed' ? (
                                        <><Check className="w-5 h-5" /> <span>Máscara Confirmada</span></>
                                    ) : (
                                        <><Check className="w-5 h-5" /> <span>Confirmar Máscara</span></>
                                    )}
                                </button>

                                {/* TOGGLE: Visualizar Máscara */}
                                <div
                                    className={`flex items-center gap-2 mt-1 mb-4 px-4 transition-all ${(workflowStep === 'mask' || workflowStep === 'confirmed')
                                        ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                                        : 'opacity-30 cursor-not-allowed'
                                        }`}
                                    onClick={() => {
                                        if (workflowStep === 'mask' || workflowStep === 'confirmed') {
                                            setShowMasks(!showMasks);
                                        }
                                    }}
                                >
                                    {showMasks ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                                    <span className="text-xs text-gray-400 font-medium">
                                        {showMasks ? 'Esconder Máscara' : 'Visualizar Máscara'}
                                    </span>
                                </div>

                                <div className="h-px bg-[#333] w-full my-2"></div>

                                {/* 3. Detectar Balão */}
                                <button
                                    className={`${getButtonStyle(workflowStep !== 'confirmed')} ${balloons.some(b => b.type === 'balloon') ? '!bg-emerald-600 !text-white hover:!bg-emerald-700' : ''
                                        }`}
                                    disabled={workflowStep !== 'confirmed'}
                                    onClick={handleDetectBalloon}
                                >
                                    {balloons.some(b => b.type === 'balloon') ? (
                                        <><Check className="w-5 h-5" /> <span>Balões Detectados</span></>
                                    ) : (
                                        <><MessageCircle className="w-5 h-5" /> <span>Detectar Balão</span></>
                                    )}
                                </button>

                                {/* TOGGLE: Visualizar Balões */}
                                <div
                                    className={`flex items-center gap-2 mt-1 mb-4 px-4 transition-all ${balloons.some(b => b.type === 'balloon')
                                        ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                                        : 'opacity-30 cursor-not-allowed'
                                        }`}
                                    onClick={() => {
                                        if (balloons.some(b => b.type === 'balloon')) {
                                            setShowBalloons(!showBalloons);
                                        }
                                    }}
                                >
                                    {showBalloons ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                                    <span className="text-xs text-gray-400 font-medium">
                                        {showBalloons ? 'Esconder Balões' : 'Visualizar Balões'}
                                    </span>
                                </div>

                                {/* 4. Detectar Texto */}
                                <button
                                    className={`${getButtonStyle(workflowStep !== 'confirmed' || isProcessing)} ${balloons.some(b => b.text && b.text.length > 0) ? '!bg-emerald-600 !text-white hover:!bg-emerald-700' : ''}`}
                                    disabled={workflowStep !== 'confirmed' || isProcessing}
                                    onClick={handleDetectText}
                                >
                                    {balloons.some(b => b.text && b.text.length > 0) ? (
                                        <><Check className="w-5 h-5" /> <span>Texto Detectado</span></>
                                    ) : (
                                        <><Type className="w-5 h-5" /> <span>Detectar Texto</span></>
                                    )}
                                </button>

                                {/* TOGGLE: Visualizar Texto */}
                                <div
                                    className={`flex items - center gap - 2 mt - 1 mb - 4 px - 4 transition - all ${balloons.some(b => b.text && b.text.length > 0)
                                        ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                                        : 'opacity-30 cursor-not-allowed'
                                        } `}
                                    onClick={() => {
                                        if (balloons.some(b => b.text && b.text.length > 0)) {
                                            setShowText(!showText);
                                        }
                                    }}
                                >
                                    {showText ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                                    <span className="text-xs text-gray-400 font-medium">
                                        {showText ? 'Esconder Texto' : 'Visualizar Texto'}
                                    </span>
                                </div>

                                <div className="h-px bg-[#333] w-full my-2"></div>

                                {/* 5. Limpar Imagem */}
                                <button
                                    className={getButtonStyle(workflowStep !== 'confirmed' || isProcessing)}
                                    disabled={workflowStep !== 'confirmed' || isProcessing}
                                    onClick={handleCleanImage}
                                >
                                    <Eraser className="w-5 h-5" /> <span className="font-medium text-sm">Limpar Imagem</span>
                                </button>

                                {/* TOGGLE: Ver Original */}
                                <div
                                    className={`flex items - center gap - 2 mt - 1 px - 4 transition - all ${localCleanUrl
                                        ? 'opacity-100 cursor-pointer hover:bg-[#333]/50 rounded py-1'
                                        : 'opacity-30 cursor-not-allowed'
                                        } `}
                                    onClick={() => {
                                        if (localCleanUrl) {
                                            setIsOriginalImage(!isOriginalImage);
                                        }
                                    }}
                                >
                                    {isOriginalImage ? <ImageIcon className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                                    <span className="text-xs text-gray-400 font-medium">
                                        {isOriginalImage ? 'Ver Imagem Limpa' : 'Ver Imagem Original'}
                                    </span>
                                </div>

                            </div>
                        )}

                        {/* OUTROS MODOS (Placeholder) */}
                        {activeMode !== 'vectorize' && (
                            <div className="text-gray-500 text-xs text-center mt-10 italic">
                                Ferramentas de {activeMode} em breve.
                            </div>
                        )}

                    </div>

                    {/* Resizer Handle */}
                    <div
                        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500/50 transition-colors z-30"
                        title="Arrastar largura"
                    />
                </aside>

            </div>
        </div>
    );
};

export default EditorView;
