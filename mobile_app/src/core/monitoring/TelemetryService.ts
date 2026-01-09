type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface Breadcrumb {
    message: string;
    category?: string;
    level?: LogLevel;
    timestamp: number;
    data?: Record<string, any>;
}

class TelemetryServiceImpl {
    private breadcrumbs: Breadcrumb[] = [];
    private MAX_BREADCRUMBS = 15;
    private initialized = false;

    initialize() {
        if (this.initialized) return;
        console.log('[Telemetry] Initializing...');

        // TODO: Initialize Sentry or other providers here
        if (!__DEV__) {
            // Sentry.init({...})
        }

        this.initialized = true;
        this.logEvent('app_start', { timestamp: Date.now() });
    }

    logEvent(name: string, params?: Record<string, any>) {
        // 1. Add to Breadcrumbs
        this.addBreadcrumb(name, 'event', 'info', params);

        // 2. Dev Logging
        if (__DEV__) {
            console.groupCollapsed(`[Telemetry] Event: ${name}`);
            console.log('Params:', params);
            console.groupEnd();
        }

        // 3. Prod Logging (e.g. Analytics)
        if (!__DEV__) {
            // Analytics.logEvent(name, params);
        }
    }

    captureError(error: Error | any, context?: Record<string, any>) {
        // 1. Dev Logging
        if (__DEV__) {
            console.error('[Telemetry] Error Captured:', error);
            if (context) console.log('Context:', context);
            console.log('Breadcrumbs:', this.getBreadcrumbs());
        }

        // 2. Prod Reporting
        if (!__DEV__) {
            // Sentry.captureException(error, { extra: { ...context, breadcrumbs: this.breadcrumbs } });
        }
    }

    startMetric(name: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.logEvent('performance_metric', { metric: name, duration_ms: duration });
        };
    }

    private addBreadcrumb(message: string, category: string = 'default', level: LogLevel = 'info', data?: Record<string, any>) {
        const crumb: Breadcrumb = {
            message,
            category,
            level,
            timestamp: Date.now(),
            data
        };

        this.breadcrumbs.push(crumb);
        if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
            this.breadcrumbs.shift();
        }
    }

    getBreadcrumbs() {
        return [...this.breadcrumbs];
    }
}

export const TelemetryService = new TelemetryServiceImpl();
