import { useState } from 'react'
import { Folder, ChevronRight, ChevronDown, Pencil, Trash2, Check, X, Pin, File } from 'lucide-react'

import { Project, FileEntry as FileNode } from '../../types';

interface ExplorerProps {
    projects: Project[]
    fileSystem: FileNode[]
    currentProjectId: string | null
    currentFolderId: string | null
    expandedProjects: Set<string>
    expandedFolders: Set<string>
    PROJECT_THEMES: Array<{ bg: string; text: string; lightText?: string }>
    onSelectProject: (projectId: string) => void
    onSelectFolder: (folderId: string) => void
    onToggleProjectExpand: (projectId: string) => void
    onToggleFolderExpand: (folderId: string) => void
    onEditProject: (project: Project) => void
    onDeleteProject: (projectId: string, e: React.MouseEvent) => void
    onEditFolder: (folder: FileNode) => void
    onDeleteFolder: (folderId: string, e: React.MouseEvent) => void
    onPinProject: (projectId: string) => void
}

export const Explorer: React.FC<ExplorerProps> = ({
    projects,
    fileSystem,
    currentProjectId,
    currentFolderId,
    expandedProjects,
    expandedFolders,
    PROJECT_THEMES,
    onSelectProject,
    onSelectFolder,
    onToggleProjectExpand,
    onToggleFolderExpand,
    onEditProject,
    onDeleteProject,
    onEditFolder,
    onDeleteFolder,
    onPinProject,
}) => {
    // Local edit state
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [editingFolder, setEditingFolder] = useState<FileNode | null>(null)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('')

    const startEditingProject = (project: Project, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingProject(project)
        setEditName(project.name)
        setEditColor(project.color)
    }

    const handleSaveProject = () => {
        if (!editingProject || !editName.trim()) {
            setEditingProject(null)
            return
        }
        onEditProject({ ...editingProject, name: editName, color: editColor })
        setEditingProject(null)
        setEditName('')
        setEditColor('')
    }

    const startEditingFolder = (folder: FileNode, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingFolder(folder)
        setEditName(folder.name)
        setEditColor(folder.color || '')
    }

    const handleSaveFolder = () => {
        if (!editingFolder || !editName.trim()) {
            setEditingFolder(null)
            return
        }
        onEditFolder({ ...editingFolder, name: editName, color: editColor })
        setEditingFolder(null)
        setEditName('')
        setEditColor('')
    }

    return (
        <div className="w-full h-full p-4 flex flex-col gap-4 min-w-[250px]">
            <nav className="flex flex-col gap-1">
                <div className="mt-4 flex flex-col gap-1">
                    <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Seus Projetos</p>
                    {projects.map(project => {
                        const isExpanded = expandedProjects.has(project.id)
                        const projectLibraries = fileSystem.filter(f => f.parentId === project.rootFolderId && f.type === 'folder')

                        return (
                            <div key={project.id} className="flex flex-col">
                                {editingProject?.id === project.id ? (
                                    // INLINE EDIT FORM
                                    <div
                                        className="px-3 py-2 bg-[#27272a] rounded-lg flex flex-col gap-2 cursor-default"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveProject()
                                                if (e.key === 'Escape') { setEditingProject(null); setEditName(''); setEditColor('') }
                                            }}
                                            autoFocus
                                            className="w-full px-2 py-1 text-xs bg-[#18181b] border border-[#3f3f46] rounded text-white focus:border-blue-500 outline-none"
                                            placeholder="Nome do projeto"
                                        />

                                        <div className="grid grid-cols-8 gap-0.5 mt-2">
                                            {PROJECT_THEMES.map(theme => (
                                                <button
                                                    key={theme.bg}
                                                    onClick={() => setEditColor(theme.bg)}
                                                    className={`w-3 h-3 rounded-full ${theme.bg} ${editColor === theme.bg ? 'ring-1 ring-white scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'} transition-all`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 justify-end mt-2">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => { setEditingProject(null); setEditName(''); setEditColor('') }}
                                                    className="p-1 hover:text-red-400 text-gray-500"
                                                >
                                                    <X size={12} />
                                                </button>
                                                <button
                                                    onClick={handleSaveProject}
                                                    className="p-1 hover:text-green-400 text-gray-500"
                                                >
                                                    <Check size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // NORMAL VIEW
                                    <div
                                        className={`px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors text-sm group ${currentProjectId === project.id ? 'bg-[#27272a] text-white' : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'}`}
                                        onClick={() => onSelectProject(project.id)}
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
                                                onClick={(e) => startEditingProject(project, e)}
                                                className="p-1 hover:text-white text-gray-500"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => onDeleteProject(project.id, e)}
                                                className="p-1 hover:text-red-400 text-gray-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Sub-libraries */}
                                {isExpanded && (
                                    <div className="flex flex-col gap-0.5 ml-4 pl-4 border-l border-white/5 mt-1 mb-1">
                                        {projectLibraries.length === 0 ? (
                                            <span className="text-[10px] text-zinc-600 py-1 pl-2 italic">Vazio</span>
                                        ) : (
                                            projectLibraries.map(lib => {
                                                const isLibExpanded = expandedFolders.has(lib.id)
                                                // Check content to determine visual type
                                                const libFiles = fileSystem.filter(f => f.parentId === lib.id && (f.type === 'comic' || f.type === 'file'))
                                                const hasSubFolders = fileSystem.some(f => f.parentId === lib.id && f.type === 'folder')

                                                // Heuristic: If it has files but no subfolders, it's likely a Semantic Comic (File)
                                                // "Ashoka 01" case: Folder containing pages.
                                                // "Ashoka" case: Empty folder (Library).
                                                const isLikelyComic = libFiles.length > 0 && !hasSubFolders;

                                                if (isLikelyComic) {
                                                    // RENDER AS FILE (Comic)
                                                    return (
                                                        <div
                                                            key={lib.id}
                                                            className={`px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white/5 group transition-colors ml-5 ${currentFolderId === lib.id ? 'bg-blue-500/20 text-white' : 'text-zinc-400'}`}
                                                            onClick={() => onSelectFolder(lib.id)}
                                                        >
                                                            {/* File Icon White */}
                                                            <File size={14} className="text-white" />
                                                            <span className="truncate flex-1 font-medium text-white">{lib.name}</span>
                                                            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-500">({libFiles.length})</span>

                                                            <div className="hidden group-hover:flex gap-1 ml-auto">
                                                                <button onClick={(e) => startEditingFolder(lib, e)} className="p-1 hover:text-white text-zinc-600 transition-colors">
                                                                    <Pencil size={11} />
                                                                </button>
                                                                <button onClick={(e) => onDeleteFolder(lib.id, e)} className="p-1 hover:text-red-400 text-zinc-600 transition-colors">
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                // RENDER AS FOLDER (Library)
                                                return (
                                                    <div key={lib.id} className="flex flex-col">
                                                        {editingFolder?.id === lib.id ? (
                                                            // INLINE EDIT FOLDER
                                                            <div
                                                                className="px-2 py-1 bg-[#27272a] rounded flex flex-col gap-1 cursor-default"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <input
                                                                    type="text"
                                                                    value={editName}
                                                                    onChange={(e) => setEditName(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveFolder()
                                                                        if (e.key === 'Escape') { setEditingFolder(null); setEditName(''); setEditColor('') }
                                                                    }}
                                                                    autoFocus
                                                                    className="w-full px-2 py-1 text-[10px] bg-[#18181b] border border-[#3f3f46] rounded text-white focus:border-blue-500 outline-none"
                                                                    placeholder="Nome da pasta"
                                                                />
                                                                <div className="flex justify-end gap-1">
                                                                    <button onClick={() => { setEditingFolder(null); setEditName(''); setEditColor('') }} className="p-0.5 hover:text-red-400 text-gray-500">
                                                                        <X size={10} />
                                                                    </button>
                                                                    <button onClick={handleSaveFolder} className="p-0.5 hover:text-green-400 text-gray-500">
                                                                        <Check size={10} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`px-2 py-1.5 rounded flex items-center gap-2 cursor-pointer text-[12px] hover:bg-white/5 group transition-colors ${currentFolderId === lib.id ? 'bg-blue-500/20 text-white' : 'text-zinc-400'}`}
                                                                onClick={() => onSelectFolder(lib.id)}
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
                                                                    <button onClick={(e) => onDeleteFolder(lib.id, e)} className="p-1 hover:text-red-400 text-zinc-600 transition-colors">
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Files inside Library (if expanded) - Usually empty if it's a "Library", but maybe nested comics? */}
                                                        {isLibExpanded && (
                                                            <div className="flex flex-col gap-0.5 ml-6 pl-2 border-l border-white/5">
                                                                {libFiles.map(file => (
                                                                    <div key={file.id} className="px-2 py-1 rounded flex items-center gap-2 text-[11px] text-zinc-400 hover:bg-white/5 cursor-pointer transition-colors group/file">
                                                                        <File size={12} className="text-white opacity-80" />
                                                                        <span className="truncate text-white">{file.name}</span>
                                                                    </div>
                                                                ))}
                                                                {libFiles.length === 0 && (
                                                                    <span className="text-[10px] text-zinc-700 py-1 pl-1 italic">Vazio</span>
                                                                )}
                                                            </div>
                                                        )}
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
