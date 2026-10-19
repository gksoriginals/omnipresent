import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { setTimeout as wait } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import WebSocket from "ws";
import { emptyPreparation } from "../shared/preparation.js";

// macOS local TTS produces repeatable audio, never a pretend physical microphone.
await mkdir("output/probe/speech-loop", { recursive: true });
const phrases = [
  { id: "storage", text: "Batteries store solar energy for later use after sunset.", expected: 1 },
  { id: "off-topic", text: "My favorite lunch is pasta with tomatoes.", expected: 1 },
  { id: "off-topic-repeat", text: "My favorite lunch is pasta with tomatoes.", expected: 1 },
  { id: "paused", text: "Solar panels convert sunlight into electricity.", expected: 1 },
  { id: "generation", text: "Solar panels convert sunlight into electricity.", expected: 0 },
];
for (const phrase of phrases) {
  const base = `output/probe/speech-loop/${phrase.id}`;
  execFileSync("say", ["-o", `${base}.aiff`, phrase.text]);
  execFileSync("afconvert", ["-f", "WAVE", "-d", "LEI16@16000", "-c", "1", `${base}.aiff`, `${base}.wav`]);
}
const child = spawn(process.execPath, ["--env-file-if-exists=.env", "--import", "tsx", "server/index.ts"], {
  env: { ...process.env, PORT: "4329" }, stdio: "pipe",
});
let diagnostics = "";
child.stderr.on("data", c => diagnostics = (diagnostics + c).slice(-2000));
let socket: WebSocket | undefined;
let ping: ReturnType<typeof setInterval> | undefined;
const events: any[] = [];
async function until(predicate: (e: any) => boolean, after = 0, timeout = 35000) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const event = events.slice(after).find(predicate);
    if (event) return event;
    const error = events.slice(after).find(e => ["error", "worker_error", "agent_error"].includes(e.type));
    if (error) throw Error(error.message);
    await wait(10);
  }
  throw Error(`Timed out: ${diagnostics}`);
}
const send = (event: object) => socket!.send(JSON.stringify(event));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch("http://127.0.0.1:4329/api/health")).ok) { ready = true; break; } } catch {}
    await wait(50);
  }
  assert.ok(ready, diagnostics);
  socket = new WebSocket("ws://127.0.0.1:4329/session");
  socket.on("message", raw => events.push({ ...JSON.parse(raw.toString()), receivedAt: performance.now() }));
  await new Promise<void>((ok, fail) => { socket!.once("open", ok); socket!.once("error", fail); });
  ping = setInterval(() => send({ type: "ping", id: performance.now() }), 100);
  const state = emptyPreparation();
  state.flow = { title: "Solar energy", summary: "Generation and storage", openQuestions: [], beats: [
    { title: "Generation", audienceText: "Solar panels convert sunlight into electricity.", speakerNotes: "PRIVATE: explain the panel.", visualDirection: "Statement", artifactIds: [] },
    { title: "Storage", audienceText: "Batteries store energy for use after sunset.", speakerNotes: "PRIVATE: explain the battery.", visualDirection: "Statement", artifactIds: [] },
  ] };
  state.flowBasedOnRevision = 0; state.approvedRevision = 0;
  send({ type: "preparation_open", state });
  await until(e => e.type === "preparation");
  send({ type: "presentation_start" });
  await until(e => e.type === "stage");
  send({ type: "speech_load" });
  await until(e => e.type === "worker_status" && e.status === "ready");
  const results: any[] = [];
  for (const phrase of phrases) {
    const mark = events.length;
    const paused = phrase.id === "paused";
    send({ type: "pause", value: paused });
    await until(e => e.type === "snapshot" && e.paused === paused, mark);
    send({ type: "speech_start" });
    await until(e => e.type === "worker_status" && e.status === "listening", mark);
    const wav = await readFile(`output/probe/speech-loop/${phrase.id}.wav`);
    let at = 12, pcm: Buffer | undefined;
    while (at + 8 <= wav.length) {
      const size = wav.readUInt32LE(at + 4);
      if (wav.toString("ascii", at, at + 4) === "data") { pcm = wav.subarray(at + 8, at + 8 + size); break; }
      at += 8 + size + size % 2;
    }
    assert.ok(pcm);
    // Add a second of silence for natural endpointing, then flush on stop.
    pcm = Buffer.concat([pcm, Buffer.alloc(32000)]);
    const audioStart = performance.now();
    for (let offset = 0; offset < pcm.length; offset += 8000) {
      const frameStart = performance.now(), index = events.length;
      socket.send(pcm.subarray(offset, offset + 8000));
      await until(e => e.type === "audio_ack", index);
      await wait(Math.max(0, 250 - (performance.now() - frameStart)));
    }
    send({ type: "speech_stop" });
    await until(e => e.type === "worker_status" && e.status === "ready", mark);
    const final = await until(e => e.type === "transcript" && e.final, mark);
    let direction;
    if (!paused) direction = await until(e => e.type === "direction_completed", mark);
    else await wait(1000);
    if (phrase.id === "off-topic-repeat") assert.equal(direction?.cacheHit, true, "Repeated off-topic phrase should use the context-scoped cache");
    const latest = [...events].reverse().find(e => e.type === "stage").stage;
    console.log(JSON.stringify({ id: phrase.id, transcripts: events.slice(mark).filter(e => e.type === "transcript" && e.final), directions: events.slice(mark).filter(e => e.type === "direction_completed"), stage: latest }));
    assert.equal(latest.composition.beat, phrase.expected, phrase.id);
    assert.ok(!latest.composition.body.includes("PRIVATE"));
    if (paused) assert.ok(!events.slice(mark).some(e => e.type === "direction_completed" || e.type === "stage"));
    results.push({ id: phrase.id, suppliedText: phrase.text, finalTranscript: final.text,
      expectedBeat: phrase.expected, selectedBeat: latest.composition.beat,
      finalToDirectionMs: direction ? direction.receivedAt - final.receivedAt : null,
      inferenceMs: direction?.inferenceMs ?? null,
      audioStartToDirectionMs: direction ? direction.receivedAt - audioStart : null,
      cacheHit: direction?.cacheHit ?? false,
      paused });
    console.log(JSON.stringify(results.at(-1)));
  }
  const errors = events.filter(e => ["error", "worker_error", "agent_error"].includes(e.type));
  assert.equal(errors.length, 0, JSON.stringify(errors));
  const rtts = events.filter(e => e.type === "pong").map(e => e.receivedAt - e.id).sort((a,b) => a-b);
  const result = { recordedAt: new Date().toISOString(), scope: "Local macOS synthesized WAV replay at realtime rate through websocket, actual Moonshine STT and Qwen director. Fixture story; no physical microphone or interview/story generation in this probe.",
    model: "qwen3.5:4b", results, rttP95Ms: rtts[Math.floor(rtts.length * .95)],
    partials: events.filter(e => e.type === "transcript" && !e.final).length,
    errors };
  await writeFile("docs/research/speech-loop-cache-validation.json", JSON.stringify(result, null, 2) + "\n");
} catch (error) {
  await writeFile("output/probe/speech-loop-failure.json", JSON.stringify({ error: String(error), events }, null, 2));
  throw error;
} finally {
  clearInterval(ping); socket?.terminate(); child.kill();
  await new Promise<void>(ok => child.once("exit", () => ok()));
}
