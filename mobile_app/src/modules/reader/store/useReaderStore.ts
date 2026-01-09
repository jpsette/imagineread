import { create } from 'zustand';
import { ReadingMode, ComicPage, FocusPoint } from '../types';

interface ReaderState {
    // Settings
    readingMode: ReadingMode;
    textSizeMultiplier: number;
    currentLanguage: string;
    controlsVisible: boolean;
    isCinematic: boolean;

    // Data
    pages: ComicPage[];

    // Navigation State
    currentPageIndex: number;
    currentFocusIndex: number; // Index within the current page's focusPoints

    // Computed helpers (optional, but useful if we weren't using strict actions)
    // totalPages: number;

    // Actions
    setPages: (pages: ComicPage[]) => void;
    toggleReadingMode: () => void;
    setTextSizeMultiplier: (size: number) => void;
    setLanguage: (lang: string) => void;
    toggleControls: () => void;
    setControlsVisible: (visible: boolean) => void;
    toggleCinematic: () => void;

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
    pages: [],
    currentPageIndex: 0,
    currentFocusIndex: 0,

    // Setters
    setPages: (pages) => set({ pages }),
    toggleReadingMode: () => set((state) => ({
        readingMode: state.readingMode === 'vertical' ? 'horizontal' : 'vertical'
    })),
    setTextSizeMultiplier: (size) => set({ textSizeMultiplier: size }),
    setLanguage: (lang) => set({ currentLanguage: lang }),
    toggleControls: () => set((state) => ({ controlsVisible: !state.controlsVisible })),
    setControlsVisible: (visible) => set({ controlsVisible: visible }),

    toggleCinematic: () => set((state) => ({
        isCinematic: !state.isCinematic,
        // Reset focus when entering/exiting to ensure stability, or keep as is.
        // Ideally we snap to the nearest panel, but for MVP reset to 0 of current page is safe.
        currentFocusIndex: 0
    })),

    setCurrentPageIndex: (index) => set({ currentPageIndex: index, currentFocusIndex: 0 }),
    setCurrentFocusIndex: (index) => set({ currentFocusIndex: index }),

    // Smart Navigation Logic
    goToNextStep: () => {
        const { pages, currentPageIndex, currentFocusIndex } = get();
        if (!pages.length) return;

        const currentPage = pages[currentPageIndex];
        const focusPoints = currentPage.focusPoints || [];

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
        const { pages, currentPageIndex, currentFocusIndex } = get();
        if (!pages.length) return;

        // 1. Try to go back Focus Point on current page
        if (currentFocusIndex > 0) {
            set({ currentFocusIndex: currentFocusIndex - 1 });
            return;
        }

        // 2. If at start of focus points, Go to Previous Page
        if (currentPageIndex > 0) {
            const prevPageIndex = currentPageIndex - 1;
            const prevPage = pages[prevPageIndex];
            const prevFocusPoints = prevPage.focusPoints || [];

            set({
                currentPageIndex: prevPageIndex,
                // Set to last focus point of previous page
                currentFocusIndex: Math.max(0, prevFocusPoints.length - 1)
            });
        }
    }
}));
