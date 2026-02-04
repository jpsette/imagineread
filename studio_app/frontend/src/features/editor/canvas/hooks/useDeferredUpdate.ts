import { useState, useEffect, useRef } from 'react';

/**
 * Defers a value update by a specified delay.
 * 
 * Useful for expensive operations that don't need to be real-time,
 * such as updating state for auto-save or analytics.
 * 
 * @param value - The value to defer
 * @param delay - Delay in ms before the value updates (default 300ms)
 * @returns The deferred value
 * 
 * @example
 * const deferredSelection = useDeferredUpdate(selectedId, 500);
 * // Use deferredSelection for non-critical updates like auto-save
 */
export function useDeferredUpdate<T>(value: T, delay = 300): T {
    const [deferred, setDeferred] = useState(value);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Schedule the update
        timeoutRef.current = window.setTimeout(() => {
            setDeferred(value);
            timeoutRef.current = null;
        }, delay);

        // Cleanup on unmount or when value changes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay]);

    return deferred;
}

/**
 * Similar to useDeferredUpdate, but also provides the "pending" state.
 * Useful when you need to know if an update is pending.
 */
export function useDeferredUpdateWithPending<T>(
    value: T,
    delay = 300
): { deferred: T; isPending: boolean } {
    const [deferred, setDeferred] = useState(value);
    const [isPending, setIsPending] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Mark as pending if values differ
        if (value !== deferred) {
            setIsPending(true);
        }

        timeoutRef.current = window.setTimeout(() => {
            setDeferred(value);
            setIsPending(false);
            timeoutRef.current = null;
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay]);

    return { deferred, isPending };
}
