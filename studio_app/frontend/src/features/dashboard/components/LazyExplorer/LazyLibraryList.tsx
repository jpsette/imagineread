import React from 'react';
import { useFolderContents } from '../../hooks/useFolderContents';
import { LazyFolderItem } from './LazyFolderItem';
import { FileItem } from './FileItem';
import { FileEntry } from '../../../../types';

interface LazyLibraryListProps {
    rootFolderId: string | undefined;
    currentFolderId: string | null;
    onSelectFolder: (id: string) => void;
    onEditFolder: (folder: FileEntry) => void;
    onDeleteFolder: (id: string) => void;
}

export const LazyLibraryList: React.FC<LazyLibraryListProps> = ({
    rootFolderId,
    currentFolderId,
    onSelectFolder,
    onEditFolder,
    onDeleteFolder
}) => {
    // Fetch Root Contents of the Project
    const { data: contents, isLoading } = useFolderContents(rootFolderId || null);

    if (isLoading) {
        return <div className="pl-4 py-1 text-[10px] text-text-muted italic">Carregando bibliotecas...</div>;
    }

    if (!contents || contents.length === 0) {
        return <div className="pl-4 py-1 text-[10px] text-text-muted italic">Vazio</div>;
    }

    const folders = contents.filter(f => f.type === 'folder');
    const files = contents.filter(f => f.type === 'file' || f.type === 'comic');

    return (
        <div className="flex flex-col gap-0.5 ml-4 pl-4 border-l border-white/5 mt-1 mb-1">
            {folders.map(folder => (
                <LazyFolderItem
                    key={folder.id}
                    folder={folder}
                    currentFolderId={currentFolderId}
                    onSelectFolder={onSelectFolder}
                    onEditFolder={onEditFolder}
                    onDeleteFolder={onDeleteFolder}
                    depth={1}
                />
            ))}

            {files.map(file => (
                <FileItem
                    key={file.id}
                    file={file}
                    isSelected={currentFolderId === file.id}
                    onSelect={onSelectFolder}
                    onEdit={(f, e) => { e.stopPropagation(); onEditFolder(f); }}
                    onDelete={(id, e) => {
                        e.stopPropagation();
                        if (confirm('Tem certeza? Você perderá todas as modificações salvas permanentemente.')) onDeleteFolder(id);
                    }}
                    depth={1}
                />
            ))}
        </div>
    );
};
