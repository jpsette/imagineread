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
  // Legacy / Utils
  platform: process.platform,
  versions: process.versions
});
window.addEventListener("DOMContentLoaded", () => {
});
