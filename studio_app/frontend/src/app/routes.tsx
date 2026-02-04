import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Lazy Imports for code splitting
const DashboardScreen = React.lazy(() =>
    import('@pages/dashboard/screens/DashboardScreen').then(module => ({ default: module.DashboardScreen }))
);

// Lazy Imports (Named Exports trick)
// Lazy Imports (Named Exports trick)
const WorkstationScreen = React.lazy(() =>
    import('@pages/editor/WorkstationScreen').then(module => ({ default: module.WorkstationScreen }))
);

// Static Import for Stability (Prevents unmount on ID change)
import { EditorScreen } from '@pages/editor/EditorScreen';

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
            <Route path="/" element={
                <Suspense fallback={<EditorLoader />}>
                    <DashboardScreen />
                </Suspense>
            } />

            <Route path="/comic/:comicId" element={
                <Suspense fallback={<EditorLoader />}>
                    <WorkstationScreen />
                </Suspense>
            } />

            <Route path="/editor/:fileId" element={<EditorScreen />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
