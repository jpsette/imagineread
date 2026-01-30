"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  // Projects
  getProjects: () => electron.ipcRenderer.invoke("get-projects"),
  createProject: (data) => electron.ipcRenderer.invoke("create-project", data),
  updateProject: (id, data) => electron.ipcRenderer.invoke("update-project", { id, ...data }),
  deleteProject: (id) => electron.ipcRenderer.invoke("delete-project", id),
  // File System / Comics
  getFileSystem: () => electron.ipcRenderer.invoke("get-file-system"),
  uploadPdf: (projectId, filePath) => electron.ipcRenderer.invoke("upload-pdf", { projectId, filePath }),
  // === PHASE 1: LOCAL SAVE BRIDGE ===
  local: {
    selectDirectory: () => electron.ipcRenderer.invoke("select-directory"),
    writeFile: (path, content) => electron.ipcRenderer.invoke("write-file", { path, content }),
    readFile: (path) => electron.ipcRenderer.invoke("read-file", path),
    createDirectory: (path) => electron.ipcRenderer.invoke("create-directory", path),
    readDirectory: (path) => electron.ipcRenderer.invoke("read-directory", path)
  },
  // Legacy / Utils
  platform: process.platform,
  versions: process.versions
});
window.addEventListener("DOMContentLoaded", () => {
});
