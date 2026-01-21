import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';

// Lazy Imports (Named Exports trick)
const WorkstationScreen = React.lazy(() =>
    import('../features/editor/screens/WorkstationScreen').then(module => ({ default: module.WorkstationScreen }))
);
const EditorScreen = React.lazy(() =>
    import('../features/editor/screens/EditorScreen').then(module => ({ default: module.EditorScreen }))
);

const EditorLoader = () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium animate-pulse">Carregando Studio...</p>
        </div>
    </div>
);

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<DashboardScreen />} />

            <Route path="/comic/:comicId" element={
                <Suspense fallback={<EditorLoader />}>
                    <WorkstationScreen />
                </Suspense>
            } />

            <Route path="/editor/:fileId" element={
                <Suspense fallback={<EditorLoader />}>
                    <EditorScreen />
                </Suspense>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
