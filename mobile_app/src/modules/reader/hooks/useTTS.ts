import { useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useReaderStore } from '../store/useReaderStore';

export function useTTS() {
    const {
        currentFocusIndex,
        isCinematic,
        manifest,
        isTTSEnabled,
        currentPageIndex
    } = useReaderStore();

    const lastSpokenText = useRef<string | null>(null);

    useEffect(() => {
        // Only run if Feature Enabled & In Cinematic Mode & Manifest Loaded
        if (!isTTSEnabled || !isCinematic || !manifest) {
            Speech.stop();
            return;
        }

        const page = manifest.pages[currentPageIndex];
        if (!page || !page.layers?.balloons) return;

        // Find balloon corresponding to focus index (Simplified mapping)
        // Ideally we map FocusPoint -> Balloon ID, but for now we assume index alignment
        // or check if the current focus point is overlapping a balloon.

        // Strategy: We can assume focusPoints and balloons might index differently.
        // For MVP instruction, we just try to find a balloon at the index or fallback.
        const balloon = page.layers.balloons[currentFocusIndex];

        if (balloon && balloon.text) {
            const textToSpeak = balloon.text;

            if (textToSpeak !== lastSpokenText.current) {
                Speech.stop();
                Speech.speak(textToSpeak, {
                    language: 'pt-BR', // Make dynamic later via Store
                    pitch: 1.0,
                    rate: 1.0
                });
                lastSpokenText.current = textToSpeak;
            }
        }

    }, [currentFocusIndex, isCinematic, isTTSEnabled, currentPageIndex, manifest]);

    // Check availability on mount
    useEffect(() => {
        // Optional: Check if TTS engine is available
    }, []);
}
