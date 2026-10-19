import {audienceState,audienceEvent} from "./presentation/audience.js";
import {runtimeDefaults} from './config/defaults.js';
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
import {createPresenter} from "./presentation/factory.js";
import {EmbeddingGemmaModel} from "./models/embeddings.js";
import {decisionRegistry} from "./models/decisions.js";
import { AdaptiveController } from "./agents/adaptive.js";
import { randomUUID } from "node:crypto";
import { Session } from "./session.js";
import {
  PreparationController,
  validateReferences,
} from "./agents/preparation.js";
import { localModel, modelConfiguration } from "./agents/model.js";
import { emptyPreparation, preparationSchema } from "../shared/preparation.js";
import { SqliteWorkspaceStore } from "./storage/sqlite-workspace.js";
import { workspaceHandler } from "./storage/workspace-handler.js";
const port = Number(process.env.PORT ?? 4317);
const production = process.argv.includes("--production");
const python = process.env.OMNIPRESENT_PYTHON ?? resolve(".venv/bin/python");
const allowedOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`, "http://127.0.0.1:5173", "http://localhost:5173"]);
const workspaceStore = new SqliteWorkspaceStore();
const server = createServer(async (req, res) => {
  if (await materials(req, res, python, allowedOrigins)) return;
  if (await workspaceHandler(req, res, allowedOrigins, workspaceStore)) return;
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
  const reqPath = req.url ? new URL(req.url, "http://localhost").pathname : "";
  if (
    reqPath !== "/session" ||
    (origin && !allowed.has(origin)) ||
    wss.clients.size >= 16
  ) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});
const lag = monitorEventLoopDelay({ resolution: 10 });
lag.enable();

interface SpeechRuntime {worker?: ChildProcessWithoutNullStreams;speechStatus:string;pendingAudio:boolean;audioSequence:number}
interface LivePresentationSession {
  disposed?:boolean;
  started:boolean;
  speech:SpeechRuntime;
  sessionId: string;
  storyOrigin?: { projectId: string; storyId: string };
  story: ReturnType<typeof preparationSchema.parse>;
  session: Session;
  adaptive: AdaptiveController;
  activePresenter: ReturnType<typeof createPresenter>;
  presenterSocket: WebSocket | null;
  audienceSockets: Set<WebSocket>;
  graceTimer: NodeJS.Timeout | null;
  lastStage: any;
  lastSnapshot: any;
  lastTranscript?: string;
  presentationEpoch: number;
}

const liveSessions = new Map<string, LivePresentationSession>();
const pendingAudienceSockets = new Map<string, Set<WebSocket>>();

function teardownLiveSession(sessionId: string) {
  const ls = liveSessions.get(sessionId);
  if (!ls) return;
  if (ls.graceTimer) {
    clearTimeout(ls.graceTimer);
    ls.graceTimer = null;
  }
  ls.disposed=true;
  ls.adaptive.stop();
  ls.session.cancel();
  ls.activePresenter.presenter.close();
  ls.speech.worker?.kill();
  const stopMsg = JSON.stringify({ type: "presentation_stopped" });
  for (const audWs of ls.audienceSockets) {
    if (audWs.readyState === WebSocket.OPEN) {
      try { audWs.send(stopMsg); } catch {}
    }
  }
  ls.audienceSockets.clear();
  liveSessions.delete(sessionId);
}

function attachAudienceSocket(ws: WebSocket, sid: string) {
  const existing = liveSessions.get(sid);
  if (existing) {
    existing.audienceSockets.add(ws);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "presentation_loaded",
        title: existing.story.flow!.title,
        state: audienceState(existing.story),
        sessionId: sid,
      }));
      if (existing.lastSnapshot) ws.send(JSON.stringify(existing.lastSnapshot));
      if (existing.lastStage) ws.send(JSON.stringify({ type: "stage", stage: existing.lastStage }));
    }
  } else {
    if (!pendingAudienceSockets.has(sid)) pendingAudienceSockets.set(sid, new Set());
    pendingAudienceSockets.get(sid)!.add(ws);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "waiting_for_presentation", sessionId: sid }));
    }
  }
}

wss.on("connection", (ws, req: any) => {
  let activeLiveSession: LivePresentationSession | undefined;
  let attachedAudienceSessionId: string | undefined;

  const reqUrl = req?.url ? new URL(req.url, "http://localhost") : null;
  const initialRole = reqUrl?.searchParams.get("role");
  const initialSessionId = reqUrl?.searchParams.get("sessionId");
  if (initialRole === "audience" && initialSessionId) {
    attachedAudienceSessionId = initialSessionId;
    attachAudienceSocket(ws, initialSessionId);
  }

  let speech:SpeechRuntime={speechStatus:"unloaded",pendingAudio:false,audioSequence:0};
  let load: ChildProcessWithoutNullStreams | undefined;
  const send = (event: Record<string, unknown>) => {
    if((initialRole==="audience"||attachedAudienceSessionId)&&!["error","pong","waiting_for_presentation"].includes(String(event.type)))return;
    if (ws.readyState === WebSocket.OPEN) {
      if (ws.bufferedAmount > 1_000_000) {
        ws.close(1013, "Client too slow");
        return;
      }
      ws.send(JSON.stringify(event));
    }
  };
  const broadcastPresentation = (event: Record<string, unknown>) => {
    if (activeLiveSession?.disposed) return;
    if (activeLiveSession) {
      if (event.type === "stage") activeLiveSession.lastStage = event.stage;
      if (event.type === "snapshot") activeLiveSession.lastSnapshot = event;
      const str = JSON.stringify(event);
      const publicEvent=audienceEvent(event);
      if (activeLiveSession.presenterSocket && activeLiveSession.presenterSocket.readyState === WebSocket.OPEN) {
        if (activeLiveSession.presenterSocket.bufferedAmount <= 1_000_000) {
          activeLiveSession.presenterSocket.send(str);
        }
      }
      for (const aud of activeLiveSession.audienceSockets) {
        if (publicEvent && aud.readyState === WebSocket.OPEN && aud.bufferedAmount <= 1_000_000) {
          try { aud.send(JSON.stringify(publicEvent)); } catch {}
        }
      }
    } else {
      send(event);
    }
  };
  let presentationEpoch=0;
  let loadedStoryOrigin: {projectId:string;storyId:string} | undefined;
  let loadedStory: ReturnType<typeof preparationSchema.parse> | undefined;
  let session = new Session(broadcastPresentation);
  const preparation = new PreparationController(
    emptyPreparation(),
    send,
    localModel,
  );
  const feedback = (question:string) => {
    if (loadedStoryOrigin) {
      broadcastPresentation({type:"presentation_feedback", ...loadedStoryOrigin, question});
      return;
    }
    if (preparation.state.events.some(e => e.kind === "context.requested" && e.summary === question)) return;
    preparation.state.events.push({ id: randomUUID(), from: "realtime", to: "interview", kind: "context.requested", revision: preparation.state.revision, summary: question });
    preparation.state.events = preparation.state.events.slice(-60);
    preparation.snapshot();
  };
  let activePresenter=createPresenter(undefined,new EmbeddingGemmaModel(),{write:event=>broadcastPresentation({type:"presentation_trace",...event})},compositionPlanner(process.env.OMNIPRESENT_COMPOSITION_PLANNER??runtimeDefaults.presentation.planner));
  let adaptive = new AdaptiveController(session,broadcastPresentation,feedback,activePresenter.presenter.decide);
  send(session.snapshot());
  send({ type: "worker_status", status: speech.speechStatus });
  const write = (data: Record<string, unknown>) =>
    speech.worker?.stdin.write(JSON.stringify(data) + "\n");
  function closeSpeech() {
    speech.pendingAudio = false;
    speech.worker?.kill();
    speech.worker = undefined;
    speech.speechStatus = "unloaded";
    send({ type: "worker_status", status: speech.speechStatus });
  }
  function ensureWorker() {
    if (speech.worker) return;
    const child = new MoonshineSmallStreamingModel().spawnWorker(python);
    speech.worker = child;
    // Library progress/logs contain no audio payload. Keep bounded, don't echo source data.
    let diagnostic = "";
    child.stderr.on("data", (chunk) => {
      diagnostic = (diagnostic + chunk.toString()).slice(-1500);
    });
    child.on("error", () => {
      if (speech.worker !== child) return;
      send({
        type: "error",
        message: "Speech worker could not start. Run the local Python setup.",
      });
      closeSpeech();
    });
    child.stdin.on("error", () => {});
    const lines = createInterface({ input: child.stdout });
    lines.on("line", (line) => {
      if (speech.worker !== child) return;
      try {
        const event = JSON.parse(line);
        if (event.type === "worker_status") {
          speech.speechStatus = event.status;

        }
        if (event.type === "audio_ack") speech.pendingAudio = false;
        broadcastPresentation(event);
        if (event.type === "transcript" && event.final && event.text?.trim()) {
          if (activeLiveSession) activeLiveSession.lastTranscript = event.text;
          void adaptive.accept(event.text);
        }
      } catch {
        send({ type: "error", message: "Invalid response from speech worker" });
      }
    });
    child.on("exit", (code) => {
      if (speech.worker !== child) return;
      speech.worker = undefined;
      speech.pendingAudio = false;
      speech.speechStatus = "unloaded";

      broadcastPresentation({ type: "worker_status", status: speech.speechStatus });
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
      if (activeLiveSession && (activeLiveSession.disposed || activeLiveSession.presenterSocket !== ws)) throw Error("Presenter connection was replaced");
      if (initialRole === "audience" || attachedAudienceSessionId) {
        if (isBinary) throw Error("Audience connections are read-only");
        const message=JSON.parse(raw.toString());
        if(message.type==="ping"){send({type:"pong",id:message.id});return;}
        if(message.type==="session_attach"&&message.role==="audience"&&typeof message.sessionId==="string"&&message.sessionId.length<=160){
          if(attachedAudienceSessionId!==message.sessionId){
            if(attachedAudienceSessionId){liveSessions.get(attachedAudienceSessionId)?.audienceSockets.delete(ws);pendingAudienceSockets.get(attachedAudienceSessionId)?.delete(ws);}
            attachedAudienceSessionId=message.sessionId;attachAudienceSocket(ws,message.sessionId);
          }
          return;
        }
        throw Error("Audience connections are read-only");
      }
      if (isBinary) {
        if (speech.speechStatus !== "listening")
          throw Error("Start listening before sending audio");
        const audio = Array.isArray(raw)
          ? Buffer.concat(raw)
          : Buffer.from(raw as ArrayBuffer);
        if (audio.length > 32000 || audio.length % 2)
          throw Error("Invalid PCM frame");
        if (speech.pendingAudio)
          throw Error("Audio worker is busy; wait for acknowledgement");
        speech.pendingAudio = true;
        write({
          type: "audio",
          pcm: audio.toString("base64"),
          sampleRate: 16000,
          sequence: ++speech.audioSequence,
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
          presentationEpoch++;adaptive.stop();
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
          const sid = typeof event.sessionId === "string" && event.sessionId.length <= 160
            ? event.sessionId
            : (event.projectId && event.storyId ? `${event.projectId}:${event.storyId}` : undefined);

          if(activeLiveSession&&activeLiveSession.sessionId!==sid){teardownLiveSession(activeLiveSession.sessionId);activeLiveSession=undefined;}

          if (sid && liveSessions.has(sid)) {
            const existing = liveSessions.get(sid)!;
            if (existing.graceTimer) {
              clearTimeout(existing.graceTimer);
              existing.graceTimer = null;
            }
            const previousSocket=existing.presenterSocket;
            existing.presenterSocket=ws;
            if (previousSocket && previousSocket !== ws && previousSocket.readyState === WebSocket.OPEN) {
              try { previousSocket.close(1000, "Replaced by new presenter connection"); } catch {}
            }
            existing.presenterSocket = ws;
            activeLiveSession = existing;
            loadedStory = existing.story;
            loadedStoryOrigin = existing.storyOrigin;
            presentationEpoch = existing.presentationEpoch;
            if(activePresenter!==existing.activePresenter)activePresenter.presenter.close();
            if(speech!==existing.speech)speech.worker?.kill();
            session = existing.session;
            adaptive = existing.adaptive;
            activePresenter = existing.activePresenter;
            speech = existing.speech;

            send({
              type: "presentation_loaded",
              title: existing.story.flow!.title,
              baseline: "evidence-v1",
              decision: existing.activePresenter.id,
              resumed: existing.started,
              sessionId: sid,
              state: existing.story,
            });
            if (existing.lastSnapshot) send(existing.lastSnapshot);
            if (existing.lastStage) send({ type: "stage", stage: existing.lastStage });
            send({ type: "worker_status", status: existing.speech.speechStatus });
            if (existing.lastTranscript) send({ type: "transcript", text: existing.lastTranscript, final: true });
            break;
          }

          loadedStoryOrigin = typeof event.projectId === "string" ? {projectId:event.projectId,storyId:event.storyId} : undefined;
          loadedStory = story;
          presentationEpoch++;adaptive.stop();
          if(event.decision!==undefined&&event.decision!=="baseline"&&event.decision!=="local-hybrid"&&event.decision!=="local-classifier"&&event.decision!=="local-reranker"&&!decisionRegistry.list().some(m=>m.id===event.decision))throw Error("Unknown decision provider");
          const selected=createPresenter(event.decision,new EmbeddingGemmaModel(),{write:event=>broadcastPresentation({type:"presentation_trace",...event})},compositionPlanner(process.env.OMNIPRESENT_COMPOSITION_PLANNER??runtimeDefaults.presentation.planner));
          activePresenter.presenter.close();activePresenter=selected;
          adaptive=new AdaptiveController(session,broadcastPresentation,feedback,selected.presenter.decide);
          adaptive.stop();

          if (sid) {
            if (liveSessions.has(sid)) {
              teardownLiveSession(sid);
            }
            const audienceSet = new Set<WebSocket>();
            if (pendingAudienceSockets.has(sid)) {
              for (const audWs of pendingAudienceSockets.get(sid)!) {
                if (audWs.readyState === WebSocket.OPEN) audienceSet.add(audWs);
              }
              pendingAudienceSockets.delete(sid);
            }
            activeLiveSession = {
              sessionId: sid,
              started:false,
              storyOrigin: loadedStoryOrigin,
              story,
              session,
              adaptive,
              activePresenter,
              speech,
              presenterSocket: ws,
              audienceSockets: audienceSet,
              graceTimer: null,
              lastStage: null,
              lastSnapshot: null,
              presentationEpoch,
            };
            liveSessions.set(sid, activeLiveSession);
          }

          broadcastPresentation({ type: "presentation_loaded", title: story.flow.title,baseline:"evidence-v1",decision:selected.id,sessionId:sid,state:story });
          break;
        }
        case "presentation_start": {
          if(event.requestId!==undefined&&(typeof event.requestId!=="string"||event.requestId.length>160))throw Error("Invalid presentation request ID");
          presentationCatalog(loadedStory ?? preparation.state);
          const generation=++presentationEpoch;
          if(activeLiveSession)activeLiveSession.started=true;
          if (activeLiveSession) activeLiveSession.presentationEpoch = generation;
          broadcastPresentation({type:"presentation_status",status:"preparing"});
          void adaptive.start(loadedStory ?? preparation.state).then(()=>{if(generation===(activeLiveSession?.presentationEpoch??presentationEpoch))broadcastPresentation({type:"presentation_ready",requestId:event.requestId});}).catch(error=>{if(generation===(activeLiveSession?.presentationEpoch??presentationEpoch)){if(activeLiveSession)activeLiveSession.started=false;adaptive.stop();broadcastPresentation({type:"agent_error",message:error.message});}});
          break;
        }
        case "presentation_stop":
          presentationEpoch++;adaptive.stop();
          if (activeLiveSession) {
            teardownLiveSession(activeLiveSession.sessionId);
            activeLiveSession = undefined;
          }
          break;
        case "presentation_cue":
          if (typeof event.beatIndex !== "number" || event.beatIndex < 0) throw Error("Invalid beat index");
          adaptive.cue(event.beatIndex);
          break;
        case "session_attach":
          if (typeof event.sessionId !== "string" || event.sessionId.length > 160) throw Error("Invalid sessionId");
          if (event.role === "audience") {
            attachedAudienceSessionId = event.sessionId;
            attachAudienceSocket(ws, event.sessionId);
          }
          break;
        case "presentation_speech":
          if (typeof event.text !== "string" || event.text.length > 6000) throw Error("Invalid speech text");
          if (activeLiveSession) activeLiveSession.lastTranscript = event.text;
          broadcastPresentation({ type: "transcript", text: event.text, final: true });
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
          if (speech.speechStatus === "unloaded") {
            speech.speechStatus = "loading";
            send({ type: "worker_status", status: "loading" });
            ensureWorker();
            write({ type: "load" });
          }
          break;
        case "speech_start":
          if (speech.speechStatus !== "ready")
            throw Error("Speech model is not ready");
          write({ type: "start" });
          break;
        case "speech_stop":
          if (speech.speechStatus === "listening") write({ type: "stop" });
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
    if (attachedAudienceSessionId) {
      liveSessions.get(attachedAudienceSessionId)?.audienceSockets.delete(ws);
      pendingAudienceSockets.get(attachedAudienceSessionId)?.delete(ws);
    }
    for (const [, ls] of liveSessions) {
      ls.audienceSockets.delete(ws);
    }
    for (const [, set] of pendingAudienceSockets) {
      set.delete(ws);
    }
    preparation.cancel();load?.kill();clearInterval(metrics);
    if (activeLiveSession && (activeLiveSession.disposed || activeLiveSession.presenterSocket !== ws)) return;
    if (activeLiveSession && activeLiveSession.presenterSocket === ws) {
      activeLiveSession.presenterSocket = null;
      if (!activeLiveSession.graceTimer) {
        const sid = activeLiveSession.sessionId;
        activeLiveSession.graceTimer = setTimeout(() => {
          teardownLiveSession(sid);
        }, 30000);
      }
      clearInterval(metrics);
      return;
    }
    activePresenter.presenter.close();
    clearInterval(metrics);
    presentationEpoch++;adaptive.stop();
    session.cancel();
    preparation.cancel();
    speech.worker?.kill();
    load?.kill();
  });
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Omnipresent session server http://127.0.0.1:${port}`),
);
function shutdown() {
  for (const [sid] of liveSessions) {
    teardownLiveSession(sid);
  }
  for (const client of wss.clients) client.terminate();
  lag.disable();
  wss.close();
  server.close();
  workspaceStore.close();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
