import { useEffect, useRef } from 'react';
import { TelemetryService } from './TelemetryService';

export function useRenderMetric(screenName: string) {
    const startTimeStr = useRef<number>(performance.now());
    const logged = useRef(false);

    useEffect(() => {
        // If we want to measure Time-to-Mount
        const endTime = performance.now();
        const duration = endTime - startTimeStr.current;

        if (!logged.current) {
            TelemetryService.logEvent('render_time', {
                screen: screenName,
                duration_ms: duration
            });
            logged.current = true;
        }

        return () => {
            // Optional: Log unmount or session duration for screen
        };
    }, [screenName]);
}
