import { FileEntry } from '../../../../types';


export class LocalFileSystemBridge {

    /**
     * Reads a directory from the local disk and returns it as FileEntries.
     * @param path Absolute path to the directory
     * @param projectId ID of the project this belongs to
     */
    static async readDirectory(path: string, projectId: string): Promise<FileEntry[]> {
        if (!window.electron?.local?.readDirectory) {
            console.error("LocalFileSystemBridge: readDirectory API missing");
            return [];
        }

        const result = await window.electron.local.readDirectory(path);

        if (!result.success || !result.files) {
            console.error(`LocalFileSystemBridge: Failed to read ${path}`, result.error);
            return [];
        }

        return result.files.map(file => ({
            id: `${path}/${file.name}`, // Use Path as ID for local files
            parentId: path,
            projectId: projectId,
            name: file.name,
            type: file.isDirectory ? 'folder' : 'file',
            url: `media://${path}/${file.name}`, // Local Protocol URL
            createdAt: new Date().toISOString(), // Mock date since we don't have stat yet
            isCleaned: false,
            mimeType: this.guessMimeType(file.name)
        }));
    }

    private static guessMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return 'image/' + ext;
        if (['pdf'].includes(ext || '')) return 'application/pdf';
        return 'application/octet-stream';
    }
}
