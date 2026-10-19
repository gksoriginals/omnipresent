import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";
import { Session } from "../server/session.js";
test("new intent prevents a delayed old intent overwriting the canvas", async () => {
  const events: Record<string, unknown>[] = [];
  const session = new Session((e) => events.push(e));
  session.propose("old topic", "manual", 30);
  session.propose("new topic", "manual");
  await wait(60);
  assert.equal(session.stage.text, "new topic");
  assert.equal(events.length, 1);
});
test("pause invalidates pending work and resume does not replay a backlog", async () => {
  const session = new Session(() => {});
  session.propose("retained", "manual");
  session.propose("pending", "speech", 20);
  session.pause(true);
  session.propose("while paused", "speech");
  await wait(40);
  session.pause(false);
  assert.equal(session.stage.text, "retained");
  session.propose("fresh", "speech");
  assert.equal(session.stage.text, "fresh");
});
test("cancel prevents a pending commit", async () => {
  const session = new Session(() => {});
  session.propose("cancelled", "manual", 20);
  session.cancel();
  await wait(40);
  assert.equal(session.stage.revision, 0);
});
