import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { spawn, ChildProcess } from 'child_process'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null
let pythonProcess: ChildProcess | null = null

function startPythonSubprocess() {
    // We need to resolve the path to the backend folder from the frontend folder.
    // frontend is at /.../frontend
    // backend is at /.../backend
    // We are running electron from frontend/

    const backendPath = path.join(path.resolve(__dirname, '../../'), 'backend/main.py')
    console.log('Starting Python process target:', backendPath)

    // PATH LOGIC to find the correct python executable (VENV)
    const possiblePaths = [
        path.join(process.resourcesPath, '../backend/venv/bin/python'), // Production
        path.join(__dirname, '../../backend/venv/bin/python'), // Dev (from dist-electron)
        path.join(process.cwd(), '../backend/venv/bin/python'), // Dev (from root)
        path.join(process.cwd(), 'backend/venv/bin/python'), // Dev fallback
    ];

    let pythonExecutable = 'python3'; // Fallback to global
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            pythonExecutable = p;
            console.log('✅ Python VENV found at:', pythonExecutable);
            break;
        }
    }

    pythonProcess = spawn(pythonExecutable, [backendPath], {
        cwd: path.dirname(backendPath), // Run inside backend folder so imports work
        stdio: 'inherit' // Pipe output to parent console
    })

    pythonProcess.on('error', (err) => {
        console.error('Failed to start python process:', err)
    })

    // Clean up python process on exit
    app.on('will-quit', () => {
        if (pythonProcess) {
            pythonProcess.kill()
            pythonProcess = null
        }
    })
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#09090b', // Fix white flash
        show: false, // Wait until ready-to-show
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: true,
            contextIsolation: true, // Required for contextBridge
        },
    })

    // Show window only when ready to prevent white flash
    win.once('ready-to-show', () => {
        win?.show()
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(() => {
    startPythonSubprocess()
    createWindow()
    setupIpcHandlers()
})

import { ipcMain } from 'electron'
// Helper for Python requests
const requestPython = async (method: string, endpoint: string, body?: any) => {
    try {
        const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) throw new Error(`Backend error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Error calling Python ${endpoint}:`, error);
        return null; // Return null on error to prevent crash
    }
}

function setupIpcHandlers() {
    ipcMain.handle('get-projects', async () => {
        return await requestPython('GET', '/projects');
    });

    ipcMain.handle('create-project', async (_, data) => {
        return await requestPython('POST', '/projects', data);
    });

    ipcMain.handle('update-project', async (_, data) => {
        const { id, ...updates } = data;
        return await requestPython('PUT', `/projects/${id}`, updates);
    });

    ipcMain.handle('delete-project', async (_, id) => {
        return await requestPython('DELETE', `/projects/${id}`);
    });

    // FileSystem
    ipcMain.handle('get-file-system', async () => {
        const result = await requestPython('GET', '/filesystem');
        return result || [];
    });
}
