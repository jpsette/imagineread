import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Balloon, DetectedBalloon, Panel } from '../types';
import { api } from '../services/api';
import { yoloToBalloons } from '../utils/balloonConverter';
import { useAppStore } from '../store/useAppStore';
import { useEditorStore } from '../features/editor/store';
import { toast } from 'sonner';
import { useEditorUIStore } from '../features/editor/uiStore';

export const useEditorLogic = (
    fileId: string,
    initialBalloons: Balloon[] | null | undefined,
    imageUrl: string,
    cleanUrl?: string | null, // Added optional cleanUrl
    initialPanels?: Panel[] | null // Removed default [] to fix infinite loop
) => {
    // --- GLOBAL STORE INTEGRATION (Fixing State Schizophrenia) ---
    const {
        balloons,
        setBalloons,
        panels,
        setPanels,
        cleanImageUrl: storeCleanUrl,
        setCleanImage
    } = useEditorStore();

    const queryClient = useQueryClient();

    // Use AppStore for History
    const { clearHistory, pushToHistory } = useAppStore();

    // STRICT RESET: When fileId changes, we MUST clean the house.
    // Since we are now using a stable shell, the context persists.
    useEffect(() => {
        // 1. Clear History (Don't want to Undo back into the previous page)
        clearHistory();

        // 2. Clear Selection
        setSelectedBubbleId(null);

        // 3. Reset Zoom (Optional - keeps UX consistent)
        setZoom(1);

        // 4. Hydrate Logic (Balloons)
        console.log("🎣 [Logic] Switch File -> Hydrating:", fileId);
        if (initialBalloons && Array.isArray(initialBalloons) && initialBalloons.length > 0) {
            console.log("📥 [Logic] Hydrating Store with balloons:", initialBalloons.length);
            useEditorStore.getState().setBalloons(initialBalloons);
        } else {
            console.log("🧹 [Logic] No initialBalloons found. Resetting Store to empty.");
            useEditorStore.getState().setBalloons([]);
        }

        // 5. Hydrate Logic (Panels)
        if (initialPanels && Array.isArray(initialPanels) && initialPanels.length > 0) {
            console.log("📥 [Logic] Hydrating Store with panels:", initialPanels.length);
            useEditorStore.getState().setPanels(initialPanels);
        } else {
            console.log("🧹 [Logic] No initialPanels found. Resetting Store to empty.");
            useEditorStore.getState().setPanels([]);
        }

        // 5.1 CLEAR PREVIEWS (UI Store)
        // Fixes issue where gallery shows previous page's panels
        useEditorUIStore.getState().setPreviewImages([]);

        // 6. Hydrate Clean Image (or clear it)
        if (cleanUrl) {
            console.log("💧 [Logic] Hydrating Clean Image from props:", cleanUrl);
            setCleanImage(cleanUrl);
        } else {
            setCleanImage(null); // IMPORTANT: Clear if page has no clean url
        }

        // 7. RESET DIRTY/SAVED FLAG (Based on Content)
        setTimeout(() => {
            const store = useEditorStore.getState();
            store.setIsDirty(false);

            // HEURISTIC: If we have content, assume it's a "Saved" status.
            // If empty, it's a "New" status (Blue Button).
            const hasContent =
                (initialBalloons && initialBalloons.length > 0) ||
                (initialPanels && initialPanels.length > 0) ||
                !!cleanUrl;

            store.setIsSaved(!!hasContent);

            console.log(`✨ [Logic] Hydration Complete. Has Content: ${hasContent} -> Saved: ${!!hasContent}`);
        }, 0);

    }, [fileId, initialBalloons, initialPanels, cleanUrl, setCleanImage, clearHistory]);

    // Refs for accessing latest state in async/callbacks without re-bind

    // Refs for accessing latest state in async/callbacks without re-bind
    // Note: With Store, we can also use useEditorStore.getState().balloons
    const balloonsRef = useRef<Balloon[]>(balloons);
    useEffect(() => {
        balloonsRef.current = balloons;
    }, [balloons]);

    const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

    // Store Actions (Legacy History)
    // Removed duplicate pushToHistory declaration

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
        console.log("🧠 [Logic] Iniciando saveChanges...");
        const toastId = toast.loading('Salvando alterações...');
        try {
            // Unified Save: Balloons (from Store) + Clean Status
            const currentBalloons = useEditorStore.getState().balloons; // Ensure fresh state
            const currentPanels = useEditorStore.getState().panels;
            console.log("📊 [Logic] Estado Atual do Store (Balões):", currentBalloons);
            console.log("📊 [Logic] Estado Atual do Store (Paineis):", currentPanels);
            console.log("📊 [Logic] Estado Atual do Store (CleanUrl):", cleanImageUrl);
            console.log("📊 [Logic] Estado Atual do Variable (ShowClean):", showClean);

            await api.updateFileData(fileId, {
                balloons: currentBalloons,
                panels: currentPanels,
                cleanUrl: cleanImageUrl || undefined,
                isCleaned: showClean
            });
            console.log("✅ [Logic] api.updateFileData concluído com sucesso.");

            // --- CACHE INVALIDATION ---
            // Force React Query to refetch this file next time (e.g. after navigation)
            queryClient.invalidateQueries({ queryKey: ['file', fileId] });

            const store = useEditorStore.getState();
            store.setIsDirty(false); // MARK AS CLEAN
            store.setIsSaved(true);  // MARK AS SAVED (Green)

            toast.success('Salvo com sucesso!', { id: toastId });
        } catch (e: any) {
            console.error("Manual save error", e);
            toast.error(`Erro ao salvar: ${e.message}`, { id: toastId });
        }
    };

    // --- HELPER: WRAPPED SETTER ---
    // Safely pushes to history before update
    // Now updates the Store instead of local state
    const setBalloonsWithHistory = (label: string, newState: Balloon[] | ((prev: Balloon[]) => Balloon[])) => {
        const current = balloonsRef.current;
        pushToHistory(label, current);

        // Update Store
        setBalloons(newState);
    };

    // --- ACTIONS ---

    const updateBubble = React.useCallback((id: string, updates: Partial<Balloon>, skipHistory = false) => {
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

    const commitHistory = React.useCallback((label: string) => {
        pushToHistory(label, balloonsRef.current);
    }, [pushToHistory]);

    const getSelectedBubble = React.useCallback(() => balloons.find(b => b.id === selectedBubbleId), [balloons, selectedBubbleId]);


    // Explicit History wrapper for explicit actions
    const handleAddBalloon = React.useCallback(() => {
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
                // Default tail bottom-right
                tailTip: { x: 550, y: 650 },
                tailControl: { x: 525, y: 625 }
            };
            setSelectedBubbleId(newId);
            return [...prev, newBubble];
        });
    }, []);

    const handleDeleteBalloon = React.useCallback(() => {
        if (!selectedBubbleId) return;
        // Direct delete without confirmation
        setBalloonsWithHistory("Delete Balloon", prev => prev.filter(b => b.id !== selectedBubbleId));
        setSelectedBubbleId(null);
    }, [selectedBubbleId]);

    const addTailToSelected = React.useCallback(() => {
        if (!selectedBubbleId) return;
        setBalloonsWithHistory("Toggle Tail", prev => {
            const bubble = prev.find(b => b.id === selectedBubbleId);
            if (!bubble) return prev;

            // Toggle logic
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
            const convertedBalloons = yoloToBalloons(yoloDetections, imgNaturalSize);
            return convertedBalloons;
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

    // Keyboard listener REMOVED (Handled in EditorView)

    return {
        // State
        balloons,
        setBalloons, // Exposed for direct history restore
        panels, // Added panels
        setPanels, // Added setPanels
        selectedBubbleId,
        zoom,
        analyzingYOLO,
        readingOCR,
        isCleaning,
        cleanImageUrl,
        maskPreviewUrl,
        showClean,
        yoloDetections,
        imgNaturalSize,

        // Setters
        setZoom,
        setSelectedBubbleId,
        setMaskPreviewUrl,
        setCleanImageUrl: setCleanImage,
        setShowClean,
        setImgNaturalSize,

        // Actions
        updateBubble,
        commitHistory,
        getSelectedBubble,
        handleAddBalloon,
        handleDeleteBalloon,
        addTailToSelected,

        // API Actions
        handleYOLOAnalyze,
        handleImportBalloons,
        handleOCR,
        handleCleanPage,
        saveChanges // <--- EXPOSED MANUAL SAVE
    };
};
