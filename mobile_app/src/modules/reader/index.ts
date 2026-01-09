// Public API for the Reader Module
// Only export what is necessary for the App Layer to function.

// 1. The Main Container (The usage point)
export { ReaderContainer } from './ReaderContainer';

// 2. Services/Interfaces (For dependency injection or typing)
export { IReaderService } from './types';
export * from './types/Manifest'; // Export Manifest Contracts

// 3. Store (Optional: Only if external app needs to toggle state)
export { useReaderStore } from './store/useReaderStore';

// NOTE: Do NOT export internal components like PageList, VectorBubble, etc.
