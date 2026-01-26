import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Balloon, DetectedBalloon, Panel } from '../types';
import { api } from '../services/api';
import { yoloToBalloons } from '../utils/balloonConverter';
import { useEditorStore } from '../features/editor/store';
import { toast } from 'sonner';
import { useEditorUIStore } from '../features/editor/uiStore';
import { useHistorySync } from '../features/editor/hooks/controllers/useHistorySync';

export const useEditorLogic = (
    fileId: string,
    initialBalloons: Balloon[] | null | undefined,
    imageUrl: string,
    cleanUrl?: string | null, // Added optional cleanUrl
    initialPanels?: Panel[] | null
) => {
    // --- GLOBAL STORE INTEGRATION ---
    const {
        balloons,
        setBalloons,
        panels,
        setPanels
    } = useEditorStore();

    // --- UI STORE INTEGRATION ---
    const {
        cleanImageUrl: storeCleanUrl,
        setCleanImage,
        // New Unified State
        selectedId: selectedBubbleId,
        setSelectedId: setSelectedBubbleId,
        zoom,
        setZoom
    } = useEditorUIStore();

    const queryClient = useQueryClient();

    // --- CONTROLLERS ---
    const { clearAllHistory, pushToHistory } = useHistorySync();

    // --- INTERNAL STATE (Reverted from Controllers for Stability) ---
    // const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null); // MOVED TO STORE
    // const [zoom, setZoom] = useState(1); // MOVED TO STORE
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

    // STRICT RESET: When fileId changes, cleanup. 
    // This MUST ONLY happen when navigating to a NEW file.
    useEffect(() => {
        if (!fileId) return;

        console.log("♻️ [Logic] New File Detected -> Resetting State:", fileId);

        // 1. Clear History
        clearAllHistory();

        // 2. Clear Selection
        setSelectedBubbleId(null);

        // 3. Reset Zoom
        setZoom(1);

        // 3.1 CLEAR PREVIEWS (UI Store)
        useEditorUIStore.getState().setPreviewImages([]);

    }, [fileId, clearAllHistory, setSelectedBubbleId, setZoom]); // removed data dependencies

    // HYDRATION: When data arrives/updates, sync to store.
    // This runs on Load AND after Save (Refetch).
    // Does NOT reset View State.
    useEffect(() => {
        // 4. Hydrate Logic (Balloons)
        if (initialBalloons && Array.isArray(initialBalloons)) {
            // Only update if different? 
            // Ideally we just set it. The Store handles diff? No.
            // But we want to reflect DB state.
            useEditorStore.getState().setBalloons(initialBalloons);
        } else if (fileId && !initialBalloons) {
            // Only clear if initialBalloons is strictly undefined/null AND we have a file (loading error?)
            // Or if explicit empty array passed.
            // If it's the same file reload, we might want to keep local edits?
            // No, "Hydrate" implies Source of Truth from Parent.
            useEditorStore.getState().setBalloons([]);
        }

        // 5. Hydrate Logic (Panels)
        if (initialPanels && Array.isArray(initialPanels)) {
            useEditorStore.getState().setPanels(initialPanels);
        } else if (fileId && !initialPanels) {
            useEditorStore.getState().setPanels([]);
        }

        // 6. Hydrate Clean Image (or clear it)
        if (cleanUrl) {
            setCleanImage(cleanUrl);
        } else {
            // Only clear clean image if we are fairly sure (optional prop)
            setCleanImage(null);
        }

        // 7. RESET DIRTY/SAVED FLAG (Based on Content)
        setTimeout(() => {
            const store = useEditorStore.getState();
            store.setIsDirty(false);
            const hasContent =
                (initialBalloons && initialBalloons.length > 0) ||
                (initialPanels && initialPanels.length > 0) ||
                !!cleanUrl;
            store.setIsSaved(!!hasContent);
        }, 0);

    }, [initialBalloons, initialPanels, cleanUrl, setCleanImage, fileId]); // Data Dependencies Only

    // Refs for accessing latest state in async/callbacks without re-bind
    const balloonsRef = useRef<Balloon[]>(balloons);
    useEffect(() => {
        balloonsRef.current = balloons;
    }, [balloons]);

    // Async States
    const [analyzingYOLO, setAnalyzingYOLO] = useState(false);
    const [readingOCR, setReadingOCR] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | null>(null);

    // Clean Image State mapped to Store
    const cleanImageUrl = storeCleanUrl;
    const [showClean, setShowClean] = useState(false);
    const [yoloDetections, setYoloDetections] = useState<DetectedBalloon[]>([]);

    // --- MANUAL SAVE ---
    const saveChanges = async () => {
        const toastId = toast.loading('Salvando alterações...');
        try {
            const currentBalloons = useEditorStore.getState().balloons;
            const currentPanels = useEditorStore.getState().panels;

            await api.updateFileData(fileId, {
                balloons: currentBalloons,
                panels: currentPanels,
                cleanUrl: cleanImageUrl || undefined,
                isCleaned: showClean
            });

            // Invalidate Cache
            queryClient.invalidateQueries({ queryKey: ['file', fileId] });

            const store = useEditorStore.getState();
            store.setIsDirty(false);
            store.setIsSaved(true);

            toast.success('Salvo com sucesso!', { id: toastId });
        } catch (e: any) {
            console.error("Manual save error", e);
            toast.error(`Erro ao salvar: ${e.message}`, { id: toastId });
        }
    };

    // --- HELPER: WRAPPED SETTER ---
    const setBalloonsWithHistory = (label: string, newState: Balloon[] | ((prev: Balloon[]) => Balloon[])) => {
        const current = balloonsRef.current;
        pushToHistory(label, current);
        setBalloons(newState);
    };

    // --- ACTIONS ---

    const updateBubble = useCallback((id: string, updates: Partial<Balloon>, skipHistory = false) => {
        const keys = Object.keys(updates).join(', ');
        const isSlider = 'borderWidth' in updates || 'customFontSize' in updates || 'roughness' in updates || 'borderRadius' in updates;
        const current = balloonsRef.current;

        if (!skipHistory) {
            if (!isSlider) {
                pushToHistory(`Update ${keys}`, current);
            } else {
                pushToHistory(`Property ${keys}`, current);
            }
        }

        setBalloons(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    }, [pushToHistory]);

    const commitHistory = useCallback((label: string) => {
        pushToHistory(label, balloonsRef.current);
    }, [pushToHistory]);

    // Explicit History wrapper for explicit actions
    const handleAddBalloon = useCallback(() => {
        setBalloonsWithHistory("Add Balloon", prev => {
            const newId = `manual-${Date.now()}`;
            const newBubble: Balloon = {
                id: newId,
                text: '',
                box_2d: [400, 400, 600, 600],
                shape: 'rectangle',
                type: 'speech',
                customFontSize: 12,
                borderRadius: 20,
                borderWidth: 1,
                tailWidth: 20,
                roughness: 1,
                tailTip: { x: 550, y: 650 },
                tailControl: { x: 525, y: 625 }
            };
            setSelectedBubbleId(newId);
            return [...prev, newBubble];
        });
    }, []);

    const handleDeleteBalloon = useCallback(() => {
        if (!selectedBubbleId) return;
        setBalloonsWithHistory("Delete Balloon", prev => prev.filter(b => b.id !== selectedBubbleId));
        setSelectedBubbleId(null);
    }, [selectedBubbleId]);

    const addTailToSelected = useCallback(() => {
        if (!selectedBubbleId) return;
        setBalloonsWithHistory("Toggle Tail", prev => {
            const bubble = prev.find(b => b.id === selectedBubbleId);
            if (!bubble) return prev;

            if (bubble.tailTip) {
                return prev.map(b => b.id === selectedBubbleId ? { ...b, tailTip: null } : b);
            }

            const [, xmin, ymax, xmax] = bubble.box_2d;
            const centerX = xmin + (xmax - xmin) / 2;
            const bottomY = ymax;

            return prev.map(b => b.id === selectedBubbleId ? {
                ...b,
                tailTip: { x: centerX + 50, y: bottomY + 100 },
                tailCurve: null
            } : b);
        });
    }, [selectedBubbleId]);

    // Zoom Action (Re-implemented inline)
    // Zoom Action (Re-implemented inline)
    const handleZoom = useCallback((delta: number) => {
        const currentZoom = useEditorUIStore.getState().zoom;
        const newZoom = Math.max(0.1, Math.min(5, currentZoom + delta));
        useEditorUIStore.getState().setZoom(newZoom);
    }, []);

    const getSelectedBubble = useCallback(() => balloons.find(b => b.id === selectedBubbleId), [balloons, selectedBubbleId]);

    // --- API HANDLERS ---

    const handleYOLOAnalyze = async () => {
        setAnalyzingYOLO(true);
        try {
            const data = await api.detectBalloons(imageUrl);
            const balloons = data.balloons || [];
            setYoloDetections(balloons);
            alert(`${balloons.length} balões detectados.`);
        } catch (error: any) {
            console.error("YOLO Error:", error);
            alert(`Erro YOLO: ${error.message}`);
        } finally {
            setAnalyzingYOLO(false);
        }
    };

    const handleImportBalloons = () => {
        if (yoloDetections.length === 0) {
            alert('Nenhuma detecção YOLO disponível.');
            return;
        }
        setBalloonsWithHistory("Import YOLO", () => {
            return yoloToBalloons(yoloDetections, imgNaturalSize);
        });
        alert(`Balões importados!`);
    };

    const handleOCR = async () => {
        if (yoloDetections.length === 0) {
            alert("Nenhum balão detectado para ler.");
            return;
        }
        setReadingOCR(true);
        try {
            const data = await api.runOcr(imageUrl, yoloDetections);
            const updatedBalloons = data.balloons || [];

            setBalloonsWithHistory("Run OCR", () => {
                const newBubbles = yoloToBalloons(updatedBalloons, imgNaturalSize);
                setYoloDetections([]);
                return newBubbles;
            });
            alert(`OCR Concluído!`);
        } catch (error: any) {
            console.error("OCR Error:", error);
            alert(`Erro OCR: ${error.message}`);
        } finally {
            setReadingOCR(false);
        }
    };

    const handleCleanPage = async () => {
        if (balloons.length === 0) {
            alert("Não há balões detectados para limpar.");
            return;
        }
        setIsCleaning(true);
        try {
            const data = await api.cleanPage(imageUrl, balloons, fileId);
            if (data.debug_mask_url) {
                setMaskPreviewUrl(data.debug_mask_url);
                setCleanImage(data.clean_image_url);
            } else {
                setCleanImage(data.clean_image_url);
                setShowClean(true);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao limpar: ${error.message}`);
        } finally {
            setIsCleaning(false);
        }
    };

    return {
        // State
        balloons,
        setBalloons,
        panels,
        setPanels,
        selectedBubbleId,
        setSelectedBubbleId,
        zoom,
        setZoom,
        imgNaturalSize,
        setImgNaturalSize,
        analyzingYOLO,
        readingOCR,
        isCleaning,
        cleanImageUrl,
        maskPreviewUrl,
        showClean,
        setShowClean,
        yoloDetections,

        // Actions
        updateBubble,
        commitHistory,
        getSelectedBubble,
        handleAddBalloon,
        handleDeleteBalloon,
        addTailToSelected,
        handleZoom,

        // API Actions
        handleYOLOAnalyze,
        handleImportBalloons,
        handleOCR,
        handleCleanPage,
        saveChanges
    };
};
