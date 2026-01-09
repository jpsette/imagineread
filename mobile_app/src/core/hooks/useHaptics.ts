import * as Haptics from 'expo-haptics';
import { useReaderStore } from '@/modules/reader/store/useReaderStore';

export const useHaptics = () => {
    // We don't subscribe to the store inside the function calls generally to avoid stale closures,
    // but for the check we can use the store's getter if we were inside a component that rerenders.
    // HOWEVER, hooks should return stable functions. 
    // Let's use `useReaderStore.getState()` for instant access without re-rendering the hook consumer just for the boolean check?
    // User instruction: "Inside each function, first check useReaderStore.getState().isHapticsEnabled"

    const selection = async () => {
        if (useReaderStore.getState().isHapticsEnabled) {
            await Haptics.selectionAsync();
        }
    };

    const impact = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
        if (useReaderStore.getState().isHapticsEnabled) {
            await Haptics.impactAsync(style);
        }
    };

    const notification = async (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
        if (useReaderStore.getState().isHapticsEnabled) {
            await Haptics.notificationAsync(type);
        }
    };

    return {
        selection,
        impact,
        notification
    };
};
