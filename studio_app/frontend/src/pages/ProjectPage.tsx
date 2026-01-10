import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectDetail } from '../features/dashboard/ProjectDetail';
import { useProjectStore } from '../store/useProjectStore';
import { useFileSystemStore } from '../store/useFileSystemStore';
import { PROJECT_THEMES } from '../constants/theme';
import { FileEntry } from '../types';

const ProjectPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    // Global Stores
    const { projects, currentProjectId, setCurrentProjectId } = useProjectStore();
    const { fileSystem, currentFolderId, setCurrentFolderId } = useFileSystemStore();

    // Local State for Search/Sort (Moved up from ProjectDetail)
    const [searchTerm] = useState('');
    const [sortOrder] = useState<'az' | 'za'>('az');

    // Sync URL param to Store
    useEffect(() => {
        if (projectId && projectId !== currentProjectId) {
            setCurrentProjectId(projectId);
        }
    }, [projectId, currentProjectId, setCurrentProjectId]);

    const project = projects.find(p => p.id === currentProjectId) || null;

    // Handlers
    const handleBack = () => {
        if (currentFolderId) {
            if (project && currentFolderId === project.rootFolderId) {
                navigate('/');
                return;
            }
            const current = fileSystem.find(f => f.id === currentFolderId);
            if (!current?.parentId) {
                navigate('/');
            } else {
                setCurrentFolderId(current.parentId);
            }
        } else {
            navigate('/');
        }
    };

    const handleOpenComic = (comicId: string) => {
        navigate(`/editor/${comicId}`);
    };

    const handleOpenItem = (item: FileEntry) => {
        if (item.type === 'folder') {
            const hasPages = fileSystem.some(f => f.parentId === item.id && f.type === 'file');
            const hasSubFolders = fileSystem.some(f => f.parentId === item.id && f.type === 'folder');

            if (hasPages && !hasSubFolders) {
                handleOpenComic(item.id);
            } else {
                setCurrentFolderId(item.id);
            }
        } else if (item.type === 'comic') {
            handleOpenComic(item.id);
        }
    };

    return (
        <div className="w-full h-full">
            <ProjectDetail
                project={project}
                currentFolderId={currentFolderId}
                fileSystem={fileSystem}
                searchTerm={searchTerm}
                sortOrder={sortOrder}
                PROJECT_THEMES={PROJECT_THEMES}
                onOpenItem={handleOpenItem}
                onOpenComic={handleOpenComic}
                onBack={handleBack}
            />
        </div>
    );
};

export default ProjectPage;
