import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { spawn, ChildProcess } from 'child_process'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register 'media' as a privileged scheme BEFORE app is ready
// This allows media:// URLs to be treated like standard URLs (fetch, CORS, etc.)
protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

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

    pythonProcess = spawn(pythonExecutable, [backendPath, '--ignore', 'ignore'], {
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
    // Register handler for media:// URLs
    // Chromium normalizes media:///Users/path to media://users/path (host=users, path=/path)
    // We need to reconstruct the original absolute path: /Users/path
    protocol.handle('media', (request) => {
        const url = new URL(request.url);
        // Reconstruct: /<hostname><pathname> (hostname becomes first path segment)
        // Example: media://users/jp/Documents -> /Users/jp/Documents
        // Note: hostname is lowercased by browser, so we capitalize first letter for macOS
        const hostname = url.hostname;
        const capitalizedHost = hostname.charAt(0).toUpperCase() + hostname.slice(1);
        const filePath = decodeURIComponent(`/${capitalizedHost}${url.pathname}`);
        console.log(`[media] Request: ${request.url} -> file://${filePath}`);
        return net.fetch(`file://${filePath}`);
    });

    startPythonSubprocess()
    createWindow()
    setupIpcHandlers()
})

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

    // FileSystem (Legacy API)
    ipcMain.handle('get-file-system', async () => {
        const result = await requestPython('GET', '/filesystem');
        return result || [];
    });

    // === PHASE 1: LOCAL SAVE BRIDGE ===
    // These handlers allow the Frontend to speak directly to the Disk

    // 1. Select Directory Dialog
    ipcMain.handle('select-directory', async () => {
        if (!win) return null;
        const result = await dialog.showOpenDialog(win, {
            properties: ['openDirectory', 'createDirectory']
        });
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    // 2. Write File
    ipcMain.handle('write-file', async (_, { path: filePath, content }) => {
        try {
            await fs.promises.writeFile(filePath, content, 'utf-8');
            return { success: true };
        } catch (error: any) {
            console.error('Failed to write file:', filePath, error);
            return { success: false, error: error.message };
        }
    });

    // 3. Read File
    ipcMain.handle('read-file', async (_, filePath) => {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return { success: true, content };
        } catch (error: any) {
            console.error('Failed to read file:', filePath, error);
            return { success: false, error: error.message };
        }
    });

    // 4. Create Directory
    ipcMain.handle('create-directory', async (_, dirPath) => {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
            return { success: true };
        } catch (error: any) {
            console.error('Failed to create directory:', dirPath, error);
            return { success: false, error: error.message };
        }
    });

    // 5. Read Directory (List Files)
    ipcMain.handle('read-directory', async (_, dirPath) => {
        try {
            const dirents = await fs.promises.readdir(dirPath, { withFileTypes: true });
            const files = dirents.map(dirent => ({
                name: dirent.name,
                isDirectory: dirent.isDirectory(),
                // Add explicit file extension check if needed later
            }));
            return { success: true, files };
        } catch (error: any) {
            console.error('Failed to read directory:', dirPath, error);
            return { success: false, error: error.message };
        }
    });

    // 6. Copy File (for local imports)
    ipcMain.handle('copy-file', async (_, { sourcePath, destPath }) => {
        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            await fs.promises.mkdir(destDir, { recursive: true });
            await fs.promises.copyFile(sourcePath, destPath);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to copy file:', sourcePath, '->', destPath, error);
            return { success: false, error: error.message };
        }
    });

    // 7. Select Files Dialog (returns full paths - bypasses browser security)
    ipcMain.handle('select-files', async (_, options?: { filters?: { name: string, extensions: string[] }[] }) => {
        console.log('[select-files] Handler called with options:', options);
        if (!win) return { success: false, error: 'No window' };
        const result = await dialog.showOpenDialog(win, {
            properties: ['openFile', 'multiSelections'],
            filters: options?.filters || [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'] },
                { name: 'PDF', extensions: ['pdf'] },
                { name: 'Comics', extensions: ['cbz', 'cbr', 'cb7'] }
            ]
        });
        console.log('[select-files] Dialog result:', result);
        if (result.canceled) return { success: false, canceled: true };
        return { success: true, filePaths: result.filePaths };
    });

    // 8. Download File from URL (for cleaned images from backend)
    ipcMain.handle('download-file', async (_, { url, destPath }) => {
        try {
            console.log('[download-file] Downloading:', url, '->', destPath);

            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            await fs.promises.mkdir(destDir, { recursive: true });

            // Fetch the file
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
            }

            // Get the buffer and write to file
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.promises.writeFile(destPath, buffer);

            console.log('[download-file] Success:', destPath);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to download file:', url, '->', destPath, error);
            return { success: false, error: error.message };
        }
    });

    // 9. Delete File/Folder (for local project deletion)
    ipcMain.handle('delete-path', async (_, targetPath: string) => {
        try {
            console.log('[delete-path] Deleting:', targetPath);

            const stats = await fs.promises.stat(targetPath);

            if (stats.isDirectory()) {
                // Recursively delete directory
                await fs.promises.rm(targetPath, { recursive: true, force: true });
            } else {
                // Delete single file
                await fs.promises.unlink(targetPath);
            }

            console.log('[delete-path] Success:', targetPath);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete path:', targetPath, error);
            return { success: false, error: error.message };
        }
    });
}
