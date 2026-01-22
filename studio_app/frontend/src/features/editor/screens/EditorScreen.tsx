import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorLayout } from '../../../layouts/EditorLayout';
import EditorView from '../EditorView';
import { useFileItem } from '../../dashboard/hooks/useFileItem';

export const EditorScreen: React.FC = () => {
    const { fileId } = useParams<{ fileId: string }>();
    const navigate = useNavigate();

    // GAPLESS NAVIGATION: Keep showing previous file while loading the new one
    const { data: file, isLoading, isFetching } = useFileItem(fileId || null, { keepPreviousData: true });

    // Navigation Handler
    const handleBack = () => {
        navigate(-1);
    };

    // Show initial loading only if we have NO file yet
    if (isLoading && !file) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-[200]">Carregando editor...</div>;
    }

    return (
        <div className="fixed inset-0 z-[200] bg-black">
            <EditorLayout>
                {/* SPINNER OVERLAY: Shows when switching pages (fetching in background) */}
                {isFetching && file && (
                    <div className="absolute top-4 right-4 z-[300]">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!file && (
                    <div className="flex-1 flex items-center justify-center text-white p-10">
                        <div>
                            Arquivo não encontrado.
                            <button onClick={() => navigate('/')} className="underline ml-2">Voltar</button>
                        </div>
                    </div>
                )}

                {file && (
                    <EditorView
                        // key={file.id} <-- REMOVED: Stable Shell Architecture
                        imageUrl={file.url}
                        onBack={handleBack}
                        fileId={file.id}
                        initialBalloons={file.balloons || undefined}
                        cleanUrl={file.cleanUrl || undefined}
                    />
                )}
            </EditorLayout>
        </div>
    );
};
