import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorLayout } from '../../../layouts/EditorLayout';
import { ComicWorkstation } from '../../editor/ComicWorkstation';
import { useFileSystemStore } from '../../../store/useFileSystemStore';
import { useFileActions } from '../../../hooks/useFileActions';
import { FileEntry } from '../../../types';

export const WorkstationScreen: React.FC = () => {
    const { comicId } = useParams<{ comicId: string }>();
    const navigate = useNavigate();

    // Connect to Store
    const { fileSystem } = useFileSystemStore();
    const { uploadPages, deletePages, reorderFiles } = useFileActions();

    // In App.tsx, openedComicId was state. Here it comes from URL.
    // If comicId is invalid or not found, we should probably redirect to dashboard.

    const comic = fileSystem.find((f: FileEntry) => f.id === comicId);

    // If we have no data yet (loadData async), we might render nothing or a loader.
    // For now, we render if comic exists.

    const pages = fileSystem
        .filter((f: FileEntry) => f.parentId === comicId && f.type === 'file')
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const handleAddPages = (files: File[]) => {
        if (comicId) {
            uploadPages(files, comicId);
            // App.tsx called loadData() after. 
            // We assume store updates or we might need a refresh mechanism.
        }
    };

    const handleDeletePages = (pageIds: string[]) => {
        if (confirm(`Excluir ${pageIds.length} páginas?`)) {
            deletePages(pageIds);
        }
    };

    const handleReorderPages = (pageIds: string[]) => {
        // Mock implementation from App.tsx or use reorderFiles if available
        console.log("Reorder pages:", pageIds);
    };

    if (!comic && fileSystem.length > 0) {
        // Data is loaded but comic not found
        return <div className="text-white p-10">Comic não encontrada. <button onClick={() => navigate('/')}>Voltar</button></div>;
    }

    if (!comic) {
        // Still loading or empty
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] bg-[#0c0c0e]">
            <EditorLayout>
                <ComicWorkstation
                    comic={{
                        id: comic.id,
                        name: comic.name
                    }}
                    pages={pages}
                    onClose={() => navigate('/')}
                    onSelectPage={(pageId) => navigate(`/editor/${pageId}`)}
                    onAddPages={handleAddPages}
                    onDeletePages={handleDeletePages}
                    onReorderPages={handleReorderPages}
                />
            </EditorLayout>
        </div>
    );
};
