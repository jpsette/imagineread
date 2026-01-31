/**
 * Electron Bridge Service
 * Abstraction layer for communicating with the Electron Main Process.
 * usage: import { electronBridge } from './services/electronBridge';
 */



class ElectronBridge {

    private get isElectron(): boolean {
        return !!window.electron;
    }

    /**
     * Open a native directory selection dialog.
     * Returns the selected path string or null if canceled.
     */
    async selectDirectory(): Promise<string | null> {
        if (!this.isElectron || !window.electron?.local) {
            console.warn("Electron Bridge: selectDirectory called in non-electron environment.");
            return null;
        }
        return window.electron.local.selectDirectory();
    }

    /**
     * Save content to a local path directly via Electron Node fs.
     */
    async saveFileLocal(path: string, content: any): Promise<boolean> {
        if (!this.isElectron || !window.electron?.local) {
            console.warn("Electron Bridge: saveFileLocal called in non-electron environment.");
            return false;
        }
        const result = await window.electron.local.writeFile(path, typeof content === 'string' ? content : JSON.stringify(content));
        return result.success;
    }
}

export const electronBridge = new ElectronBridge();
