import { protocol, app, BrowserWindow, net, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
protocol.registerSchemesAsPrivileged([
  { scheme: "media", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);
let win;
let pythonProcess = null;
function startPythonSubprocess() {
  const backendPath = path.join(path.resolve(__dirname$1, "../../"), "backend/main.py");
  console.log("Starting Python process target:", backendPath);
  const possiblePaths = [
    path.join(process.resourcesPath, "../backend/venv/bin/python"),
    // Production
    path.join(__dirname$1, "../../backend/venv/bin/python"),
    // Dev (from dist-electron)
    path.join(process.cwd(), "../backend/venv/bin/python"),
    // Dev (from root)
    path.join(process.cwd(), "backend/venv/bin/python")
    // Dev fallback
  ];
  let pythonExecutable = "python3";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      pythonExecutable = p;
      console.log("✅ Python VENV found at:", pythonExecutable);
      break;
    }
  }
  pythonProcess = spawn(pythonExecutable, [backendPath, "--ignore", "ignore"], {
    cwd: path.dirname(backendPath),
    // Run inside backend folder so imports work
    stdio: "inherit"
    // Pipe output to parent console
  });
  pythonProcess.on("error", (err) => {
    console.error("Failed to start python process:", err);
  });
  app.on("will-quit", () => {
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });
}
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#09090b",
    // Fix white flash
    show: false,
    // Wait until ready-to-show
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: true,
      contextIsolation: true
      // Required for contextBridge
    }
  });
  win.once("ready-to-show", () => {
    win == null ? void 0 : win.show();
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  protocol.handle("media", (request) => {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const capitalizedHost = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    const filePath = decodeURIComponent(`/${capitalizedHost}${url.pathname}`);
    console.log(`[media] Request: ${request.url} -> file://${filePath}`);
    return net.fetch(`file://${filePath}`);
  });
  startPythonSubprocess();
  createWindow();
  setupIpcHandlers();
});
const requestPython = async (method, endpoint, body) => {
  try {
    const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : void 0
    });
    if (!response.ok) throw new Error(`Backend error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error calling Python ${endpoint}:`, error);
    return null;
  }
};
function setupIpcHandlers() {
  ipcMain.handle("get-projects", async () => {
    return await requestPython("GET", "/projects");
  });
  ipcMain.handle("create-project", async (_, data) => {
    return await requestPython("POST", "/projects", data);
  });
  ipcMain.handle("update-project", async (_, data) => {
    const { id, ...updates } = data;
    return await requestPython("PUT", `/projects/${id}`, updates);
  });
  ipcMain.handle("delete-project", async (_, id) => {
    return await requestPython("DELETE", `/projects/${id}`);
  });
  ipcMain.handle("get-file-system", async () => {
    const result = await requestPython("GET", "/filesystem");
    return result || [];
  });
  ipcMain.handle("select-directory", async () => {
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory", "createDirectory"]
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });
  ipcMain.handle("write-file", async (_, { path: filePath, content }) => {
    try {
      await fs.promises.writeFile(filePath, content, "utf-8");
      return { success: true };
    } catch (error) {
      console.error("Failed to write file:", filePath, error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("read-file", async (_, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return { success: true, content };
    } catch (error) {
      console.error("Failed to read file:", filePath, error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("create-directory", async (_, dirPath) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return { success: true };
    } catch (error) {
      console.error("Failed to create directory:", dirPath, error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("read-directory", async (_, dirPath) => {
    try {
      const dirents = await fs.promises.readdir(dirPath, { withFileTypes: true });
      const files = dirents.map((dirent) => ({
        name: dirent.name,
        isDirectory: dirent.isDirectory()
        // Add explicit file extension check if needed later
      }));
      return { success: true, files };
    } catch (error) {
      console.error("Failed to read directory:", dirPath, error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("copy-file", async (_, { sourcePath, destPath }) => {
    try {
      const destDir = path.dirname(destPath);
      await fs.promises.mkdir(destDir, { recursive: true });
      await fs.promises.copyFile(sourcePath, destPath);
      return { success: true };
    } catch (error) {
      console.error("Failed to copy file:", sourcePath, "->", destPath, error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("select-files", async (_, options) => {
    console.log("[select-files] Handler called with options:", options);
    if (!win) return { success: false, error: "No window" };
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile", "multiSelections"],
      filters: (options == null ? void 0 : options.filters) || [
        { name: "All Files", extensions: ["*"] },
        { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"] },
        { name: "PDF", extensions: ["pdf"] },
        { name: "Comics", extensions: ["cbz", "cbr", "cb7"] }
      ]
    });
    console.log("[select-files] Dialog result:", result);
    if (result.canceled) return { success: false, canceled: true };
    return { success: true, filePaths: result.filePaths };
  });
  ipcMain.handle("download-file", async (_, { url, destPath }) => {
    try {
      console.log("[download-file] Downloading:", url, "->", destPath);
      const destDir = path.dirname(destPath);
      await fs.promises.mkdir(destDir, { recursive: true });
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(destPath, buffer);
      console.log("[download-file] Success:", destPath);
      return { success: true };
    } catch (error) {
      console.error("Failed to download file:", url, "->", destPath, error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("delete-path", async (_, targetPath) => {
    try {
      console.log("[delete-path] Deleting:", targetPath);
      const stats = await fs.promises.stat(targetPath);
      if (stats.isDirectory()) {
        await fs.promises.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(targetPath);
      }
      console.log("[delete-path] Success:", targetPath);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete path:", targetPath, error);
      return { success: false, error: error.message };
    }
  });
}
