import type { IncomingMessage, ServerResponse } from "node:http";
import type { SqliteWorkspaceStore } from "./sqlite-workspace.js";

export async function workspaceHandler(
  req: IncomingMessage,
  res: ServerResponse,
  allowedOrigins: Set<string>,
  store: SqliteWorkspaceStore
): Promise<boolean> {
  if (!req.url?.startsWith("/api/workspace")) return false;

  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Forbidden origin" }));
    return true;
  }

  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  try {
    if (req.method === "GET" && path === "/api/workspace") {
      const current = store.read();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, workspace: current }));
      return true;
    }

    if (req.method === "PUT" && path === "/api/workspace") {
      const body = await readJson(req);
      store.write(body);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, savedAt: Date.now() }));
      return true;
    }

    if (req.method === "POST" && path === "/api/workspace/export") {
      const { storyId } = (await readJson(req)) as { storyId?: string };
      if (!storyId || typeof storyId !== "string") throw Error("Invalid story ID");
      const bundle = store.exportStory(storyId);
      const safeTitle = (bundle.story.state.flow?.title ?? "story").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 40);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.omnipresent"`);
      res.end(JSON.stringify(bundle, null, 2));
      return true;
    }

    if (req.method === "POST" && path === "/api/workspace/import") {
      const bundle = await readJson(req);
      const result = store.importStory(bundle);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, workspace: result.workspace, storyId: result.storyId }));
      return true;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return true;
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Invalid workspace request" }));
    return true;
  }
}

async function readJson(req: IncomingMessage, maxSize = 34_000_000): Promise<any> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxSize) throw Error("Payload too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(text);
}
