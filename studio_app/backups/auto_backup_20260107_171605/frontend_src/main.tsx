import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Starting application...');

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error('FATAL: Root element not found');
    }

    console.log('Main.tsx: Root element found, mounting React...');

    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
    console.log('Main.tsx: React mounted successfully');
} catch (error) {
    console.error('FATAL ERROR IN MAIN.TSX:', error);
    document.body.innerHTML = `<div style="color:red; padding: 20px; font-size: 24px;"><h1>Fatal Error</h1><pre>${error instanceof Error ? error.message : String(error)}</pre></div>`;
}
