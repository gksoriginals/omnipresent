import {packMedia,unpackMedia} from "./bundle-media.js";
import { DatabaseSync } from "node:sqlite";
import { resolve, dirname } from "node:path";
import { mkdirSync } from "node:fs";
import {
  workspaceSchema,
  bundleSchema,
  createStoryBundle,
  importStoryBundle,
  newProject,
  type Workspace,
  type OmnipresentBundle,
} from "../../shared/workspace.js";

export class SqliteWorkspaceStore {
  readonly dbPath: string;
  private db: DatabaseSync;

  constructor(dbPath: string = process.env.OMNIPRESENT_DB_PATH ?? resolve("output/omnipresent.db")) {
    this.dbPath = dbPath;
    if (dbPath !== ":memory:") {
      mkdirSync(dirname(resolve(dbPath)), { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspace (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        composer TEXT NOT NULL,
        state TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        saved_at INTEGER NOT NULL,
        title TEXT NOT NULL,
        state TEXT NOT NULL
      );
    `);
  }

  read(): Workspace | null {
    const row = this.db.prepare("SELECT data FROM workspace WHERE id = 'current'").get() as { data: string } | undefined;
    if (!row) return null;
    try {
      const parsed = JSON.parse(row.data);
      return workspaceSchema.parse(parsed);
    } catch {
      return null;
    }
  }

  write(workspace: Workspace): void {
    const validated = workspaceSchema.parse(workspace);
    const now = Date.now();
    const data = JSON.stringify(validated);

    this.db.exec("BEGIN TRANSACTION");
    try {
      this.db.prepare("INSERT OR REPLACE INTO workspace (id, data, updated_at) VALUES ('current', ?, ?)").run(data, now);

      this.db.exec("DELETE FROM projects");
      const insertProject = this.db.prepare(
        "INSERT INTO projects (id, title, created_at, updated_at, composer, state) VALUES (?, ?, ?, ?, ?, ?)"
      );
      for (const p of validated.projects) {
        insertProject.run(p.id, p.title, p.createdAt, p.updatedAt, p.composer, JSON.stringify(p.state));
      }

      this.db.exec("DELETE FROM stories");
      const insertStory = this.db.prepare(
        "INSERT INTO stories (id, project_id, saved_at, title, state) VALUES (?, ?, ?, ?, ?)"
      );
      for (const s of validated.stories) {
        insertStory.run(s.id, s.projectId, s.savedAt, s.state.flow?.title ?? "Untitled", JSON.stringify(s.state));
      }

      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  exportStory(storyId: string): OmnipresentBundle {
    const ws = this.read();
    if (!ws) throw Error("Workspace not initialized");
    return packMedia(createStoryBundle(ws, storyId));
  }

  importStory(bundle: unknown): { workspace: Workspace; storyId: string } {
    let ws = this.read();
    if (!ws) {
      const p = newProject();
      ws = { version: 1, activeProjectId: p.id, projects: [p], stories: [] };
    }
    const checked = bundleSchema.parse(bundle);
    const result = importStoryBundle(ws, checked);
    unpackMedia(checked);
    this.write(result.workspace);
    return result;
  }

  close(): void {
    this.db.close();
  }
}
