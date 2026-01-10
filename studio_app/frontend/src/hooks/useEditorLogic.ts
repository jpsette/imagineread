import React, { useState, useEffect, useRef } from 'react';
import { Balloon, DetectedBalloon } from '../types';
import { api } from '../services/api';
import { yoloToBalloons } from '../utils/balloonConverter';
import { useAppStore } from '../store/useAppStore';

export const useEditorLogic = (
    fileId: string,
    initialBalloons: Balloon[] | null | undefined,
    imageUrl: string
) => {
    // --- STATE ---
    const [balloons, setBalloons] = useState<Balloon[]>(() => {
        if (initialBalloons && Array.isArray(initialBalloons) && initialBalloons.length > 0) {
            return initialBalloons;
        }
        return [];
    });

    // Refs for accessing latest state in async/callbacks without re-bind
    const balloonsRef = useRef<Balloon[]>(balloons);
    useEffect(() => {
        balloonsRef.current = balloons;
    }, [balloons]);

    const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

    // Store Actions
    const { pushToHistory } = useAppStore();

    // Async States
    const [analyzingYOLO, setAnalyzingYOLO] = useState(false);
    const [readingOCR, setReadingOCR] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanImageUrl, setCleanImageUrl] = useState<string | null>(null);
    const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | null>(null);
    const [showClean, setShowClean] = useState(false);

    const [yoloDetections, setYoloDetections] = useState<DetectedBalloon[]>([]);

    // --- AUTO SAVE ---
    // --- AUTO SAVE ---
    // Track last saved state to prevent save loops or save-on-mount
    const lastSavedRef = useRef<string>(JSON.stringify(balloons));

    useEffect(() => {
        if (!fileId) return;

        const currentString = JSON.stringify(balloons);
        if (currentString === lastSavedRef.current) return;

        const timer = setTimeout(async () => {
            try {
                await api.updateFileBalloons(fileId, balloons);
                console.log("💾 Auto-saved balloons");
                lastSavedRef.current = currentString;
            } catch (e) {
                console.error("Auto-save error", e);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [balloons, fileId]);

    // --- HELPER: WRAPPED SETTER ---
    // Safely pushes to history before update
    const setBalloonsWithHistory = (label: string, newState: Balloon[] | ((prev: Balloon[]) => Balloon[])) => {
        const current = balloonsRef.current;
        pushToHistory(label, current);

        setBalloons(prev => {
            const next = typeof newState === 'function' ? newState(prev) : newState;
            return next;
        });
    };

    // --- ACTIONS ---

    const updateBubble = React.useCallback((id: string, updates: Partial<Balloon>, skipHistory = false) => {
        const keys = Object.keys(updates).join(', ');
        const isSlider = 'borderWidth' in updates || 'customFontSize' in updates || 'roughness' in updates || 'borderRadius' in updates;

        const current = balloonsRef.current;

        // Push History (before update) IF not skipping and not a slider (or controlled externally)
        // User request: dragging (transient) passes skipHistory=true, then commitHistory separately.
        // Inspectors pass skipHistory=true/false? Inspectors usually want instant save? 
        // Let's assume Inspectors want instant history unless they are sliders.
        // But if Inspectors pass skipHistory=false, we keep old behavior.

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
    }, []); // Removed pushToHistory dep as wrapper handles it. Actually setBalloonsWithHistory isn't stable unless ref-based? It isn't wrapped.
    // Ideally setBalloonsWithHistory should be stable or used inside.
    // We defined it in scope. It depends on 'pushToHistory'.

    const handleDeleteBalloon = React.useCallback(() => {
        if (!selectedBubbleId) return;
        if (confirm("Tem certeza que deseja excluir este balão?")) {
            setBalloonsWithHistory("Delete Balloon", prev => prev.filter(b => b.id !== selectedBubbleId));
            setSelectedBubbleId(null);
        }
    }, [selectedBubbleId]); // Wrapper in scope

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
                setCleanImageUrl(data.clean_image_url);
            } else {
                setCleanImageUrl(data.clean_image_url);
                setShowClean(true);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Erro ao limpar: ${error.message}`);
        } finally {
            setIsCleaning(false);
        }
    };

    // --- KEYBOARD ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBubbleId) {
                if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
                    setBalloonsWithHistory("Delete Balloon", prev => prev.filter(b => b.id !== selectedBubbleId));
                    setSelectedBubbleId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBubbleId]); // Removed pushToHistory dep


    return {
        // State
        balloons,
        setBalloons, // Exposed for direct history restore
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
        setCleanImageUrl,
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
        handleCleanPage
    };
};
