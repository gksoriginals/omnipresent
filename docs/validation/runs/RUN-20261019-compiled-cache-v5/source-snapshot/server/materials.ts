import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execute = promisify(execFile);
const root = resolve("output/materials");
let extracting = false;
export async function materials(req: IncomingMessage, res: ServerResponse, python: string, allowedOrigins: Set<string>) {
  if (!req.url?.startsWith("/api/materials")) return false;
  try {
    if (req.method === "GET" && /^\/api\/materials\/[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/.test(req.url)) {
      const data = await readFile(resolve(root, req.url.split("/").at(-1)!));
      const mime = extname(req.url).slice(1).replace("jpg", "jpeg");
      res.setHeader("Content-Type", `image/${mime}`); res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "private, max-age=31536000, immutable"); res.end(data); return true;
    }
    if (req.method !== "POST" || req.url !== "/api/materials") throw Error("Unsupported material request");
    if (req.headers.origin && !allowedOrigins.has(req.headers.origin)) throw Error("Unsupported upload origin");
    if (extracting) throw Error("Another file is being processed. Please retry shortly.");
    const name = decodeURIComponent(String(req.headers["x-file-name"] ?? ""));
    const extension = extname(name).toLowerCase();
    if (!name || name.length > 160 || !/^\.(pdf|docx|pptx|xlsx|txt|md|csv|json|png|jpg|jpeg|webp)$/.test(extension)) throw Error("Choose PDF, Word, PowerPoint, Excel, text, CSV, JSON, PNG, JPEG or WebP.");
    extracting = true;
    let path: string | undefined;
    try {
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8_000_000) throw Error("Choose a file smaller than 8 MB.");
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);
      if (!data.length) throw Error("The file is empty");
      const digest = createHash("sha256").update(data).digest("hex");
      await mkdir(root, { recursive: true });
      path = resolve(root, digest + extension);
      await writeFile(path, data);
      const { stdout } = await execute(python, [resolve("runtime/ingest.py"), path], { timeout: 30000, maxBuffer: 200000 });
      const result = JSON.parse(stdout);
      const image = /\.(png|jpe?g|webp)$/.test(extension);
      if (!image) { await unlink(path); path = undefined; }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ name, ...result, media: image ? { url: `/api/materials/${digest}${extension}`, alt: name } : undefined }));
    } catch (error) {
      if (path) await unlink(path).catch(() => {});
      throw error;
    } finally { extracting = false; }
  } catch (error) {
    res.writeHead(400, { "Content-Type": "application/json" });
    const message = error instanceof Error && !('cmd' in error) ? error.message : "Could not extract this file. Check its format; scanned PDFs need OCR, which is not enabled.";
    res.end(JSON.stringify({ error: message }));
  }
  return true;
}
