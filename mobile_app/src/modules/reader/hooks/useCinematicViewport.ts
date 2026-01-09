import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { FocusPoint } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface UseCinematicViewportProps {
    currentFocusIndex: number;
    currentFocusPoint: FocusPoint | undefined; // Pass specific point, simpler than array logic inside
    enabled: boolean;
    baseImageWidth: number;
}

export function useCinematicViewport({
    currentFocusIndex, // Used as dependency trigger
    currentFocusPoint,
    enabled,
    baseImageWidth
}: UseCinematicViewportProps) {

    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        if (!enabled || !currentFocusPoint) {
            // Reset
            scale.value = withTiming(1);
            translateX.value = withTiming(0);
            translateY.value = withTiming(0);
            return;
        }

        const target = currentFocusPoint;

        // Calculation Logic (Standardized)
        // 1. Display Scale of the Image
        const displayScale = SCREEN_WIDTH / baseImageWidth;

        // 2. Target dimensions in Screen Pixels
        const targetDisplayWidth = target.width * displayScale;
        const targetDisplayHeight = target.height * displayScale;
        const targetCenterX = (target.x + target.width / 2) * displayScale;
        const targetCenterY = (target.y + target.height / 2) * displayScale;

        // 3. Zoom Factor
        const widthRatio = SCREEN_WIDTH / targetDisplayWidth;
        const heightRatio = SCREEN_HEIGHT / targetDisplayHeight;
        let zoomLevel = Math.min(widthRatio, heightRatio) * 0.95;
        zoomLevel = Math.min(Math.max(zoomLevel, 1), 4); // Clamp

        // 4. Center Offset
        const screenCenterX = SCREEN_WIDTH / 2;
        const screenCenterY = SCREEN_HEIGHT / 2;

        // transform origin is top-left (0,0) usually
        // We want the point (targetCenterX, targetCenterY) to move to (screenCenterX, screenCenterY)
        // AFTER scaling is applied.
        // Reanimated transform order: translate -> scale (usually?) or scale -> translate?
        // In React Native styles:
        // transform: [{ translateX }, { translateY }, { scale }]
        // Applied right to left (or bottom to top in array): Scale first, then Translate.
        // So: NewPoint = (OldPoint * Scale) + Translate

        // We want: ScreenCenter = (TargetCenter * Zoom) + Translate
        // Thus: Translate = ScreenCenter - (TargetCenter * Zoom)

        // However, if we scale from center, it's different. 
        // Default transform origin in RN is center of the element.
        // BUT we are animating a specific View (the Page container). 
        // If we scale the Page Container, it scales from its center.
        // Let's assume we used `anchorPoint` or similar trick, but simplified math:
        // If origin is center of view (which is at W/2, H/2):
        // It's complicated.

        // ALTERNATIVE: Use origin top-left (0,0) by setting style or doing math.
        // Standard `transform: override origin` isn't easy in RN without `transformOrigin` (new feature).

        // HEURISTIC ADJUSTMENT for MVP:
        // Just calculating offset assuming we are moving the "camera".

        const xOffset = (screenCenterX - targetCenterX * zoomLevel);
        // Note: The above formula assumes we are scaling "content" relative to 0,0 
        // OR we simply move the content so the point is centered, then scale?
        // Keep with the simple offset calculation for now, refine if jittery.

        const yOffset = (screenCenterY - targetCenterY * zoomLevel);

        scale.value = withSpring(zoomLevel);
        translateX.value = withSpring(xOffset);
        translateY.value = withSpring(yOffset);

    }, [currentFocusIndex, currentFocusPoint, enabled]);

    const animatedStyle = useAnimatedStyle(() => ({
        // If using Matrix transformation logic, we'd use useAnimatedProps with matrix.
        // Simple transform array:
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return { animatedStyle };
}
