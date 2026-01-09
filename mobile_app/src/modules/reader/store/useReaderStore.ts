import { create } from 'zustand';
import { ReadingMode, ComicPage, FocusPoint } from '../types';
import { ComicManifest, ComicPageManifest } from '../types/Manifest';

interface ReaderState {
    // Settings
    readingMode: ReadingMode;
    textSizeMultiplier: number;
    currentLanguage: string;
    controlsVisible: boolean;
    isCinematic: boolean;

    // Haptics Preference
    isHapticsEnabled: boolean;

    // Data
    manifest: ComicManifest | null;

    // Navigation State
    currentPageIndex: number;
    currentFocusIndex: number;

    // Actions
    setManifest: (manifest: ComicManifest) => void;
    toggleReadingMode: () => void;
    setTextSizeMultiplier: (size: number) => void;
    increaseTextSize: () => void;
    decreaseTextSize: () => void;
    setLanguage: (lang: string) => void;
    cycleLanguage: () => void;
    toggleControls: () => void;
    setControlsVisible: (visible: boolean) => void;
    toggleCinematic: () => void;
    toggleHaptics: () => void;

    // Navigation Actions
    setCurrentPageIndex: (index: number) => void;
    setCurrentFocusIndex: (index: number) => void;
    goToNextStep: () => void;
    goToPrevStep: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
    // Defaults
    readingMode: 'vertical',
    textSizeMultiplier: 1.0,
    currentLanguage: 'en',
    controlsVisible: true,
    isCinematic: false,
    isHapticsEnabled: true,
    manifest: null,
    currentPageIndex: 0,
    currentFocusIndex: 0,

    // Setters
    setManifest: (manifest) => set({ manifest }),

    toggleReadingMode: () => set((state) => ({
        readingMode: state.readingMode === 'vertical' ? 'horizontal' : 'vertical'
    })),
    setTextSizeMultiplier: (size) => set({ textSizeMultiplier: size }),

    increaseTextSize: () => set((state) => ({
        textSizeMultiplier: Math.min(state.textSizeMultiplier + 0.25, 2.0)
    })),
    decreaseTextSize: () => set((state) => ({
        textSizeMultiplier: Math.max(state.textSizeMultiplier - 0.25, 0.5)
    })),

    setLanguage: (lang) => set({ currentLanguage: lang }),

    cycleLanguage: () => set((state) => {
        const langs = ['en', 'pt', 'jp'];
        const currentIndex = langs.indexOf(state.currentLanguage);
        const nextIndex = (currentIndex + 1) % langs.length;
        return { currentLanguage: langs[nextIndex] };
    }),

    toggleControls: () => set((state) => ({ controlsVisible: !state.controlsVisible })),
    setControlsVisible: (visible) => set({ controlsVisible: visible }),

    toggleCinematic: () => set((state) => ({
        isCinematic: !state.isCinematic,
        currentFocusIndex: 0
    })),

    toggleHaptics: () => set((state) => ({ isHapticsEnabled: !state.isHapticsEnabled })),

    setCurrentPageIndex: (index) => set({ currentPageIndex: index, currentFocusIndex: 0 }),
    setCurrentFocusIndex: (index) => set({ currentFocusIndex: index }),

    // Smart Navigation Logic
    goToNextStep: () => {
        const { manifest, currentPageIndex, currentFocusIndex } = get();
        if (!manifest || !manifest.pages.length) return;

        const pages = manifest.pages;
        const currentPage = pages[currentPageIndex];
        // Access focus points from decoupled layers
        const focusPoints = currentPage.layers?.focusPoints || [];

        // 1. Try to advance Focus Point on current page
        if (currentFocusIndex < focusPoints.length - 1) {
            set({ currentFocusIndex: currentFocusIndex + 1 });
            return;
        }

        // 2. If at end of focus points, Advance Page
        if (currentPageIndex < pages.length - 1) {
            set({
                currentPageIndex: currentPageIndex + 1,
                currentFocusIndex: 0
            });
        }
    },

    goToPrevStep: () => {
        const { manifest, currentPageIndex, currentFocusIndex } = get();
        if (!manifest || !manifest.pages.length) return;

        const pages = manifest.pages;

        // 1. Try to go back Focus Point on current page
        if (currentFocusIndex > 0) {
            set({ currentFocusIndex: currentFocusIndex - 1 });
            return;
        }

        // 2. If at start of focus points, Go to Previous Page
        if (currentPageIndex > 0) {
            const prevPageIndex = currentPageIndex - 1;
            const prevPage = pages[prevPageIndex];
            const prevFocusPoints = prevPage.layers?.focusPoints || [];

            set({
                currentPageIndex: prevPageIndex,
                // Set to last focus point of previous page
                currentFocusIndex: Math.max(0, prevFocusPoints.length - 1)
            });
        }
    }
}));
