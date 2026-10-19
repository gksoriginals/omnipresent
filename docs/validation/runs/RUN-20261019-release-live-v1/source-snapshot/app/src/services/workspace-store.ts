import {
  WORKSPACE_KEY,
  readWorkspace,
  newProject,
  workspaceSchema,
  type Workspace,
  type StorageLike,
} from "../../../shared/workspace";

export class WorkspaceStore {
  current: Workspace;
  readonly error: string;
  private storage?: StorageLike;
  private syncing = false;
  private generation = 0;
  private pending?: Workspace;
  private saving?: Promise<void>;
  syncError = "";

  async flush(): Promise<void> {
    if (this.syncing) return;
    if (this.saving) { await this.saving; if (this.pending) return this.flush(); return; }
    this.saving = (async () => {
      while (this.pending) {
        const next = this.pending;
        this.pending = undefined;
        try {
          const response = await fetch("/api/workspace", {method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(next)});
          if (!response.ok) throw Error("Server workspace save failed");
          this.syncError = "";
        } catch (error) {
          this.pending ??= next;
          this.syncError = error instanceof Error ? error.message : "Server save unavailable";
          throw error;
        }
      }
    })();
    try { await this.saving; } finally { this.saving = undefined; }
  }
  private queueSave(workspace: Workspace) {
    this.pending = structuredClone(workspace);
    void this.flush().catch(() => {});
  }

  constructor(storage: StorageLike | (() => StorageLike)) {
    try {
      this.storage = typeof storage === "function" ? storage() : storage;
      this.current = readWorkspace(this.storage);
      this.error = "";
    } catch (error) {
      const project = newProject();
      this.current = { version: 1, activeProjectId: project.id, projects: [project], stories: [] };
      this.error = error instanceof Error ? error.message : "Browser storage is unavailable. Projects cannot be saved.";
    }
  }

  commit(next: Workspace): { persisted: boolean; error: string } {
    this.current = next;
    this.generation++;
    this.queueSave(next);
    if (this.error) return { persisted: false, error: this.error };
    try {
      this.storage!.setItem(WORKSPACE_KEY, JSON.stringify(next));
      return { persisted: true, error: "" };
    } catch {
      return {
        persisted: false,
        error: "Browser storage is full or unavailable. Recent project changes are kept in this tab but could not be saved.",
      };
    }
  }

  async syncFromServer(): Promise<Workspace | null> {
    if (typeof fetch === "undefined" || this.syncing) return null;
    this.syncing = true;
    const generation = this.generation;
    try {
      const res = await fetch("/api/workspace");
      if (!res.ok) return null;
      const data = await res.json();
      if (generation !== this.generation) return null;
      if (data.workspace && data.workspace.projects?.length) {
        // If server has saved data, adopt it and cache locally
        this.current = workspaceSchema.parse(data.workspace);
        try {
          this.storage?.setItem(WORKSPACE_KEY, JSON.stringify(this.current));
        } catch {}
        return this.current;
      } else if (this.current.projects?.length) {
        // If server is clean but local storage has user projects, seed server
        this.pending = structuredClone(this.current);
      }
    } catch {
      // Offline or server not responding; local storage continues to work
    } finally {
      this.syncing = false;
      if (this.pending) void this.flush().catch(() => {});
    }
    return null;
  }

  async exportStory(storyId: string): Promise<void> {
    await this.flush();
    const response = await fetch("/api/workspace/export", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({storyId})});
    if (!response.ok) throw Error("Could not export story and its media");
    const bundle = await response.json();
    const title = (bundle.story.state.flow?.title ?? "presentation")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "story"}.omnipresent`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async importStoryFile(file: File): Promise<{ workspace: Workspace; storyId: string }> {
    const text = await file.text();
    const raw = JSON.parse(text);
    await this.flush();
    const response = await fetch("/api/workspace/import", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(raw)});
    if (!response.ok) throw Error("Could not import story; check its media and format");
    const data = await response.json();
    const result = {workspace: workspaceSchema.parse(data.workspace), storyId: String(data.storyId)};
    this.commit(result.workspace);
    return result;
  }
}
