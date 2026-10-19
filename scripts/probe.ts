import { readFile, writeFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import WebSocket from "ws";
const events: Record<string, any>[] = [];
const socket = new WebSocket("ws://127.0.0.1:4317/session");
const rtts: number[] = [];
const processing: number[] = [];
const transcript: Record<string, any>[] = [];
let stageText = "";
socket.on("message", (raw) => {
  const e = JSON.parse(raw.toString());
  events.push(e);
  if (e.type === "pong") rtts.push(performance.now() - e.id);
  if (e.type === "audio_ack") processing.push(e.processingMs);
  if (e.type === "transcript") transcript.push(e);
  if (e.type === "stage") stageText = e.stage.text;
});
async function until(
  predicate: (e: Record<string, any>) => boolean,
  after = 0,
  timeout = 30000,
) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    const found = events.slice(after).find(predicate);
    if (found) return found;
    await wait(10);
  }
  throw Error("Timed out waiting for probe event");
}
const send = (e: Record<string, unknown>) => socket.send(JSON.stringify(e));
const percentile = (values: number[], p: number) =>
  [...values].sort((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * p))
  ] ?? 0;
let ping: ReturnType<typeof setInterval> | undefined;
try {
  await new Promise<void>((ok, fail) => {
    socket.once("open", ok);
    socket.once("error", fail);
  });
  ping = setInterval(() => send({ type: "ping", id: performance.now() }), 50);
  send({ type: "text", text: "old delayed topic", delay: true });
  send({ type: "text", text: "current topic" });
  await wait(1700);
  assert.equal(stageText, "current topic");
  send({ type: "pause", value: true });
  send({ type: "text", text: "must not appear" });
  await wait(100);
  assert.equal(stageText, "current topic");
  send({ type: "pause", value: false });
  send({ type: "text", text: "cancelled topic", delay: true });
  send({ type: "cancel" });
  await wait(1700);
  assert.equal(stageText, "current topic");
  send({ type: "load_start" });
  await until((e) => e.type === "load_status" && e.status === "running");
  await wait(500);
  const mark = events.length;
  const cancelAt = performance.now();
  send({ type: "cancel" });
  await until(
    (e) => e.type === "load_status" && e.status === "cancelled",
    mark,
  );
  const cancelMs = performance.now() - cancelAt;
  send({ type: "speech_load" });
  const loaded = await until(
    (e) => e.type === "worker_status" && e.status === "ready",
  );
  send({ type: "speech_start" });
  await until((e) => e.type === "worker_status" && e.status === "listening");
  const wav = await readFile(
    process.argv[2] ?? "output/probe/two_cities_16k.wav",
  );
  let offset = 12;
  let pcm: Buffer | undefined;
  while (offset + 8 <= wav.length) {
    const size = wav.readUInt32LE(offset + 4);
    if (wav.toString("ascii", offset, offset + 4) === "fmt ") {
      assert.equal(wav.readUInt16LE(offset + 8), 1);
      assert.equal(wav.readUInt16LE(offset + 10), 1);
      assert.equal(wav.readUInt32LE(offset + 12), 16000);
      assert.equal(wav.readUInt16LE(offset + 22), 16);
    }
    if (wav.toString("ascii", offset, offset + 4) === "data") {
      pcm = wav.subarray(offset + 8, offset + 8 + size);
      break;
    }
    offset += 8 + size + (size % 2);
  }
  assert.ok(pcm, "PCM data required");
  // Realtime-rate file replay through the same socket/worker used by microphone capture.
  send({ type: "load_start" });
  const audioStarted = performance.now();
  for (let at = 0; at < pcm.length; at += 8000) {
    const before = performance.now();
    const index = events.length;
    socket.send(pcm.subarray(at, Math.min(at + 8000, pcm.length)));
    await until((e) => e.type === "audio_ack", index);
    await wait(Math.max(0, 250 - (performance.now() - before)));
  }
  const finalMark = events.length;
  send({ type: "speech_stop" });
  await until(
    (e) => e.type === "worker_status" && e.status === "ready",
    finalMark,
  );
  assert.ok(
    transcript.some((e) => e.final && e.text.trim()),
    "actual STT must produce final text",
  );
  assert.ok(
    transcript.some((e) => !e.final),
    "streaming must produce partials",
  );
  const errors = events.filter(
    (e) => e.type === "error" || e.type === "worker_error",
  );
  assert.equal(errors.length, 0, JSON.stringify(errors));
  const result = {
    recordedAt: new Date().toISOString(),
    scope:
      "Actual Moonshine Small Streaming; realtime WAV replay, no live human microphone or LLM",
    audioSeconds: pcm.length / 32000,
    replayElapsedMs: performance.now() - audioStarted,
    loadMs: loaded.loadMs,
    syntheticLoadCancelMs: cancelMs,
    rttMs: {
      count: rtts.length,
      p50: percentile(rtts, 0.5),
      p95: percentile(rtts, 0.95),
      max: Math.max(...rtts),
    },
    audioProcessingMs: {
      p50: percentile(processing, 0.5),
      p95: percentile(processing, 0.95),
      max: Math.max(...processing),
    },
    transcript,
    metrics: events.filter((e) => e.type === "metrics").slice(-4),
    checks: {
      staleUpdate: true,
      pause: true,
      cancel: true,
      partialTranscript: true,
      finalTranscript: true,
    },
  };
  await mkdir("output/probe", { recursive: true });
  await writeFile("output/probe/results.json", JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        ...result,
        transcript: {
          partialCount: transcript.filter((e) => !e.final).length,
          finalText: transcript.filter((e) => e.final).map((e) => e.text),
        },
      },
      null,
      2,
    ),
  );
} finally {
  clearInterval(ping);
  socket.close();
}
