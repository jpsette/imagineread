import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorLayout } from '../../layouts/EditorLayout';
import { ComicWorkstation } from '@features/editor/ComicWorkstation';
import { useFileActions } from '@shared/hooks/useFileActions';
import { useFileItem } from '@shared/hooks/useFileItem';
import { useFolderContents } from '@pages/dashboard/hooks/useFolderContents';
import { FileEntry } from '@shared/types';
import { useQueryClient } from '@tanstack/react-query';


export const WorkstationScreen: React.FC = () => {
    const { comicId } = useParams<{ comicId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // === DATA FETCHING (Independent) ===
    const { data: comic, isLoading: isLoadingComic } = useFileItem(comicId || null);

    // === TAB PERSISTENCE ===
    // REMOVED: User requested to NOT show the main comic folder as a tab. Only pages.
    // const tabTitle = comic?.name || 'Comic Workstation';
    // useTabPersistence(comicId || null, tabTitle, 'comic');

    const { data: contents, isLoading: isLoadingPages } = useFolderContents(comicId || null);

    const { uploadPages, deletePages } = useFileActions();

    // Filter pages from contents
    const pages = (contents || [])
        .filter((f: FileEntry) => f.type === 'file')
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Actions Wrappers (to invalidate cache)
    const handleAddPages = async (files: File[]) => {
        if (comicId) {
            await uploadPages(files, comicId);
            // Invalidate to refresh list
            queryClient.invalidateQueries({ queryKey: ['filesystem', comicId] });
        }
    };

    const handleDeletePages = async (pageIds: string[]) => {
        if (confirm(`Excluir ${pageIds.length} páginas?`)) {
            await deletePages(pageIds);
            queryClient.invalidateQueries({ queryKey: ['filesystem', comicId] });
        }
    };

    const handleReorderPages = (_pageIds: string[]) => {
        // Mock / TODO: Implement Reorder API in Phase 6
        // console.log("Reorder pages:", pageIds);
    };

    if (isLoadingComic || isLoadingPages) {
        return <div className="fixed inset-0 bg-[#0c0c0e] flex items-center justify-center text-white">Carregando dados do quadrinho...</div>;
    }

    if (!comic) {
        return <div className="text-white p-10">Comic não encontrada. <button onClick={() => navigate('/')}>Voltar</button></div>;
    }

    // Defensive check
    if (!comicId) return null;

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
