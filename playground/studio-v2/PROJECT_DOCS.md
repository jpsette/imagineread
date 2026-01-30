# 📘 Imagine Read - Developer Guide

> **Status:** Active Development  
P26-01-08 16:48:28

## 🌟 Introduction
**Imagine Read** is a high-performance desktop application designed for the professional editing and translation of comic books and manga. It bridges the gap between manual image editing and AI-powered automation.

Unlike standard image editors, Imagine Read is "content-aware." It understands the structure of a comic page—panels, speech bubbles, and text—allowing users to manipulate these elements semantically.

### Core Philosophy
1.  **Local First:** All processing (AI, file management) happens locally or via private API keys. No data is stored on external servers.
2.  **Hybrid Workflow:** AI does the heavy lifting (detection, cleaning), but the user always has the final say via a precise visual editor.
3.  **Modern UX:** A "Productivity-first" interface inspired by tools like Notion and Linear, avoiding the clutter of traditional creative software.

---

## 🗺️ Roadmap & Status

### ✅ Completed
*   **Core Architecture:** Electron + React frontend talking to a Python FastAPI backend.
*   **Project Management:** Create, list, and organize projects with custom colors and metadata.
*   **AI Integration:**
    *   **YOLOv8:** Custom trained model for speech bubble detection.
    *   **Google Vertex AI:** Integration for high-quality OCR (Gemini 2.0).
    *   **Inpainting:** Implementation of LaMa (Large Mask Inpainting) for cleaning text bubbles.
*   **Visual Editor:**
    *   Pan/Zoom canvas with infinite scrolling.
    *   Bounding box manipulation for detected bubbles.
*   **Documentation:** Real-time dashboard and automated stats.

### 🚧 In Progress
*   **Delete Functionality:** Robust deletion of projects and assets with confirmation.
*   **Upload Pipeline:** Streamlining PDF and single-page image uploads.
*   **File System:** Persistent storage implementation (`/library` directory).

### 🔮 Future
*   **Translation Engine:** Integration of DeepL or LLMs for context-aware translation.
*   **Typesetting:** Auto-fitting translated text into original bubbles.
*   **Export:** PDF and CBZ export with layers.

---

## ⏳ Development Timeline

| Date | Event | Description |
|:---|:---|:---|
| **Jan 08, 2026** | **Real-time Docs** | Implemented live dashboard for monitoring API and system stats. |
| **Jan 08, 2026** | **Persistence** | Moved storage from `temp/` to a permanent `library/` folder. |
| **Jan 06, 2026** | **Canvas Upgrade** | Implemented "Free Pan" & Center-on-load for the editor canvas. |
| **Jan 05, 2026** | **AI Migration** | Migrated to Google GenAI SDK to fix 429 errors and improve OCR. |
| **Jan 02, 2026** | **UI Facelift** | Major redesign to "Notion-style" aesthetics (Dark/Monochrome). |
| **Dec 2025** | **Inception** | Initial project scaffolding and proof-of-concept for YOLO detection. |

---

## 🏗️ Architecture Deep Dive

The application follows a **Split Architecture** pattern to leverage the best tools for each job.

### 1. The Frontend (Electron/React)
*   **Role:** User interface, state management, and canvas rendering.
*   **Why:** React offers the best ecosystem for building complex interactive UIs. Electron provides native OS integration (filesystem, window management).
*   **Key Tech:**
    *   **DraggableWindow:** Custom implementation for a frameless, native-feeling window.
    *   **Tailwind CSS:** Utility-first styling for rapid UI iteration.

### 2. The Backend (Python FastAPI)
*   **Role:** Heavy computational tasks, file I/O, and AI inference.
*   **Why:** Python is the native language of AI. Running a local server allows us to keep heavy dependencies (Torch, OpenCV) isolated from the UI thread.
*   **Key Components:**
    *   `/analyze_page`: Orchestrates the YOLO detection and Vertex AI OCR.
    *   `/clean_page`: Handles the inpainting pipeline using LaMa.
    *   `InMemoryHandler`: A custom logging handler that streams server logs to the frontend dashboard.

---

## 🔑 Key Files Guide

If you are new to the codebase, start by reading these 10 files:

1.  **`backend/main.py`**: The heart of the backend. Contains all API endpoints and AI orchestration logic.
2.  **`frontend/src/App.tsx`**: The main entry point for the React app. Handles routing and global layout.
3.  **`frontend/src/features/editor/ComicWorkstation.tsx`**: The most complex component. Manages the canvas, interaction logic, and bubble rendering.
4.  **`PROJECT_DOCS.md`**: This file! The central source of truth.
5.  **`scripts/update_docs.py`**: The automation script that keeps the stats and structure in this file up to date.
6.  **`frontend/src/pages/dashboard/ProjectManager.tsx`**: Handles the project list, creation, and folder structure.
7.  **`backend/data.json`**: The persistent database (JSON-based) for projects and settings.
8.  **`backend/requirements.txt`**: Lists all python dependencies. Critical for environment setup.
9.  **`frontend/src/types.ts`**: Shared TypeScript definitions. Understanding this helps understand the data flow.
10. **`yolo_engine/run_yolo.py`**: The wrapper script for executing the object detection model.

---

## 📊 Live Project Statistics
<!-- AUTO_GENERATED_STATS_START -->
| Language | Files | Lines (Approx) |
|---|---|---|
| Python | 14 | 2374 |
| TypeScript/TSX | 16 | 3408 |
| CSS | 2 | 32 |

<!-- AUTO_GENERATED_STATS_END -->

## 📂 Project Structure
<!-- AUTO_GENERATED_STRUCTURE_START -->
```text
.
├── Arquivo.zip
├── PROJECT_DOCS.md
├── backend
│   ├── credentials.json
│   ├── data.json
│   ├── data.json.bak_1767900930
│   ├── library
│   │   ├── page_10_6da32ebd.jpg
│   │   ├── page_10_b29609ad.jpg
│   │   ├── page_11_39c8d103.jpg
│   │   ├── page_11_8e9cbbba.jpg
│   │   ├── page_12_458828bb.jpg
│   │   ├── page_12_7122b0c8.jpg
│   │   ├── page_13_311c7f66.jpg
│   │   ├── page_13_666d3a3d.jpg
│   │   ├── page_14_73b30e65.jpg
│   │   ├── page_14_b3a923ce.jpg
│   │   ├── page_15_0c65fe6f.jpg
│   │   ├── page_15_6bd4a13b.jpg
│   │   ├── page_16_489db5af.jpg
│   │   ├── page_16_76969129.jpg
│   │   ├── page_17_09f76c16.jpg
│   │   ├── page_17_785a5fc4.jpg
│   │   ├── page_18_0a0c2a04.jpg
│   │   ├── page_18_d97b011b.jpg
│   │   ├── page_19_5b300962.jpg
│   │   ├── page_19_c00c7025.jpg
│   │   ├── page_1_12df8889.jpg
│   │   ├── page_1_87c7a74c.jpg
│   │   ├── page_20_34934df1.jpg
│   │   ├── page_20_f4eca6a6.jpg
│   │   ├── page_21_54ba1b60.jpg
│   │   ├── page_21_ba2849c4.jpg
│   │   ├── page_22_a91b0764.jpg
│   │   ├── page_22_f4d7e5b9.jpg
│   │   ├── page_23_a99cf05c.jpg
│   │   ├── page_23_d2388cfb.jpg
│   │   ├── page_24_4adfddcd.jpg
│   │   ├── page_24_a0085338.jpg
│   │   ├── page_25_3db91442.jpg
│   │   ├── page_25_460f07d2.jpg
│   │   ├── page_26_51684fc2.jpg
│   │   ├── page_26_76d7a77b.jpg
│   │   ├── page_27_6fe3401f.jpg
│   │   ├── page_27_91688a1a.jpg
│   │   ├── page_28_2c16b938.jpg
│   │   ├── page_28_a825d93e.jpg
│   │   ├── page_29_1f4cf598.jpg
│   │   ├── page_29_86cc858d.jpg
│   │   ├── page_2_6c47da5a.jpg
│   │   ├── page_2_ef7fd380.jpg
│   │   ├── page_30_98a1eca1.jpg
│   │   ├── page_30_cf7f966f.jpg
│   │   ├── page_31_0b5e1343.jpg
│   │   ├── page_31_32a6042b.jpg
│   │   ├── page_32_1ab8e4f9.jpg
│   │   ├── page_32_95dc9809.jpg
│   │   ├── page_33_01e5d4e8.jpg
│   │   ├── page_33_68f70664.jpg
│   │   ├── page_34_210c9bcd.jpg
│   │   ├── page_34_39481d89.jpg
│   │   ├── page_3_56527906.jpg
│   │   ├── page_3_6dbd81b6.jpg
│   │   ├── page_4_09498f1c.jpg
│   │   ├── page_4_e819e4c2.jpg
│   │   ├── page_5_af662f1e.jpg
│   │   ├── page_5_f89f1a90.jpg
│   │   ├── page_6_5f8d84f3.jpg
│   │   ├── page_6_e487c646.jpg
│   │   ├── page_7_287cffd3.jpg
│   │   ├── page_7_42b11a73.jpg
│   │   ├── page_8_0f0a8f31.jpg
│   │   ├── page_8_ce3bbc46.jpg
│   │   ├── page_9_371a80fe.jpg
│   │   └── page_9_f8678240.jpg
│   ├── main.py
│   ├── main_backup_v1.py
│   ├── projects.json
│   ├── requirements.txt
│   └── templates
│       └── dashboard.html
├── cleanup_performance.py
├── cleanup_safe.py
├── dossie_imagine_read.docx
├── dossie_imagine_read.txt
├── frontend
│   ├── check_syntax.cjs
│   ├── dist
│   │   ├── assets
│   │   │   ├── index-0kiMhbW7.css
│   │   │   └── index-BliVUr8_.js
│   │   ├── builder-debug.yml
│   │   ├── builder-effective-config.yaml
│   │   ├── imagine-read-frontend-0.0.0-arm64-mac.zip
│   │   ├── imagine-read-frontend-0.0.0-arm64-mac.zip.blockmap
│   │   ├── imagine-read-frontend-0.0.0-arm64.dmg
│   │   ├── imagine-read-frontend-0.0.0-arm64.dmg.blockmap
│   │   ├── index.html
│   │   └── mac-arm64
│   │       └── imagine-read-frontend.app
│   │           └── Contents
│   │               ├── Frameworks
│   │               │   ├── Electron Framework.framework
│   │               │   │   ├── Electron Framework
│   │               │   │   ├── Helpers
│   │               │   │   │   └── chrome_crashpad_handler
│   │               │   │   ├── Libraries
│   │               │   │   │   ├── libEGL.dylib
│   │               │   │   │   ├── libGLESv2.dylib
│   │               │   │   │   ├── libffmpeg.dylib
│   │               │   │   │   ├── libvk_swiftshader.dylib
│   │               │   │   │   └── vk_swiftshader_icd.json
│   │               │   │   ├── Resources
│   │               │   │   │   ├── Info.plist
│   │               │   │   │   ├── MainMenu.nib
│   │               │   │   │   ├── af.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── am.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ar.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── bg.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── bn.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ca.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── chrome_100_percent.pak
│   │               │   │   │   ├── chrome_200_percent.pak
│   │               │   │   │   ├── cs.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── da.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── de.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── el.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── en.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── en_GB.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── es.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── es_419.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── et.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── fa.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── fi.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── fil.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── fr.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── gu.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── he.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── hi.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── hr.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── hu.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── icudtl.dat
│   │               │   │   │   ├── id.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── it.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ja.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── kn.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ko.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── lt.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── lv.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ml.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── mr.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ms.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── nb.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── nl.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── pl.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── pt_BR.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── pt_PT.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── resources.pak
│   │               │   │   │   ├── ro.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ru.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── sk.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── sl.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── sr.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── sv.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── sw.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ta.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── te.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── th.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── tr.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── uk.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── ur.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── v8_context_snapshot.arm64.bin
│   │               │   │   │   ├── vi.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   ├── zh_CN.lproj
│   │               │   │   │   │   └── locale.pak
│   │               │   │   │   └── zh_TW.lproj
│   │               │   │   │       └── locale.pak
│   │               │   │   └── Versions
│   │               │   │       ├── A
│   │               │   │       │   ├── Electron Framework
│   │               │   │       │   ├── Helpers
│   │               │   │       │   │   └── chrome_crashpad_handler
│   │               │   │       │   ├── Libraries
│   │               │   │       │   │   ├── libEGL.dylib
│   │               │   │       │   │   ├── libGLESv2.dylib
│   │               │   │       │   │   ├── libffmpeg.dylib
│   │               │   │       │   │   ├── libvk_swiftshader.dylib
│   │               │   │       │   │   └── vk_swiftshader_icd.json
│   │               │   │       │   └── Resources
│   │               │   │       │       ├── Info.plist
│   │               │   │       │       ├── MainMenu.nib
│   │               │   │       │       ├── af.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── am.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ar.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── bg.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── bn.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ca.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── chrome_100_percent.pak
│   │               │   │       │       ├── chrome_200_percent.pak
│   │               │   │       │       ├── cs.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── da.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── de.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── el.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── en.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── en_GB.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── es.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── es_419.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── et.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── fa.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── fi.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── fil.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── fr.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── gu.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── he.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── hi.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── hr.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── hu.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── icudtl.dat
│   │               │   │       │       ├── id.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── it.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ja.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── kn.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ko.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── lt.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── lv.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ml.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── mr.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ms.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── nb.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── nl.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── pl.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── pt_BR.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── pt_PT.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── resources.pak
│   │               │   │       │       ├── ro.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ru.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── sk.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── sl.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── sr.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── sv.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── sw.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ta.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── te.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── th.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── tr.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── uk.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── ur.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── v8_context_snapshot.arm64.bin
│   │               │   │       │       ├── vi.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       ├── zh_CN.lproj
│   │               │   │       │       │   └── locale.pak
│   │               │   │       │       └── zh_TW.lproj
│   │               │   │       │           └── locale.pak
│   │               │   │       └── Current
│   │               │   │           ├── Electron Framework
│   │               │   │           ├── Helpers
│   │               │   │           │   └── chrome_crashpad_handler
│   │               │   │           ├── Libraries
│   │               │   │           │   ├── libEGL.dylib
│   │               │   │           │   ├── libGLESv2.dylib
│   │               │   │           │   ├── libffmpeg.dylib
│   │               │   │           │   ├── libvk_swiftshader.dylib
│   │               │   │           │   └── vk_swiftshader_icd.json
│   │               │   │           └── Resources
│   │               │   │               ├── Info.plist
│   │               │   │               ├── MainMenu.nib
│   │               │   │               ├── af.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── am.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ar.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── bg.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── bn.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ca.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── chrome_100_percent.pak
│   │               │   │               ├── chrome_200_percent.pak
│   │               │   │               ├── cs.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── da.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── de.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── el.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── en.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── en_GB.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── es.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── es_419.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── et.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── fa.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── fi.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── fil.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── fr.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── gu.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── he.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── hi.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── hr.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── hu.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── icudtl.dat
│   │               │   │               ├── id.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── it.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ja.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── kn.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ko.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── lt.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── lv.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ml.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── mr.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ms.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── nb.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── nl.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── pl.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── pt_BR.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── pt_PT.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── resources.pak
│   │               │   │               ├── ro.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ru.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── sk.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── sl.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── sr.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── sv.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── sw.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ta.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── te.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── th.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── tr.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── uk.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── ur.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── v8_context_snapshot.arm64.bin
│   │               │   │               ├── vi.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               ├── zh_CN.lproj
│   │               │   │               │   └── locale.pak
│   │               │   │               └── zh_TW.lproj
│   │               │   │                   └── locale.pak
│   │               │   ├── Mantle.framework
│   │               │   │   ├── Mantle
│   │               │   │   ├── Resources
│   │               │   │   │   └── Info.plist
│   │               │   │   └── Versions
│   │               │   │       ├── A
│   │               │   │       │   ├── Mantle
│   │               │   │       │   └── Resources
│   │               │   │       │       └── Info.plist
│   │               │   │       └── Current
│   │               │   │           ├── Mantle
│   │               │   │           └── Resources
│   │               │   │               └── Info.plist
│   │               │   ├── ReactiveObjC.framework
│   │               │   │   ├── ReactiveObjC
│   │               │   │   ├── Resources
│   │               │   │   │   └── Info.plist
│   │               │   │   └── Versions
│   │               │   │       ├── A
│   │               │   │       │   ├── ReactiveObjC
│   │               │   │       │   └── Resources
│   │               │   │       │       └── Info.plist
│   │               │   │       └── Current
│   │               │   │           ├── ReactiveObjC
│   │               │   │           └── Resources
│   │               │   │               └── Info.plist
│   │               │   ├── Squirrel.framework
│   │               │   │   ├── Resources
│   │               │   │   │   ├── Info.plist
│   │               │   │   │   └── ShipIt
│   │               │   │   ├── Squirrel
│   │               │   │   └── Versions
│   │               │   │       ├── A
│   │               │   │       │   ├── Resources
│   │               │   │       │   │   ├── Info.plist
│   │               │   │       │   │   └── ShipIt
│   │               │   │       │   └── Squirrel
│   │               │   │       └── Current
│   │               │   │           ├── Resources
│   │               │   │           │   ├── Info.plist
│   │               │   │           │   └── ShipIt
│   │               │   │           └── Squirrel
│   │               │   ├── imagine-read-frontend Helper (GPU).app
│   │               │   │   └── Contents
│   │               │   │       ├── Info.plist
│   │               │   │       ├── MacOS
│   │               │   │       │   └── imagine-read-frontend Helper (GPU)
│   │               │   │       └── PkgInfo
│   │               │   ├── imagine-read-frontend Helper (Plugin).app
│   │               │   │   └── Contents
│   │               │   │       ├── Info.plist
│   │               │   │       ├── MacOS
│   │               │   │       │   └── imagine-read-frontend Helper (Plugin)
│   │               │   │       └── PkgInfo
│   │               │   ├── imagine-read-frontend Helper (Renderer).app
│   │               │   │   └── Contents
│   │               │   │       ├── Info.plist
│   │               │   │       ├── MacOS
│   │               │   │       │   └── imagine-read-frontend Helper (Renderer)
│   │               │   │       └── PkgInfo
│   │               │   └── imagine-read-frontend Helper.app
│   │               │       └── Contents
│   │               │           ├── Info.plist
│   │               │           ├── MacOS
│   │               │           │   └── imagine-read-frontend Helper
│   │               │           └── PkgInfo
│   │               ├── Info.plist
│   │               ├── MacOS
│   │               │   └── imagine-read-frontend
│   │               ├── PkgInfo
│   │               └── Resources
│   │                   ├── af.lproj
│   │                   ├── am.lproj
│   │                   ├── app.asar
│   │                   ├── ar.lproj
│   │                   ├── bg.lproj
│   │                   ├── bn.lproj
│   │                   ├── ca.lproj
│   │                   ├── cs.lproj
│   │                   ├── da.lproj
│   │                   ├── de.lproj
│   │                   ├── el.lproj
│   │                   ├── electron.icns
│   │                   ├── en.lproj
│   │                   ├── en_GB.lproj
│   │                   ├── es.lproj
│   │                   ├── es_419.lproj
│   │                   ├── et.lproj
│   │                   ├── fa.lproj
│   │                   ├── fi.lproj
│   │                   ├── fil.lproj
│   │                   ├── fr.lproj
│   │                   ├── gu.lproj
│   │                   ├── he.lproj
│   │                   ├── hi.lproj
│   │                   ├── hr.lproj
│   │                   ├── hu.lproj
│   │                   ├── id.lproj
│   │                   ├── it.lproj
│   │                   ├── ja.lproj
│   │                   ├── kn.lproj
│   │                   ├── ko.lproj
│   │                   ├── lt.lproj
│   │                   ├── lv.lproj
│   │                   ├── ml.lproj
│   │                   ├── mr.lproj
│   │                   ├── ms.lproj
│   │                   ├── nb.lproj
│   │                   ├── nl.lproj
│   │                   ├── pl.lproj
│   │                   ├── pt_BR.lproj
│   │                   ├── pt_PT.lproj
│   │                   ├── ro.lproj
│   │                   ├── ru.lproj
│   │                   ├── sk.lproj
│   │                   ├── sl.lproj
│   │                   ├── sr.lproj
│   │                   ├── sv.lproj
│   │                   ├── sw.lproj
│   │                   ├── ta.lproj
│   │                   ├── te.lproj
│   │                   ├── th.lproj
│   │                   ├── tr.lproj
│   │                   ├── uk.lproj
│   │                   ├── ur.lproj
│   │                   ├── vi.lproj
│   │                   ├── zh_CN.lproj
│   │                   └── zh_TW.lproj
│   ├── electron
│   │   ├── main.ts
│   │   └── preload.ts
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── src
│   │   ├── App.tsx
│   │   ├── components
│   │   │   ├── ComicWorkstation.tsx
│   │   │   ├── DiagnosticsPanel.tsx
│   │   │   ├── DraggableWindow.tsx
│   │   │   ├── EditorView.tsx
│   │   │   ├── Explorer.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── ProjectManager.tsx
│   │   │   └── ProjectView.tsx
│   │   ├── config.ts
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── types.ts
│   │   └── utils
│   │       └── balloonConverter.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── generate_docx.py
├── refactor_explorer.py
├── refactor_project_manager.py
├── refactor_project_view.py
├── scripts
│   ├── __init__.py
│   └── update_docs.py
└── yolo_engine
    ├── .gitignore
    ├── comic_speech_bubble_seg_v1.pt
    ├── download_lama.py
    ├── models
    │   └── lama.pt
    ├── output
    │   ├── inference
    │   │   ├── page_3_14b1defb.jpg
    │   │   ├── page_4_002a4c75.jpg
    │   │   ├── page_4_08059a5d.jpg
    │   │   ├── page_4_73d5faa3.jpg
    │   │   ├── page_4_8474b8ed.jpg
    │   │   ├── page_4_d336d04c.jpg
    │   │   └── page_4_e819e4c2.jpg
    │   └── inpainted
    │       ├── debug_mask_check.png
    │       ├── page_3_14b1defb_CLEAN.jpg
    │       └── page_4_08059a5d_CLEAN.jpg
    ├── run_inpainting.py
    ├── run_yolo.py
    └── test_load.py
```
<!-- AUTO_GENERATED_STRUCTURE_END -->

## 🔌 API Reference
<!-- AUTO_GENERATED_API_START -->
* `DELETE` **/projects/{project_id}**
* `GET` **/api/system-stats**
* `GET` **/docs/live**
* `GET` **/filesystem**
* `GET` **/health**
* `GET` **/projects**
* `GET` **/store**
* `GET` **/thumbnail**
* `GET` **/version**
* `POST` **/admin/reset_data**
* `POST` **/analisar-yolo**
* `POST` **/analyze_page**
* `POST` **/clean_page**
* `POST` **/ler-texto**
* `POST` **/projects**
* `POST` **/store**
* `POST` **/upload_image**
* `POST` **/upload_page**
* `POST` **/upload_pdf**
* `PUT` **/projects/{project_id}**
<!-- AUTO_GENERATED_API_END -->
