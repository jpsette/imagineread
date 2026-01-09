# 🛠️ Mobile App - Developer Guide

## 1. Setup

### Prerequisites
- Node.js > 18
- iOS Simulator or Android Emulator

### Installation
```bash
cd mobile_app
npm install
```

## 2. Running

### Start Development Server
```bash
npm start
```
Press `i` to open in iOS Simulator, or `a` for Android Emulator.

## 3. Smoke Test Checklist (Manual QA)

Perform these steps to verify the app is healthy:

1.  **Launch App**: Ensure app opens without crashing.
2.  **Navigation**: You should land on the "Home" tab.
3.  **Open Reader**: Tap the first comic card ("Batman: Year One").
4.  **Verify Reader**:
    -   Pass: Comic page loads.
    -   Pass: "I am Vengeance!" bubble appears consistently.
5.  **Toggle Cinematic**:
    -   Tap "Enter Cinematic" button at bottom.
    -   Verify view locks.
    -   Tap RIGHT side of screen -> View should zoom/pan to the first panel.
    -   Tap RIGHT again -> View should zoom/pan to the balloon.
6.  **Exit**: Tap "Exit Cinematic". View should return to list/scroll.

## 4. Test Data
The App uses a **Mock Service** by default (`src/modules/reader/services/MockReaderService.ts`).
-   **Comic ID "1"** is the canonical test case with full Cinematic metadata (FocusPoints).
