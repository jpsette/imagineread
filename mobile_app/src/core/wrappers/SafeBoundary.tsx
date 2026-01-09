import React, { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../components/ErrorFallback';

interface SafeBoundaryProps {
    children: ReactNode;
    onReset?: () => void;
}

export function SafeBoundary({ children, onReset }: SafeBoundaryProps) {
    // @ts-ignore
    const logError = (error: Error, info: any) => {
        // TODO: Integrate Sentry or Crashlytics here (PR6)
        console.error("💥 CAUGHT ERROR:", error);
        console.error("Stack:", info.componentStack || "No stack trace");
    };

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={logError}
            onReset={onReset}
        >
            {children}
        </ErrorBoundary>
    );
}
