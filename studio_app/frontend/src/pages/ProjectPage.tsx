import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProjectDetail from '../features/dashboard/ProjectDetail';
import { useProjectStore } from '../store/useProjectStore';

const ProjectPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();

    // Global Stores
    const { currentProjectId, setCurrentProjectId } = useProjectStore();

    // Sync URL param to Store
    useEffect(() => {
        if (projectId && projectId !== currentProjectId) {
            setCurrentProjectId(projectId);
        }
    }, [projectId, currentProjectId, setCurrentProjectId]);

    return (
        <div className="w-full h-full">
            <ProjectDetail />
        </div>
    );
};

export default ProjectPage;
