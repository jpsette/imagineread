import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditorLayout } from '../../../layouts/EditorLayout';
import EditorView from '../EditorView';
import { useFileSystemStore } from '../../../store/useFileSystemStore';
import { FileEntry } from '../../../types';

export const EditorScreen: React.FC = () => {
    const { fileId } = useParams<{ fileId: string }>();
    const navigate = useNavigate();

    const { fileSystem } = useFileSystemStore();

    const file = fileSystem.find((f: FileEntry) => f.id === fileId);

    if (!file && fileSystem.length > 0) {
        return <div className="text-white p-10">Arquivo não encontrado. <button onClick={() => navigate('/')}>Voltar</button></div>;
    }

    if (!file) return null;

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
