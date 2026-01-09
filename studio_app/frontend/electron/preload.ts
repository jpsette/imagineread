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

    // Legacy / Utils
    platform: process.platform,
    versions: process.versions,
});

window.addEventListener('DOMContentLoaded', () => {
    // ... Any DOM manipulation if needed
})
