import { create } from 'zustand';
import { Project } from '@shared/types';

interface ProjectState {
    // STATE
    /** List of all available projects */
    projects: Project[];
    /** ID of the currently selected project, or null if none selected */
    currentProjectId: string | null;

    // ACTIONS
    /** Replace the entire projects list */
    setProjects: (projects: Project[]) => void;
    /** Add a new project to the list */
    addProject: (project: Project) => void;
    /** Update an existing project by ID */
    updateProject: (id: string, updates: Partial<Project>) => void;
    /** Remove a project by ID */
    deleteProject: (id: string) => void;
    /** Set the currently active project */
    setCurrentProjectId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    // Initial State
    projects: [],
    currentProjectId: null,

    // Actions implementation
    setProjects: (projects) => set({ projects }),

    addProject: (project) => set((state) => ({
        projects: [...state.projects, project]
    })),

    updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
        )
    })),

    deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id)
    })),

    setCurrentProjectId: (currentProjectId) => set({ currentProjectId })
}));
