import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import WebSocket from "ws";
test("local transport isolates sessions, rejects bad messages and foreign origins", async () => {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "server/index.ts"],
    { env: { ...process.env, PORT: "4328" }, stdio: "pipe" },
  );
  const clients: WebSocket[] = [];
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:4328/api/health")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await wait(30);
    }
    assert.ok(ready);
    async function connect() {
      const ws = new WebSocket("ws://127.0.0.1:4328/session");
      const events: any[] = [];
      ws.on("message", (raw) => events.push(JSON.parse(raw.toString())));
      await new Promise<void>((ok, fail) => {
        ws.once("open", ok);
        ws.once("error", fail);
      });
      clients.push(ws);
      return { ws, events };
    }
    async function until(events: any[], predicate: (e: any) => boolean) {
      for (let i = 0; i < 100; i++) {
        const e = events.find(predicate);
        if (e) return e;
        await wait(10);
      }
      throw Error("Missing server event");
    }
    const a = await connect(),
      b = await connect();
    a.ws.send(JSON.stringify({ type: "text", text: "private to a" }));
    await until(a.events, (e) => e.type === "stage");
    assert.equal(
      b.events.some((e) => e.type === "stage"),
      false,
    );
    const pauseMark = a.events.length;
    a.ws.send(JSON.stringify({ type: "pause", value: true }));
    await until(a.events, e => e.type === "snapshot" && e.paused === true);
    a.ws.send(JSON.stringify({ type: "text", text: "must stay paused" }));
    await wait(80);
    assert.equal(a.events.slice(pauseMark).some(e => e.type === "stage"), false);
    a.ws.send("{");
    assert.ok(await until(a.events, (e) => e.type === "error"));
    const mark = a.events.length;
    a.ws.send(JSON.stringify({ type: "text", text: "x".repeat(6001) }));
    await until(a.events, (_e: any) =>
      a.events.slice(mark).some((e) => e.type === "error"),
    );
    const foreign = new WebSocket("ws://127.0.0.1:4328/session", {
      origin: "https://foreign.example",
    });
    clients.push(foreign);
    const rejected = await new Promise<boolean>((ok) => {
      foreign.once("unexpected-response", (_req, res) => {
        res.resume();
        foreign.terminate();
        ok(res.statusCode === 403);
      });
      foreign.once("error", () => ok(true));
      foreign.once("open", () => ok(false));
    });
    assert.equal(rejected, true);
  } finally {
    for (const ws of clients) ws.terminate();
    child.kill();
    await new Promise<void>((ok) => child.once("exit", () => ok()));
  }
});
