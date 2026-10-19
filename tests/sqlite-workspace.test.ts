import { test } from "node:test";
import assert from "node:assert/strict";
import { SqliteWorkspaceStore } from "../server/storage/sqlite-workspace.js";
import { workspaceHandler } from "../server/storage/workspace-handler.js";
import { emptyPreparation } from "../shared/preparation.js";
import { prepareEvidence } from "../server/presentation/prepare-evidence.js";
import { approvePreparedEvidence } from "../server/presentation/component-evidence.js";
import {
  newProject,
  saveStory,
  createStoryBundle,
  importStoryBundle,
  type Workspace,
} from "../shared/workspace.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

function reviewedStory() {
  const state = emptyPreparation();
  state.flow = {
    title: "Solar Storage",
    summary: "Explaining energy storage",
    openQuestions: [],
    beats: [
      {
        title: "Battery Storage",
        audienceText: "Batteries store electricity for nighttime use.",
        speakerNotes: "Private explanation",
        visualDirection: "Concept statement",
        artifactIds: [],
      },
    ],
  };
  state.flow = prepareEvidence(state.flow, state);
  approvePreparedEvidence(state.flow, state);
  state.flowBasedOnRevision = 0;
  state.approvedRevision = 0;
  return state;
}

test("sqlite workspace store initializes, writes and reads workspace atomically", () => {
  const store = new SqliteWorkspaceStore(":memory:");
  try {
    assert.equal(store.read(), null);

    const project = newProject("proj-1");
    project.title = "Solar Presentation";
    project.composer = "Draft message";
    let ws: Workspace = {
      version: 1,
      activeProjectId: project.id,
      projects: [project],
      stories: [],
    };

    store.write(ws);
    const restored = store.read();
    assert.ok(restored);
    assert.equal(restored.activeProjectId, "proj-1");
    assert.equal(restored.projects.length, 1);
    assert.equal(restored.projects[0].title, "Solar Presentation");
    assert.equal(restored.projects[0].composer, "Draft message");

    // Add a reviewed story
    const state = reviewedStory();
    ws = saveStory(ws, "proj-1", state, "story-1");
    store.write(ws);

    const withStory = store.read();
    assert.ok(withStory);
    assert.equal(withStory.stories.length, 1);
    assert.equal(withStory.stories[0].id, "story-1");
    assert.equal(withStory.stories[0].state.flow?.title, "Solar Storage");
  } finally {
    store.close();
  }
});

test("exporting and importing an omnipresent bundle preserves story integrity", () => {
  const storeA = new SqliteWorkspaceStore(":memory:");
  const storeB = new SqliteWorkspaceStore(":memory:");
  try {
    const project = newProject("source-proj");
    project.title = "Source Presentation";
    let ws: Workspace = {
      version: 1,
      activeProjectId: project.id,
      projects: [project],
      stories: [],
    };
    ws = saveStory(ws, project.id, reviewedStory(), "exported-story");
    storeA.write(ws);

    // Export bundle from storeA
    const bundle = storeA.exportStory("exported-story");
    assert.equal(bundle.format, "omnipresent-bundle-v1");
    assert.equal(bundle.story.id, "exported-story");
    assert.equal(bundle.story.state.flow?.title, "Solar Storage");
    assert.equal(bundle.projectTitle, "Source Presentation");

    // Import into fresh storeB
    const { workspace: importedWs, storyId } = storeB.importStory(bundle);
    assert.equal(storyId, "exported-story");
    assert.equal(importedWs.stories.length, 1);
    assert.equal(importedWs.stories[0].id, "exported-story");
    assert.equal(importedWs.stories[0].state.flow?.title, "Solar Storage");
    assert.equal(importedWs.projects.length, 1);

    // Verify evidence contract is preserved
    const beat = importedWs.stories[0].state.flow!.beats[0];
    assert.ok(beat.evidence?.approved);
  } finally {
    storeA.close();
    storeB.close();
  }
});

test("workspace HTTP handler serves GET, PUT, export and import endpoints", async () => {
  const store = new SqliteWorkspaceStore(":memory:");
  const origins = new Set(["http://127.0.0.1:4317", "http://127.0.0.1:5173"]);

  async function mockReq(method: string, url: string, body?: any, origin = "http://127.0.0.1:5173") {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.headers = { host: "127.0.0.1:4317", origin };

    const res = new ServerResponse(req);
    let statusCode = 200;
    const headers: Record<string, string> = {};
    const chunks: Buffer[] = [];

    res.writeHead = (code: number, h?: any) => {
      statusCode = code;
      if (h) Object.assign(headers, h);
      return res;
    };
    res.setHeader = (k: string, v: any) => {
      headers[k.toLowerCase()] = String(v);
      return res;
    };

    const ended = new Promise<void>(ok => {
      res.end = (chunk?: any) => {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        ok();
        return res;
      };
    });

    const handledPromise = workspaceHandler(req, res, origins, store);

    if (body) {
      req.push(JSON.stringify(body));
    }
    req.push(null);

    const handled = await handledPromise;
    await ended;
    const responseText = Buffer.concat(chunks).toString("utf8");
    const json = responseText ? JSON.parse(responseText) : null;
    return { handled, statusCode, headers, json };
  }

  try {
    // 1. Initial GET
    const get1 = await mockReq("GET", "/api/workspace");
    assert.equal(get1.handled, true);
    assert.equal(get1.statusCode, 200);
    assert.equal(get1.json.workspace, null);

    // 2. PUT workspace
    const project = newProject("p1");
    let ws: Workspace = { version: 1, activeProjectId: "p1", projects: [project], stories: [] };
    ws = saveStory(ws, "p1", reviewedStory(), "s1");

    const put1 = await mockReq("PUT", "/api/workspace", ws);
    assert.equal(put1.statusCode, 200);
    assert.equal(put1.json.ok, true);

    // 3. GET after PUT
    const get2 = await mockReq("GET", "/api/workspace");
    assert.equal(get2.json.workspace.stories.length, 1);

    // 4. Export story
    const exp = await mockReq("POST", "/api/workspace/export", { storyId: "s1" });
    assert.equal(exp.statusCode, 200);
    assert.equal(exp.json.format, "omnipresent-bundle-v1");
    assert.equal(exp.json.story.id, "s1");

    // 5. Import story into clean state
    const cleanStore = new SqliteWorkspaceStore(":memory:");
    const importStoreReq = async (bundle: any) => {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.method = "POST";
      req.url = "/api/workspace/import";
      req.headers = { host: "127.0.0.1:4317", origin: "http://127.0.0.1:5173" };
      const res = new ServerResponse(req);
      let statusCode = 200;
      const chunks: Buffer[] = [];
      res.writeHead = (code: number) => { statusCode = code; return res; };
      res.setHeader = () => res;
      const ended = new Promise<void>(ok => {
        res.end = (c?: any) => { if (c) chunks.push(Buffer.from(c)); ok(); return res; };
      });
      const handledPromise = workspaceHandler(req, res, origins, cleanStore);
      req.push(JSON.stringify(bundle));
      req.push(null);
      await handledPromise;
      await ended;
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    };

    const imp = await importStoreReq(exp.json);
    assert.equal(imp.ok, true);
    assert.equal(imp.storyId, "s1");
    assert.equal(cleanStore.read()?.stories.length, 1);
    cleanStore.close();

    // 6. Forbidden origin
    const badOrigin = await mockReq("GET", "/api/workspace", undefined, "http://evil.com");
    assert.equal(badOrigin.statusCode, 403);
  } finally {
    store.close();
  }
});
test("story bundle transfers media to a separate material store and rejects tampering",async()=>{
 const {mkdtempSync,writeFileSync,readFileSync,rmSync}=await import("node:fs");
 const {tmpdir}=await import("node:os");const {join}=await import("node:path");const {createHash}=await import("node:crypto");
 const source=mkdtempSync(join(tmpdir(),"omni-export-")),destination=mkdtempSync(join(tmpdir(),"omni-import-"));
 const old=process.env.OMNIPRESENT_MATERIALS_PATH;
 const first=new SqliteWorkspaceStore(":memory:"),second=new SqliteWorkspaceStore(":memory:");
 try{
  const image=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=","base64");
  const filename=createHash("sha256").update(image).digest("hex")+".png";
  process.env.OMNIPRESENT_MATERIALS_PATH=source;writeFileSync(join(source,filename),image);
  const state=reviewedStory();state.artifacts=[{id:crypto.randomUUID(),name:"image",content:"Authored test image",media:{url:`/api/materials/${filename}`,alt:"Test"}}];
  const project=newProject();project.state=state;
  first.write(saveStory({version:1,activeProjectId:project.id,projects:[project],stories:[]},project.id,state,"portable"));
  const bundle=first.exportStory("portable");assert.equal(bundle.files?.length,1);
  process.env.OMNIPRESENT_MATERIALS_PATH=destination;
  const imported=second.importStory(bundle);assert.equal(imported.storyId,"portable");
  assert.deepEqual(readFileSync(join(destination,filename)),image);
  const corrupted=structuredClone(bundle);corrupted.files![0].base64=Buffer.from("tampered").toString("base64");
  assert.throws(()=>second.importStory(corrupted),/hash/);
  assert.equal(second.read()!.stories.length,1);
 }finally{
  first.close();second.close();rmSync(source,{recursive:true,force:true});rmSync(destination,{recursive:true,force:true});
  if(old===undefined)delete process.env.OMNIPRESENT_MATERIALS_PATH;else process.env.OMNIPRESENT_MATERIALS_PATH=old;
 }
});
