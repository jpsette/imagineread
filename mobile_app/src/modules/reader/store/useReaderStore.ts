import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ComicManifest } from '../types/Manifest';
import { LibraryService } from '../../library/services/LibraryService';
import { ComicRepository } from '../../library/repositories/ComicRepository';

interface ReaderState {
    // Data
    manifest: ComicManifest | null;
    currentPageIndex: number;
    currentFocusIndex: number; // For Cinematic Mode

    // UI/Viewing State
    controlsVisible: boolean;
    isCinematic: boolean;
    scale: number;
    showGrid: boolean; // For debugging or specialized view

    // Preferences
    textSize: number; // 0.8 to 1.5
    language: 'en' | 'pt' | 'es' | 'jp';
    hapticsEnabled: boolean;
    isTTSEnabled: boolean;

    // Reading State
    isBookmarked: boolean;

    // Actions
    setManifest: (manifest: ComicManifest) => void;
    toggleControls: () => void;
    setZoom: (scale: number) => void;
    toggleCinematic: () => void;

    // Navigation
    goToPage: (index: number) => void;
    nextPage: () => void;
    prevPage: () => void;

    // Cinematic Navigation
    goToNextStep: () => void;
    goToPrevStep: () => void;

    // Prefs Actions
    toggleHaptics: () => void;
    setTextSize: (size: number) => void;
    setLanguage: (lang: 'en' | 'pt' | 'es' | 'jp') => void;
    toggleTTS: () => void;

    // Bookmark Actions
    checkBookmarkStatus: (comicId: string) => Promise<void>;
    toggleBookmark: (comicId: string) => Promise<void>;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
    // Defaults
    manifest: null,
    currentPageIndex: 0,
    currentFocusIndex: 0,
    controlsVisible: true,
    isCinematic: false,
    scale: 1,
    showGrid: false,
    textSize: 1.0,
    language: 'en',
    hapticsEnabled: true,
    isTTSEnabled: false,
    isBookmarked: false,

    setManifest: (manifest) => set({ manifest }),
    toggleControls: () => set((state) => ({ controlsVisible: !state.controlsVisible })),
    setZoom: (scale) => set({ scale }),

    toggleCinematic: () => {
        const { isCinematic } = get();
        set({ isCinematic: !isCinematic, currentFocusIndex: 0, scale: 1 });
        // Auto-hide controls when entering cinematic
        if (!isCinematic) {
            set({ controlsVisible: false });
        }
    },

    goToPage: (index) => {
        const { manifest, hapticsEnabled } = get();
        if (!manifest || index < 0 || index >= manifest.pages.length) return;

        if (hapticsEnabled && Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }

        set({ currentPageIndex: index, currentFocusIndex: 0 });

        // Update Progress in DB
        // Note: Not awaiting here to avoid UI blocking, handling in background
        LibraryService.updateProgress(manifest.metadata.id, index);

        // Check bookmark status for new page
        get().checkBookmarkStatus(manifest.metadata.id);
    },

    nextPage: () => {
        const { currentPageIndex, goToPage } = get();
        goToPage(currentPageIndex + 1);
    },

    prevPage: () => {
        const { currentPageIndex, goToPage } = get();
        goToPage(currentPageIndex - 1);
    },

    goToNextStep: () => {
        const { currentFocusIndex, manifest, currentPageIndex, nextPage, hapticsEnabled } = get();
        if (!manifest) return;

        const page = manifest.pages[currentPageIndex];
        const focusPoints = page.layers?.focusPoints || [];

        if (currentFocusIndex < focusPoints.length - 1) {
            // Advance Focus
            if (hapticsEnabled && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            set({ currentFocusIndex: currentFocusIndex + 1 });
        } else {
            // Next Page
            nextPage();
        }
    },

    goToPrevStep: () => {
        const { currentFocusIndex, prevPage, hapticsEnabled } = get();

        if (currentFocusIndex > 0) {
            if (hapticsEnabled && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            set({ currentFocusIndex: currentFocusIndex - 1 });
        } else {
            prevPage();
        }
    },

    toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
    setTextSize: (size) => set({ textSize: size }),
    setLanguage: (lang) => set({ language: lang }),
    toggleTTS: () => {
        const { isTTSEnabled, hapticsEnabled } = get();
        if (hapticsEnabled && Platform.OS !== 'web') Haptics.selectionAsync();
        set({ isTTSEnabled: !isTTSEnabled });
    },

    // --- Bookmarks ---
    checkBookmarkStatus: async (comicId) => {
        const { currentPageIndex } = get();
        const isBookmarked = await ComicRepository.isBookmarked(comicId, currentPageIndex);
        set({ isBookmarked });
    },

    toggleBookmark: async (comicId) => {
        const { isBookmarked, currentPageIndex, hapticsEnabled } = get();

        if (hapticsEnabled && Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        if (isBookmarked) {
            await ComicRepository.removeBookmark(comicId, currentPageIndex);
            set({ isBookmarked: false });
        } else {
            await ComicRepository.addBookmark(comicId, currentPageIndex);
            set({ isBookmarked: true });
        }
    }

}));
