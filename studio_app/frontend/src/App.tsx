import React, { useEffect, useState } from 'react';
import { api } from './services/api';

// Stores
import { useProjectStore } from './store/useProjectStore';
import { useFileSystemStore } from './store/useFileSystemStore';

// Routes
import { AppRoutes } from './app/routes';

const App: React.FC = () => {
    // === GLOBAL STORES ===
    const { setProjects } = useProjectStore();
    const { setFileSystem } = useFileSystemStore();

    const [loading, setLoading] = useState(false);

    // === DATA LOADING ===
    // This remains global for now to ensure data availability across routes
    const loadData = async () => {
        setLoading(true);
        try {
            const [projs, files] = await Promise.all([
                api.getProjects(),
                api.getFileSystem()
            ]);
            setProjects(projs);
            setFileSystem(files);
        } catch (e) {
            console.error("Failed to load initial data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (window.resizeTo) window.resizeTo(window.screen.availWidth, window.screen.availHeight);
        loadData();
    }, []);

    if (loading) {
        return <div className="fixed inset-0 bg-black text-white flex items-center justify-center">Carregando...</div>;
    }

    return (
        <AppRoutes />
    );
};

export default App;
