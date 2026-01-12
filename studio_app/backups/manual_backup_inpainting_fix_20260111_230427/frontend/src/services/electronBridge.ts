/**
 * Electron Bridge Service
 * Abstraction layer for communicating with the Electron Main Process.
 * usage: import { electronBridge } from './services/electronBridge';
 */

// Define the shape of the window.electron object exposed by preload.js
// This should match the contextBridge in your electron/preload.ts
interface ElectronAPI {
    openDirectory: () => Promise<string | null>;
    saveFile: (path: string, content: any) => Promise<boolean>;
    getProjects: () => Promise<any[]>;
    // ... add other IPC hooks as they exist in preload
}

// Safer type for window
declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

class ElectronBridge {

    private get isElectron(): boolean {
        return !!window.electron;
    }

    /**
     * Open a native directory selection dialog.
     * Returns the selected path string or null if canceled.
     */
    async selectDirectory(): Promise<string | null> {
        if (!this.isElectron) {
            console.warn("Electron Bridge: selectDirectory called in non-electron environment.");
            // Fallback for web mode could be implemented here if using File System Access API
            return null;
        }
        return window.electron!.openDirectory();
    }

    /**
     * Save content to a local path directly via Electron Node fs.
     */
    async saveFileLocal(path: string, content: any): Promise<boolean> {
        if (!this.isElectron) {
            console.warn("Electron Bridge: saveFileLocal called in non-electron environment.");
            return false;
        }
        return window.electron!.saveFile(path, content);
    }
}

export const electronBridge = new ElectronBridge();
