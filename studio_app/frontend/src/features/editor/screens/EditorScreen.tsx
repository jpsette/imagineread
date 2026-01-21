import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorLayout } from '../../../layouts/EditorLayout';
import EditorView from '../EditorView';
import { useFileItem } from '../../dashboard/hooks/useFileItem';

export const EditorScreen: React.FC = () => {
    const { fileId } = useParams<{ fileId: string }>();
    const navigate = useNavigate();

    // Data Independence: Fetch specifically this file from Server (React Query)
    const { data: file, isLoading } = useFileItem(fileId || null);

    if (isLoading) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-[200]">Carregando editor...</div>;
    }

    if (!file) {
        return <div className="text-white p-10 fixed z-[200]">Arquivo não encontrado. <button onClick={() => navigate('/')} className="underline ml-2">Voltar</button></div>;
    }

    // Determine return path. Ideally we go back to the Comic (parent).
    const handleBack = () => {
        if (file.parentId) {
            navigate(`/comic/${file.parentId}`);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black">
            <EditorLayout>
                <EditorView
                    imageUrl={file.url}
                    onBack={handleBack}
                    fileId={file.id}
                    initialBalloons={file.balloons || undefined}
                    cleanUrl={file.cleanUrl || undefined}
                />
            </EditorLayout>
        </div>
    );
};
