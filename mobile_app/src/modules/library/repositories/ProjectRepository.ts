import { getDB } from '../../../core/database/db';
import { Project as ServiceProject } from '../services/LibraryService';

// Mapper to convert DB row to Service Model
const mapRowToProject = (row: any): ServiceProject => ({
    id: row.id,
    name: row.name,
    color: row.color,
    description: row.description || '',
    comicCount: row.comic_count || 0, // Needs a join or subquery usually, roughly mocking or assuming separate count query
    thumbnailUri: row.thumbnail_uri
});

export const ProjectRepository = {
    async getAllProjects(): Promise<ServiceProject[]> {
        const db = await getDB();
        // Simple query + subquery for count could be expensive, sticking to simple list for MVP or doing a left join
        const rows = await db.getAllAsync(`
            SELECT p.*, (SELECT COUNT(*) FROM comics WHERE project_id = p.id) as comic_count 
            FROM projects p
            ORDER BY order_index ASC
        `);
        return rows.map(mapRowToProject);
    },

    async createProject(project: ServiceProject) {
        const db = await getDB();
        await db.runAsync(
            `INSERT INTO projects (id, name, color, description, thumbnail_uri, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
            [project.id, project.name, project.color, project.description, project.thumbnailUri ?? null, 99]
        );
    },

    async deleteProject(id: string) {
        const db = await getDB();
        await db.runAsync(`DELETE FROM projects WHERE id = ?`, [id]);
    }
};
