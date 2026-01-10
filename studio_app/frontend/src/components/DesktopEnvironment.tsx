import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DraggableWindow from '../ui/DraggableWindow';
import Explorer from '../features/dashboard/Explorer';
import { useUIStore } from '../store/useUIStore';
import { useProjectStore } from '../store/useProjectStore';
import DashboardPage from '../pages/DashboardPage';
import ProjectPage from '../pages/ProjectPage';

const DesktopEnvironment: React.FC = () => {

    // === Global State ===
    const { showExplorer, setShowExplorer, showManager, setShowManager } = useUIStore();
    const { projects, currentProjectId } = useProjectStore();

    // === Actions ===
    // (ProjectManager now handles actions, Explorer handles actions)

    return (
        <>
            {/* 1. EXPLORER (FLOATING WINDOW) */}
            {showExplorer && (
                <DraggableWindow
                    title="Explorador de Arquivos"
                    onClose={() => setShowExplorer(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 20, y: 80 }}
                    initialSize={{ width: 300, height: 600 }}
                >
                    <Explorer />
                </DraggableWindow>
            )}

            {/* 2. PROJECT MANAGER (FLOATING WINDOW) */}
            {showManager && (
                <DraggableWindow
                    title={
                        currentProjectId
                            ? (projects.find(p => p.id === currentProjectId)?.name || 'Projeto')
                            : 'Gerenciador de Projetos'
                    }
                    onClose={() => setShowManager(false)}
                    minimize={false}
                    docked={false}
                    className="border border-white/10 shadow-2xl bg-[#09090b]"
                    initialPosition={{ x: 340, y: 80 }}
                    initialSize={{ width: 960, height: 600 }}
                >
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/project/:projectId" element={<ProjectPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </DraggableWindow>
            )}
        </>
    );
};

export default DesktopEnvironment;
