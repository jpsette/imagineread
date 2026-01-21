import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardScreen } from '../features/dashboard/screens/DashboardScreen';
import { WorkstationScreen } from '../features/editor/screens/WorkstationScreen';
import { EditorScreen } from '../features/editor/screens/EditorScreen';

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/comic/:comicId" element={<WorkstationScreen />} />
            <Route path="/editor/:fileId" element={<EditorScreen />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
