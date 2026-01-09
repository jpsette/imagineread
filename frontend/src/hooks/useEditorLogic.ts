import { useState, useEffect } from 'react';
import { Balloon, DetectedBalloon } from '../types';
import { api } from '../services/api';
import { yoloToBalloons } from '../utils/balloonConverter';

export const useEditorLogic = (
    fileId: string,
    initialBalloons: Balloon[] | undefined,
    imageUrl: string,
    onBack: () => void
) => {
    // --- STATE ---
    const [balloons, setBalloons] = useState<Balloon[]>(() => {
        if (initialBalloons && Array.isArray(initialBalloons) && initialBalloons.length > 0) {
            return initialBalloons;
        }
        return [];
    });

    const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });

    // Async States
    const [analyzingYOLO, setAnalyzingYOLO] = useState(false);
    const [readingOCR, setReadingOCR] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanImageUrl, setCleanImageUrl] = useState<string | null>(null);
    const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | null>(null);
    const [showClean, setShowClean] = useState(false);

    const [yoloDetections, setYoloDetections] = useState<DetectedBalloon[]>([]);

    // --- AUTO SAVE ---
    useEffect(() => {
        if (!fileId) return;
        const timer = setTimeout(async () => {
            try {
                await api.updateFileBalloons(fileId, balloons);
                console.log("💾 Auto-saved balloons");
            } catch (e) {
                console.error("Auto-save error", e);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [balloons, fileId]);

    // --- ACTIONS ---

    const updateBubble = (id: string, updates: Partial<Balloon>) => {
        setBalloons(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const getSelectedBubble = () => balloons.find(b => b.id === selectedBubbleId);

    const handleAddBalloon = () => {
        const newId = `manual-${Date.now()}`;
        const newBubble: Balloon = {
            id: newId,
            text: '',
            box_2d: [400, 400, 600, 600], // Center 200x200
            shape: 'rectangle',
            type: 'speech',
            customFontSize: 13,
            borderRadius: 20,
            borderWidth: 1,
            tailWidth: 40,
            roughness: 1,
            tailTip: null
        };
        setBalloons(prev => [...prev, newBubble]);
        setSelectedBubbleId(newId);
    };

    const handleDeleteBalloon = () => {
        if (!selectedBubbleId) return;
        if (confirm("Tem certeza que deseja excluir este balão?")) {
            setBalloons(prev => prev.filter(b => b.id !== selectedBubbleId));
            setSelectedBubbleId(null);
        }
    };

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
    };

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
        const convertedBalloons = yoloToBalloons(yoloDetections, imgNaturalSize);
        setBalloons(convertedBalloons);
        alert(`${convertedBalloons.length} balões importados!`);
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

            const newBubbles = yoloToBalloons(updatedBalloons, imgNaturalSize);
            setBalloons(newBubbles);
            setYoloDetections([]);
            alert(`OCR Concluído! ${newBubbles.length} balões.`);
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
                    setBalloons(prev => prev.filter(b => b.id !== selectedBubbleId));
                    setSelectedBubbleId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedBubbleId]);


    return {
        // State
        balloons,
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
