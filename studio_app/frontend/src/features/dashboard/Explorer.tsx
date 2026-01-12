import React from 'react';
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2, Pin, File } from 'lucide-react';
import { Project, FileEntry as FileNode } from '../../types';

interface ExplorerProps {
    projects: Project[];
    fileSystem: FileNode[];
    currentProjectId: string | null;
    currentFolderId: string | null;
    onSelectProject: (id: string) => void;
    onSelectFolder: (id: string) => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;
    onPinProject: (id: string) => void;
    onEditFolder: (folder: FileNode) => void;
    onDeleteFolder: (id: string) => void;
    onToggleProjectExpand: (id: string) => void;
    onToggleFolderExpand: (id: string) => void;
    expandedProjects: Set<string>;
    expandedFolders: Set<string>;
    PROJECT_THEMES: { bg: string; text: string; lightText: string }[];
}

export const Explorer: React.FC<ExplorerProps> = ({
    projects,
    fileSystem,
    currentProjectId,
    currentFolderId,
    onSelectProject,
    onSelectFolder,
    onEditProject,
    onDeleteProject,
    onPinProject,
    onEditFolder,
    onDeleteFolder,
    onToggleProjectExpand,
    onToggleFolderExpand,
    expandedProjects,
    expandedFolders,
    PROJECT_THEMES
}) => {
    // Defensive check
    const safeProjects = projects || [];
    const safeFileSystem = fileSystem || [];

    // Note: Local editing state has been removed in favor of ProjectManager



    // === HANDLERS ===
    const handleSelectProject = (id: string) => {
        onSelectProject(id);
    };

    const handleSelectFolder = (id: string) => {
        onSelectFolder(id);
    };

    // Note: Inline editing has been removed in favor of ProjectManager
    // The "Edit" button now triggers parent to show ProjectManager in edit mode

    // Folder editing is currently placeholder/disabled as per App.tsx
    const startEditingFolder = (folder: FileNode, e: React.MouseEvent) => {
        e.stopPropagation();
        onEditFolder(folder);
    };

    return (
        <div className="w-full h-full p-4 flex flex-col gap-4 min-w-[250px]">
            <nav className="flex flex-col gap-1">
                <div className="mt-4 flex flex-col gap-1">
                    <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Seus Projetos</p>
                    {safeProjects.map(project => {
                        const isExpanded = expandedProjects.has(project.id)
                        const projectLibraries = safeFileSystem.filter(f => f.parentId === project.rootFolderId)

                        return (
                            <div key={project.id} className="flex flex-col">
                                <div
                                    className={`px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors text-sm group ${currentProjectId === project.id ? 'bg-[#27272a] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'}`}
                                    onClick={() => handleSelectProject(project.id)}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onToggleProjectExpand(project.id)
                                        }}
                                        className="p-0.5 rounded hover:bg-white/10 text-text-secondary hover:text-white transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>

                                    <Folder size={16} className={`${PROJECT_THEMES.find(t => t.bg === project.color)?.text || 'text-text-secondary'} fill-current`} />
                                    <span className={`truncate flex-1 ${PROJECT_THEMES.find(t => t.bg === project.color)?.lightText || ''}`}>{project.name}</span>

                                    <div className="hidden group-hover:flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPinProject(project.id); }}
                                            className={`p-1 hover:text-white ${project.isPinned ? 'text-accent-blue' : 'text-gray-500'}`}
                                            title={project.isPinned ? 'Desafixar' : 'Fixar'}
                                        >
                                            <Pin size={12} className={project.isPinned ? "fill-current" : ""} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditProject(project); }}
                                            className="p-1 hover:text-white text-gray-500"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteProject(project.id);
                                            }}
                                            className="p-1 hover:text-red-400 text-gray-500"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-libraries */}
                                {isExpanded && (
                                    <div className="flex flex-col gap-0.5 ml-4 pl-4 border-l border-white/5 mt-1 mb-1">
                                        {projectLibraries.length === 0 ? (
                                            <span className="text-[10px] text-zinc-600 py-1 pl-2 italic">Vazio</span>
                                        ) : (
                                            projectLibraries.map(lib => {
                                                const isLibExpanded = expandedFolders.has(lib.id)
                                                // Check content to determine visual type
                                                const libFiles = safeFileSystem.filter(f => f.parentId === lib.id && (f.type === 'comic' || f.type === 'file'))
                                                const hasSubFolders = safeFileSystem.some(f => f.parentId === lib.id && f.type === 'folder')

                                                // Heuristic: If it has files but no subfolders, it's likely a Semantic Comic (File)
                                                const isLikelyComic = libFiles.length > 0 && !hasSubFolders;

                                                if (isLikelyComic) {
                                                    // RENDER AS FILE (Comic)
                                                    return (
                                                        <div
                                                            key={lib.id}
                                                            className={`px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white/5 group transition-colors ml-5 ${currentFolderId === lib.id ? 'bg-blue-500/20 text-white' : 'text-zinc-400'}`}
                                                            onClick={() => handleSelectFolder(lib.id)}
                                                        >
                                                            {/* File Icon White */}
                                                            <File size={14} className="text-white" />
                                                            <span className="truncate flex-1 font-medium text-white">{lib.name}</span>
                                                            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">({libFiles.length})</span>

                                                            <div className="hidden group-hover:flex gap-1 ml-auto">
                                                                <button onClick={(e) => startEditingFolder(lib, e)} className="p-1 hover:text-white text-zinc-600 transition-colors">
                                                                    <Pencil size={11} />
                                                                </button>
                                                                <button onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Tem certeza que deseja excluir esta pasta e todo seu conteúdo?')) onDeleteFolder(lib.id);
                                                                }} className="p-1 hover:text-red-400 text-zinc-600 transition-colors">
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                // RENDER AS FOLDER (Library)
                                                return (
                                                    <div key={lib.id} className="flex flex-col">
                                                        <div
                                                            className={`px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white/5 group transition-colors ${currentFolderId === lib.id ? 'bg-blue-500/20 text-white' : 'text-zinc-400'}`}
                                                            onClick={() => handleSelectFolder(lib.id)}
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    onToggleFolderExpand(lib.id)
                                                                }}
                                                                className="p-0.5 hover:text-white transition-colors"
                                                            >
                                                                {isLibExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                            </button>
                                                            {/* Folder Icon: Default to Blue if no color set */}
                                                            <Folder
                                                                size={14}
                                                                className={`${PROJECT_THEMES.find(t => t.bg === lib.color)?.text || 'text-blue-500'}`}
                                                            />
                                                            <span className="truncate flex-1 font-medium text-white">{lib.name}</span>
                                                            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">({libFiles.length})</span>

                                                            <div className="hidden group-hover:flex gap-1 ml-auto">
                                                                <button onClick={(e) => startEditingFolder(lib, e)} className="p-1 hover:text-white text-zinc-600 transition-colors">
                                                                    <Pencil size={11} />
                                                                </button>
                                                                <button onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Tem certeza que deseja excluir esta pasta e todo seu conteúdo?')) onDeleteFolder(lib.id);
                                                                }} className="p-1 hover:text-red-400 text-zinc-600 transition-colors">
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Nested content inside Library (if expanded) */}
                                                        {isLibExpanded && (() => {
                                                            const subFolders = safeFileSystem.filter(f => f.parentId === lib.id && f.type === 'folder')
                                                            const directFiles = safeFileSystem.filter(f => f.parentId === lib.id && (f.type === 'comic' || f.type === 'file'))

                                                            return (
                                                                <div className="flex flex-col gap-0.5 ml-6 pl-2 border-l border-white/5">
                                                                    {/* Subfolders (Comics like "Ahsoka 01") */}
                                                                    {subFolders.map(subFolder => {
                                                                        const subFiles = safeFileSystem.filter(f => f.parentId === subFolder.id && (f.type === 'comic' || f.type === 'file'))
                                                                        return (
                                                                            <div
                                                                                key={subFolder.id}
                                                                                className={`px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white/5 group transition-colors ${currentFolderId === subFolder.id ? 'bg-blue-500/20 text-white' : 'text-zinc-400'}`}
                                                                                onClick={() => handleSelectFolder(subFolder.id)}
                                                                            >
                                                                                <File size={14} className="text-white" />
                                                                                <span className="truncate flex-1 font-medium text-white">{subFolder.name}</span>
                                                                                <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">({subFiles.length})</span>
                                                                            </div>
                                                                        )
                                                                    })}

                                                                    {/* Direct files */}
                                                                    {directFiles.map(file => (
                                                                        <div key={file.id} className="px-2 py-1 rounded flex items-center gap-2 text-[11px] text-zinc-400 hover:bg-white/5 cursor-pointer transition-colors group/file">
                                                                            <File size={12} className="text-white opacity-80" />
                                                                            <span className="truncate text-white">{file.name}</span>
                                                                        </div>
                                                                    ))}

                                                                    {subFolders.length === 0 && directFiles.length === 0 && (
                                                                        <span className="text-[10px] text-zinc-700 py-1 pl-1 italic">Vazio</span>
                                                                    )}
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
export default Explorer;
