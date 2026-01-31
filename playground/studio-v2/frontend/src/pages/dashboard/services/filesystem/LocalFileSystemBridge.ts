import { FileEntry } from '@shared/types';


export class LocalFileSystemBridge {

    /**
     * Reads a directory from the local disk and returns it as FileEntries.
     * @param path Absolute path to the directory
     * @param projectId ID of the project this belongs to
     */
    static async readDirectory(path: string, projectId: string): Promise<FileEntry[]> {
        console.log(`📂 [Bridge] Reading directory: ${path}`);
        if (!window.electron?.local?.readDirectory) {
            console.error("LocalFileSystemBridge: readDirectory API missing");
            return [];
        }

        const result = await window.electron.local.readDirectory(path);

        if (!result.success || !result.files) {
            console.error(`LocalFileSystemBridge: Failed to read ${path}`, result.error);
            return [];
        }

        console.log(`✅ [Bridge] Found ${result.files.length} files in ${path}`);

        // Filter out system/hidden files that should not be displayed
        const IGNORED_FILES = ['.DS_Store', 'project.irproject', '.irproject', 'Thumbs.db'];
        const visibleFiles = result.files.filter(file =>
            !file.name.startsWith('.') && !IGNORED_FILES.includes(file.name)
        );

        console.log(`✅ [Bridge] ${visibleFiles.length} visible files after filtering`);

        return await Promise.all(visibleFiles.map(async file => {
            // media:// + absolute path needs 3 slashes total: media:///path
            // Since path is already absolute (starts with /), we use media:// + path
            const absolutePath = `${path}/${file.name}`;
            const url = `media://${absolutePath}`; // absolutePath already starts with /
            const mimeType = this.guessMimeType(file.name);
            const isComicFile = this.isComicFile(file.name);

            // Check if this directory is a comic folder (has comic.json)
            let isComicFolder = false;
            if (file.isDirectory && window.electron?.local?.readFile) {
                const comicJsonPath = `${absolutePath}/comic.json`;
                const result = await window.electron.local.readFile(comicJsonPath);
                isComicFolder = result.success && !!result.content;
                if (isComicFolder) {
                    console.log(`📚 [Bridge] Detected comic folder: ${file.name}`);
                }
            }

            const isComic = isComicFile || isComicFolder;

            console.log(`📎 [Bridge] Generated URL: ${url}, isComic: ${isComic}`);
            return {
                id: absolutePath, // Use Path as ID for local files
                parentId: path,
                projectId: projectId,
                name: file.name,
                type: file.isDirectory ? (isComicFolder ? 'comic' : 'folder') : (isComicFile ? 'comic' : 'file'),
                isComic: isComic, // Explicit flag for comic rendering
                url: url,
                localPath: absolutePath, // Expose full path for cover image derivation
                createdAt: new Date().toISOString(), // Mock date since we don't have stat yet
                isCleaned: false,
                mimeType: mimeType
            };
        }));
    }

    private static isComicFile(filename: string): boolean {
        const ext = filename.split('.').pop()?.toLowerCase();
        return ['pdf', 'cbz', 'cbr', 'cb7'].includes(ext || '');
    }

    private static guessMimeType(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return 'image/' + ext;
        if (['pdf'].includes(ext || '')) return 'application/pdf';
        return 'application/octet-stream';
    }
}
