export class LocalProjectRegistry {
    private static STORAGE_KEY = 'ir_local_projects_registry';

    static getRegisteredPaths(): string[] {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch (e) {
            console.error("Failed to load local project registry", e);
            return [];
        }
    }

    static registerPath(path: string): void {
        const paths = this.getRegisteredPaths();
        if (!paths.includes(path)) {
            const newPaths = [...paths, path];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newPaths));
        }
    }

    static unregisterPath(path: string): void {
        const paths = this.getRegisteredPaths();
        const newPaths = paths.filter(p => p !== path);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newPaths));
    }

    static clearRegistry(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
