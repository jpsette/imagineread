import React, { useEffect } from 'react';

// Routes
import { AppRoutes } from './app/routes';

// Components
import { JobMonitor } from './features/jobs/components/JobMonitor';

const App: React.FC = () => {
    // === GLOBAL STORES ===
    // Legacy support only - Ideally we remove these too once we confirm no deep dependencies
    // const { setProjects } = useProjectStore(); 
    // const { setFileSystem } = useFileSystemStore();

    useEffect(() => {
        if (window.resizeTo) window.resizeTo(window.screen.availWidth, window.screen.availHeight);
    }, []);

    return (
        <>
            <AppRoutes />
            <JobMonitor />
        </>
    );
};

export default App;
