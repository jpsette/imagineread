import { contextBridge, ipcRenderer } from 'electron'

// --- API DEFINITION ---
contextBridge.exposeInMainWorld('electron', {
    // Projects
    getProjects: () => ipcRenderer.invoke('get-projects'),
    createProject: (data: any) => ipcRenderer.invoke('create-project', data),
    updateProject: (id: string, data: any) => ipcRenderer.invoke('update-project', { id, ...data }),
    deleteProject: (id: string) => ipcRenderer.invoke('delete-project', id),

    // File System / Comics
    getFileSystem: () => ipcRenderer.invoke('get-file-system'),
    uploadPdf: (projectId: string, filePath: string) => ipcRenderer.invoke('upload-pdf', { projectId, filePath }),

    // === PHASE 1: LOCAL SAVE BRIDGE ===
    local: {
        selectDirectory: () => ipcRenderer.invoke('select-directory'),
        writeFile: (path: string, content: string) => ipcRenderer.invoke('write-file', { path, content }),
        readFile: (path: string) => ipcRenderer.invoke('read-file', path),
        createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),
        readDirectory: (path: string) => ipcRenderer.invoke('read-directory', path),
    },

    // Legacy / Utils
    platform: process.platform,
    versions: process.versions,
});

window.addEventListener('DOMContentLoaded', () => {
    // ... Any DOM manipulation if needed
})
