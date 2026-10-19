import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import WebSocket from "ws";
import { emptyPreparation } from "../shared/preparation.js";

import { prepareEvidence } from "../server/presentation/prepare-evidence.js";
import { approvePreparedEvidence } from "../server/presentation/component-evidence.js";

test("dual-screen presenter view and session resumption", async () => {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "--import", "./tests/helpers/local-embedding-preload.mjs", "server/index.ts"],
    { env: { ...process.env, PORT: "4329", OMNIPRESENT_DB_PATH: ":memory:" }, stdio: "pipe" },
  );
  const clients: WebSocket[] = [];

  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:4329/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await wait(30);
    }
    assert.ok(ready, "Server failed to start on port 4329");

    async function connect(urlPath = "/session") {
      const ws = new WebSocket(`ws://127.0.0.1:4329${urlPath}`);
      const events: any[] = [];
      ws.on("message", (raw) => events.push(JSON.parse(raw.toString())));
      await new Promise<void>((ok, fail) => {
        ws.once("open", ok);
        ws.once("error", fail);
      });
      clients.push(ws);
      return { ws, events };
    }

    async function until(events: any[], predicate: (e: any) => boolean, timeoutMs = 2000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const e = events.find(predicate);
        if (e) return e;
        await wait(10);
      }
      throw Error("Missing server event in: " + JSON.stringify(events.map(e => e.type)));
    }

    // Prepare a valid reviewed story
    const prep = emptyPreparation();
    prep.messages.interview=[{role:"user",content:"PRIVATE_INTERVIEW"}];
    prep.artifacts=[{id:crypto.randomUUID(),name:"private-source",content:"PRIVATE_SOURCE"}];
    prep.flow = {
      title: "Resumption Test Story",
      summary: "Testing dual screen and session resumption",
      openQuestions: [],
      beats: [
        { title: "Opening Beat", audienceText: "Welcome", speakerNotes: "Note 0", visualDirection: "text", artifactIds: [] },
        { title: "Middle Beat", audienceText: "Details", speakerNotes: "Note 1", visualDirection: "text", artifactIds: [] },
        { title: "Closing Beat", audienceText: "Summary", speakerNotes: "Note 2", visualDirection: "text", artifactIds: [] },
      ],
    };
    prep.flow = prepareEvidence(prep.flow, prep);
    approvePreparedEvidence(prep.flow, prep);
    prep.approvedRevision = prep.revision;
    prep.flowBasedOnRevision = prep.revision;

    const sessionId = "session-dual-1";

    // 1. Presenter connects and loads presentation
    const presenter = await connect();
    presenter.ws.send(JSON.stringify({
      type: "presentation_load",
      state: prep,
      sessionId,
      projectId: "proj-1",
      storyId: "story-1",
    }));

    const loadedEv = await until(presenter.events, (e) => e.type === "presentation_loaded");
    assert.equal(loadedEv.title, "Resumption Test Story");
    assert.equal(loadedEv.sessionId, sessionId);

    // 2. Audience connects via URL query param
    const audience = await connect(`/session?role=audience&sessionId=${sessionId}`);
    const audLoaded = await until(audience.events, (e) => e.type === "presentation_loaded");
    assert.equal(audLoaded.title, "Resumption Test Story");
    assert.ok(!JSON.stringify(audLoaded).includes("Note 0"));
    assert.ok(!JSON.stringify(audLoaded).includes("PRIVATE_"));
    assert.deepEqual(audLoaded.state.messages,{interview:[],storyteller:[]});
    audience.ws.send(JSON.stringify({type:"presentation_stop"}));
    await until(audience.events,e=>e.type==="error"&&e.message.includes("read-only"));

    // Start presentation
    presenter.ws.send(JSON.stringify({ type: "presentation_start", requestId: "req-1" }));
    await until(presenter.events, (e) => e.type === "presentation_ready" && e.requestId === "req-1");

    // Both receive opening stage (beat 0)
    await until(presenter.events, (e) => e.type === "stage" && e.stage?.composition?.beat === 0);
    await until(audience.events, (e) => e.type === "stage" && e.stage?.composition?.beat === 0);

    // 3. Presenter cues beat 1
    presenter.ws.send(JSON.stringify({ type: "presentation_cue", beatIndex: 1 }));

    // Both presenter and audience must receive the stage update for beat 1
    const presenterStage = await until(presenter.events, (e) => e.type === "stage" && e.stage?.composition?.beat === 1);
    assert.ok(presenterStage);

    const audStage = await until(audience.events, (e) => e.type === "stage" && e.stage?.composition?.beat === 1);
    assert.ok(audStage);
    assert.equal(audStage.stage.text, "Middle Beat");

    // Replacing a still-connected owner must not stop the transferred controller.
    const replacement=await connect();
    replacement.ws.send(JSON.stringify({type:"presentation_load",state:prep,sessionId}));
    assert.equal((await until(replacement.events,e=>e.type==="presentation_loaded")).resumed,true);
    await wait(100);
    replacement.ws.send(JSON.stringify({type:"presentation_cue",beatIndex:0}));
    await until(replacement.events,e=>e.type==="direction_completed"&&e.decision?.cue===0);
    replacement.ws.send(JSON.stringify({type:"presentation_cue",beatIndex:1}));
    await until(replacement.events,e=>e.type==="direction_completed"&&e.decision?.cue===1);
    assert.ok(!audience.events.some(e=>["direction_completed","presentation_trace","transcript","presentation_feedback"].includes(e.type)));
    replacement.ws.close();
    // 4. Presenter disconnects (simulating browser refresh / connection drop)
    presenter.ws.close();
    await wait(100);

    // Audience must stay open and connected during presenter reconnect grace period
    assert.equal(audience.ws.readyState, WebSocket.OPEN);

    // 5. Presenter reconnects with same sessionId
    const resumedPresenter = await connect();
    resumedPresenter.ws.send(JSON.stringify({
      type: "presentation_load",
      state: prep,
      sessionId,
      projectId: "proj-1",
      storyId: "story-1",
    }));

    const resumedLoaded = await until(resumedPresenter.events, (e) => e.type === "presentation_loaded");
    assert.equal(resumedLoaded.resumed, true);
    assert.equal(resumedLoaded.title, "Resumption Test Story");

    // Presenter receives restored stage
    const restoredStage = await until(resumedPresenter.events, (e) => e.type === "stage" && e.stage?.composition?.beat === 1);
    assert.equal(restoredStage.stage.composition.beat, 1);

    // 6. Resumed presenter cues beat 2
    resumedPresenter.ws.send(JSON.stringify({ type: "presentation_cue", beatIndex: 2 }));

    const audStage2 = await until(audience.events, (e) => e.type === "stage" && e.stage?.composition?.beat === 2);
    assert.equal(audStage2.stage.text, "Closing Beat");

    // 7. Explicit presentation stop notifies audience
    resumedPresenter.ws.send(JSON.stringify({ type: "presentation_stop" }));
    const audStopped = await until(audience.events, (e) => e.type === "presentation_stopped");
    assert.ok(audStopped);
    const loading=await connect();
    loading.ws.send(JSON.stringify({type:"presentation_load",state:prep,sessionId:"not-started"}));
    await until(loading.events,e=>e.type==="presentation_loaded");
    const restart=await connect();
    restart.ws.send(JSON.stringify({type:"presentation_load",state:prep,sessionId:"not-started"}));
    assert.equal((await until(restart.events,e=>e.type==="presentation_loaded")).resumed,false,"An interrupted load needs a fresh start handshake");
    restart.ws.send(JSON.stringify({type:"presentation_stop"}));

  } finally {
    for (const c of clients) {
      try { c.close(); } catch {}
    }
    child.kill("SIGTERM");
  }
});
