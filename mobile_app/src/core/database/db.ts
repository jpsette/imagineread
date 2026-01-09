import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('imagine_read.db');
  }
  return dbInstance;
};

export const INITIAL_SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    description TEXT,
    thumbnail_uri TEXT
  );

  CREATE TABLE IF NOT EXISTS comics (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    cover_uri TEXT,
    manifest_uri TEXT,
    author TEXT,
    total_pages INTEGER DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS progress (
    comic_id TEXT PRIMARY KEY NOT NULL,
    current_page_index INTEGER DEFAULT 0,
    last_read_at TEXT,
    is_finished BOOLEAN DEFAULT 0,
    FOREIGN KEY (comic_id) REFERENCES comics (id) ON DELETE CASCADE
  );
`;

export const MIGRATION_002 = `
  ALTER TABLE comics ADD COLUMN download_status TEXT DEFAULT 'NONE';
  ALTER TABLE comics ADD COLUMN download_progress INTEGER DEFAULT 0;
  ALTER TABLE comics ADD COLUMN local_folder_uri TEXT;
`;

export const MIGRATION_003 = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 0
  );
`;

export const MIGRATION_004 = `
  CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY NOT NULL,
    comic_id TEXT NOT NULL,
    page_index INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comic_id) REFERENCES comics (id) ON DELETE CASCADE
  );
`;

export const migrateDbIfNeeded = async (db: SQLite.SQLiteDatabase) => {
  try {
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = result?.user_version ?? 0;

    console.log('Current DB Version:', currentVersion);

    if (currentVersion < 1) {
      console.log('Running Migration 001...');
      await db.execAsync(INITIAL_SCHEMA);
      await db.execAsync('PRAGMA user_version = 1');
      await seedDatabase(db);
    }

    if (currentVersion < 2) {
      console.log('Running Migration 002...');
      try {
        await db.execAsync(MIGRATION_002);
      } catch (e) { console.warn('Migration 002 might have partial run', e); }
      await db.execAsync('PRAGMA user_version = 2');
    }

    if (currentVersion < 3) {
      console.log('Running Migration 003...');
      await db.execAsync(MIGRATION_003);
      await db.execAsync('PRAGMA user_version = 3');
    }

    if (currentVersion < 4) {
      console.log('Running Migration 004...');
      await db.execAsync(MIGRATION_004);
      await db.execAsync('PRAGMA user_version = 4');
    }

  } catch (e) {
    console.error('Migration Error:', e);
  }
};

const seedDatabase = async (db: SQLite.SQLiteDatabase) => {
  // Seed generic data if empty
  const check = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM projects');
  if (check && check.count > 0) return;

  console.log('Seeding Database...');
  await db.execAsync(`
        INSERT INTO projects (id, name, color, description, order_index, thumbnail_uri) VALUES 
        ('p1', 'Manga Translations', '#EF4444', 'Ongoing JP to EN translations', 0, 'https://d32qys9a6wm9no.cloudfront.net/images/movies/poster/55/55ec7fd056461947844075193f411ced_300x442.jpg?t=1613597658'),
        ('p2', 'Marvel Editing', '#3B82F6', 'Color correction and text updates', 1, 'https://cdn.marvel.com/u/prod/marvel/i/mg/c/80/5e3d7536c8ada/clean.jpg'),
        ('p3', 'Indie Collection', '#10B981', 'Personal webcomic favorites', 2, NULL),
        ('p4', 'Sci-Fi Archive', '#F59E0B', 'Vintage sci-fi scans', 3, NULL);

        INSERT INTO comics (id, project_id, title, author, cover_uri) VALUES
        ('c1', 'p1', 'Cyber Guardian Vol. 1', 'Akira T.', 'https://d32qys9a6wm9no.cloudfront.net/images/movies/poster/55/55ec7fd056461947844075193f411ced_300x442.jpg?t=1613597658'),
        ('c2', 'p1', 'Cyber Guardian Vol. 2', 'Akira T.', 'https://d32qys9a6wm9no.cloudfront.net/images/movies/poster/55/55ec7fd056461947844075193f411ced_300x442.jpg?t=1613597658'),
        ('c3', 'p2', 'Iron Legend #1', 'Stan L.', 'https://cdn.marvel.com/u/prod/marvel/i/mg/c/80/5e3d7536c8ada/clean.jpg');
    `);
};

// Initialize helper
export const initDatabase = async () => {
  const db = await getDB();
  await migrateDbIfNeeded(db);
};
