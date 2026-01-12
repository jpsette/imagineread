#!/bin/bash

# Add all changes
git add .

# Commit with detailed message
git commit -m "feat(ui): Vertical Gallery, Status Badges & Editor Stabilization

**MAJOR CHANGES:**
- 🎨 **Gallery Redesign:** Switched to Vertical 2:3 aspect ratio (Comic Book style) with sharp corners.
- 🏷️ **Status Indicators:** Added 'EM EDIÇÃO' Black/Orange badges to thumbnails.
- 🛠️ **Editor Stability:** Fixed critical crash in VectorBubble (pathData reference).
- 📏 **Layout Polish:** Fixed Toolbar pixel-jitter between tabs.
- 👁️ **View Switcher:** Added Floating Controls (Original | Clean | Mask) in the Editor.
- ✅ **Feedback:** Action buttons now turn Green cumulatively.

**Technical:**
- Refactored ProjectDetail.tsx, EditorView.tsx, EditorTopBar.tsx.
- Cleaned up unused imports and dead code."
