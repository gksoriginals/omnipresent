import {compositionPlanner} from "./presentation/composition.js";
import {MoonshineSmallStreamingModel} from "./models/speech.js";
import {presentationCatalog} from "./presentation/catalog.js";
import { materials } from "./materials.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { monitorEventLoopDelay } from "node:perf_hooks";
import { WebSocketServer, WebSocket } from "ws";
import {BaselinePresenter} from "./presentation/baseline.js";
import {EmbeddingGemmaModel} from "./models/embeddings.js";
import {decisionRegistry,defaultDecisionModel} from "./models/decisions.js";
import { AdaptiveController } from "./agents/adaptive.js";
import { randomUUID } from "node:crypto";
import { Session } from "./session.js";
import {
  PreparationController,
  validateReferences,
} from "./agents/preparation.js";
import { localModel, modelConfiguration } from "./agents/model.js";
import { emptyPreparation, preparationSchema } from "../shared/preparation.js";
const port = Number(process.env.PORT ?? 4317);
const production = process.argv.includes("--production");
const python = process.env.OMNIPRESENT_PYTHON ?? resolve(".venv/bin/python");
const allowedOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`, "http://127.0.0.1:5173", "http://localhost:5173"]);
const server = createServer(async (req, res) => {
  if (await materials(req, res, python, allowedOrigins)) return;
  if (req.url?.startsWith("/api/trial/")) {
    const name=req.url.slice("/api/trial/".length);
    if(!["manifest.json","generation-first.wav","storage-first.wav","detour-and-return.wav"].includes(name)){res.writeHead(404);res.end();return;}
    try{const content=await readFile(resolve("output/adaptive-trial",name));res.setHeader("Content-Type",name.endsWith(".json")?"application/json":"audio/wav");res.setHeader("Cache-Control","no-store");res.end(content);}catch{res.writeHead(404);res.end("Trial materials have not been generated");}return;
  }
  if (req.url === "/api/health") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, pid: process.pid }));
    return;
  }
  if (!production) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const requested = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname,
    );
    const base = resolve("dist");
    let path = resolve(base, "." + requested);
    if (path !== base && !path.startsWith(base + "/")) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      if (!(await stat(path)).isFile()) path = resolve(base, "index.html");
    } catch {
      path = resolve(base, "index.html");
    }
    const content = await readFile(path);
    res.setHeader(
      "Content-Type",
      (
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".png": "image/png",
        } as Record<string, string>
      )[extname(path)] ?? "application/octet-stream",
    );
    res.end(content);
  } catch {
    res.writeHead(500);
    res.end("Unable to serve application");
  }
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 1048576 });
server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin;
  const allowed = new Set([
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ]);
  if (
    req.url !== "/session" ||
    (origin && !allowed.has(origin)) ||
    wss.clients.size >= 3
  ) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});
const lag = monitorEventLoopDelay({ resolution: 10 });
lag.enable();
wss.on("connection", (ws) => {
  let worker: ChildProcessWithoutNullStreams | undefined;
  let load: ChildProcessWithoutNullStreams | undefined;
  let speechStatus = "unloaded";
  let pendingAudio = false;
  let audioSequence = 0;
  const send = (event: Record<string, unknown>) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (ws.bufferedAmount > 1_000_000) {
        ws.close(1013, "Client too slow");
        return;
      }
      ws.send(JSON.stringify(event));
    }
  };
  let loadedStoryOrigin: {projectId:string;storyId:string} | undefined;
  let loadedStory: ReturnType<typeof preparationSchema.parse> | undefined;
  const session = new Session(send);
  const preparation = new PreparationController(
    emptyPreparation(),
    send,
    localModel,
  );
  const feedback = (question:string) => {
    if (loadedStoryOrigin) {
      send({type:"presentation_feedback", ...loadedStoryOrigin, question});
      return;
    }
    if (preparation.state.events.some(e => e.kind === "context.requested" && e.summary === question)) return;
    preparation.state.events.push({ id: randomUUID(), from: "realtime", to: "interview", kind: "context.requested", revision: preparation.state.revision, summary: question });
    preparation.state.events = preparation.state.events.slice(-60);
    preparation.snapshot();
  };
  let adaptive = new AdaptiveController(session,send,feedback,new BaselinePresenter(new EmbeddingGemmaModel(),defaultDecisionModel(),undefined,undefined,{write:event=>send({type:"presentation_trace",...event})},compositionPlanner(process.env.OMNIPRESENT_COMPOSITION_PLANNER)).decide);
  send(session.snapshot());
  send({ type: "worker_status", status: speechStatus });
  const write = (data: Record<string, unknown>) =>
    worker?.stdin.write(JSON.stringify(data) + "\n");
  function closeSpeech() {
    pendingAudio = false;
    worker?.kill();
    worker = undefined;
    speechStatus = "unloaded";
    send({ type: "worker_status", status: speechStatus });
  }
  function ensureWorker() {
    if (worker) return;
    const child = new MoonshineSmallStreamingModel().spawnWorker(python);
    worker = child;
    // Library progress/logs contain no audio payload. Keep bounded, don't echo source data.
    let diagnostic = "";
    child.stderr.on("data", (chunk) => {
      diagnostic = (diagnostic + chunk.toString()).slice(-1500);
    });
    child.on("error", () => {
      if (worker !== child) return;
      send({
        type: "error",
        message: "Speech worker could not start. Run the local Python setup.",
      });
      closeSpeech();
    });
    child.stdin.on("error", () => {});
    const lines = createInterface({ input: child.stdout });
    lines.on("line", (line) => {
      if (worker !== child) return;
      try {
        const event = JSON.parse(line);
        if (event.type === "worker_status") speechStatus = event.status;
        if (event.type === "audio_ack") pendingAudio = false;
        send(event);
        if (event.type === "transcript" && event.final && event.text?.trim())
          void adaptive.accept(event.text);
      } catch {
        send({ type: "error", message: "Invalid response from speech worker" });
      }
    });
    child.on("exit", (code) => {
      if (worker !== child) return;
      worker = undefined;
      pendingAudio = false;
      speechStatus = "unloaded";
      send({ type: "worker_status", status: speechStatus });
      if (code)
        send({
          type: "error",
          message:
            "Speech worker exited. Retry loading the model; details: " +
            diagnostic.slice(-300),
        });
    });
  }
  function cancelLoad() {
    if (load) {
      load.kill();
      load = undefined;
      send({ type: "load_status", status: "cancelled" });
    }
  }
  ws.on("message", (raw, isBinary) => {
    try {
      if (isBinary) {
        if (speechStatus !== "listening")
          throw Error("Start listening before sending audio");
        const audio = Array.isArray(raw)
          ? Buffer.concat(raw)
          : Buffer.from(raw as ArrayBuffer);
        if (audio.length > 32000 || audio.length % 2)
          throw Error("Invalid PCM frame");
        if (pendingAudio)
          throw Error("Audio worker is busy; wait for acknowledgement");
        pendingAudio = true;
        write({
          type: "audio",
          pcm: audio.toString("base64"),
          sampleRate: 16000,
          sequence: ++audioSequence,
        });
        return;
      }
      const event = JSON.parse(raw.toString());
      switch (event.type) {
        case "preparation_open": {
          const restored = preparationSchema.parse(
            event.state ?? emptyPreparation(),
          );
          if (restored.flow) validateReferences(restored.flow, restored);
          adaptive.stop();
          loadedStory = undefined; loadedStoryOrigin = undefined;
          preparation.cancel();
          preparation.state = restored;
          preparation.snapshot();
          const config = modelConfiguration();
          send({
            type: "agent_config",
            model: config.model,
            local: config.local,
          });
          break;
        }
        case "presentation_load": {
          const story = preparationSchema.parse(event.state);
          if (!story.flow || story.approvedRevision !== story.revision) throw Error("Choose a saved, reviewed story");
          validateReferences(story.flow, story);
          presentationCatalog(story);
          if (event.projectId !== undefined && (typeof event.projectId !== "string" || event.projectId.length > 160 || typeof event.storyId !== "string" || event.storyId.length > 160)) throw Error("Invalid story origin");
          loadedStoryOrigin = typeof event.projectId === "string" ? {projectId:event.projectId,storyId:event.storyId} : undefined;
          loadedStory = story;
          adaptive.stop();
          if(event.decision!==undefined&&event.decision!=="baseline"&&!decisionRegistry.list().some(m=>m.id===event.decision))throw Error("Unknown decision provider");
          const decision=event.decision&&event.decision!=="baseline"?decisionRegistry.get(event.decision):defaultDecisionModel();
          adaptive=new AdaptiveController(session,send,feedback,new BaselinePresenter(new EmbeddingGemmaModel(),decision,undefined,undefined,{write:event=>send({type:"presentation_trace",...event})},compositionPlanner(process.env.OMNIPRESENT_COMPOSITION_PLANNER)).decide);
          adaptive.stop();
          send({ type: "presentation_loaded", title: story.flow.title,baseline:"evidence-v1",decision:decision.id });
          break;
        }
        case "presentation_start":
          presentationCatalog(loadedStory ?? preparation.state);
          adaptive.start(loadedStory ?? preparation.state);
          break;
        case "presentation_stop":
          adaptive.stop();
          break;
        case "presentation_speech":
          if (typeof event.text !== "string" || event.text.length > 6000) throw Error("Invalid speech text");
          void adaptive.accept(event.text);
          break;
        case "finish_interview":
          void preparation.finishInterview().catch(error => send({type: "agent_error", message: error.message}));
          break;
        case "agent_turn":
          if (
            !["interview", "storyteller"].includes(event.role) ||
            typeof event.text !== "string"
          )
            throw Error("Invalid agent request");
          void preparation
            .turn(event.role, event.text)
            .catch((error) =>
              send({ type: "agent_error", message: error.message }),
            );
          break;
        case "agent_cancel":
          preparation.cancel();
          break;
        case "artifact_add":
          if (
            typeof event.name !== "string" ||
            typeof event.content !== "string"
          )
            throw Error("Invalid material");
          preparation.artifact(event.name, event.content, event.media);
          break;
        case "brief_edit":
          preparation.editBrief(event.brief);
          break;
        case "flow_edit":
          preparation.editFlow(event.flow);
          break;
        case "flow_approve":
          preparation.approve();
          break;
        case "ping":
          send({ type: "pong", id: event.id });
          break;
        case "text":
          if (typeof event.text !== "string" || event.text.length > 6000)
            throw Error("Text must be at most 6,000 characters");
          if (session.paused) break;
          adaptive.stop();
          session.propose(
            event.text.trim(),
            "manual",
            event.delay === true ? 1500 : 0,
          );
          break;
        case "pause":
          if (typeof event.value !== "boolean")
            throw Error("Invalid pause state");
          adaptive.pause(event.value);
          break;
        case "cancel":
          adaptive.pause(true);
          session.cancel();
          cancelLoad();
          send({ type: "cancelled" });
          break;
        case "speech_load":
          if (speechStatus === "unloaded") {
            speechStatus = "loading";
            send({ type: "worker_status", status: "loading" });
            ensureWorker();
            write({ type: "load" });
          }
          break;
        case "speech_start":
          if (speechStatus !== "ready")
            throw Error("Speech model is not ready");
          write({ type: "start" });
          break;
        case "speech_stop":
          if (speechStatus === "listening") write({ type: "stop" });
          break;
        case "speech_unload":
          closeSpeech();
          break;
        case "load_start": {
          cancelLoad();
          const child = spawn(python, ["-u", resolve("runtime/stress.py")]);
          load = child;
          send({ type: "load_status", status: "running" });
          child.on("error", () => {
            if (load === child) {
              load = undefined;
              send({
                type: "error",
                message: "Synthetic worker failed to start",
              });
            }
          });
          child.on("exit", (code) => {
            if (load === child) {
              load = undefined;
              send({
                type: "load_status",
                status: code === 0 ? "completed" : "failed",
              });
            }
          });
          break;
        }
        default:
          throw Error("Unknown session action");
      }
    } catch (error) {
      send({
        type: "error",
        message: error instanceof Error ? error.message : "Invalid message",
      });
    }
  });
  const metrics = setInterval(
    () =>
      send({
        type: "metrics",
        serverRssMb: process.memoryUsage().rss / 1048576,
        eventLoopP95Ms: lag.percentile(95) / 1e6,
      }),
    1000,
  );
  ws.on("close", () => {
    clearInterval(metrics);
    adaptive.stop();
    session.cancel();
    preparation.cancel();
    worker?.kill();
    load?.kill();
  });
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Omnipresent session server http://127.0.0.1:${port}`),
);
function shutdown() {
  for (const client of wss.clients) client.terminate();
  lag.disable();
  wss.close();
  server.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
