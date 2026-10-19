import { test } from "node:test";
import assert from "node:assert/strict";
import { MockLanguageModelV4 } from "ai/test";
import { simulateReadableStream } from "ai";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { PreparationController,buildAgent } from "../server/agents/preparation.js";
import { emptyPreparation } from "../shared/preparation.js";
const brief = {
  topic: "Local energy",
  audience: "Teachers",
  goal: "Explain solar energy",
  durationMinutes: 10,
  keyPoints: ["Generation", "Storage"],
  constraints: [],
  openQuestions: [],
};
const flow = {
  title: "From sunlight to storage",
  summary: "A simple explanation",
  beats: [
    {
      title: "Capture sunlight",
      speakerNotes: "Introduce panels",
      visualDirection: "Diagram of a panel",
      artifactIds: [],
    },
  ],
  openQuestions: [],
};
const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 10, text: 10, reasoning: 0 },
};
function mock(toolName?: string, input: unknown = {}, delay = 0) {
  let step = 0;
  return new MockLanguageModelV4({
    doStream: async () => {
      const call = step++ === 0 && toolName;
      const chunks: LanguageModelV4StreamPart[] = call
        ? [
            {
              type: "tool-call",
              toolCallId: "call-1",
              toolName: toolName!,
              input: JSON.stringify(input),
            },
          ]
        : [
            { type: "text-start", id: "text" },
            {
              type: "text-delta",
              id: "text",
              delta: "Review this draft and tell me what to change.",
            },
            { type: "text-end", id: "text" },
          ];
      chunks.push({
        type: "finish",
        finishReason: { unified: call ? "tool-calls" : "stop", raw: undefined },
        usage,
      });
      return {
        stream: simulateReadableStream({ chunks, initialDelayInMs: delay }),
      };
    },
  });
}
test("real SDK interviewer tool loop gathers a brief without producing a story", async () => {
  const c = new PreparationController(
    emptyPreparation(),
    () => {},
    () => mock("updateBrief", brief),
  );
  await c.turn("interview", "Ten minutes about solar energy for teachers.");
  assert.deepEqual(c.state.brief, brief);
  assert.equal(c.state.flow, null);
  assert.equal(c.state.events[0].to, "storyteller");
  assert.equal(c.state.messages.interview.length, 2);
});
test("storyteller returns a structured flow, correction invalidates review", async () => {
  const state = emptyPreparation();
  state.brief = brief;
  const c = new PreparationController(
    state,
    () => {},
    () => mock("proposeFlow", flow),
  );
  await c.turn("storyteller", "Develop the flow");
  assert.deepEqual({...c.state.flow,beats:c.state.flow!.beats.map(({evidence,componentEvidence,...b})=>b)}, flow);
  assert.equal(c.state.flow!.beats[0].evidence?.approved,false);
  c.approve();
  assert.equal(c.state.approvedRevision, c.state.revision);
  c.editBrief({ ...brief, audience: "Engineers" });
  assert.equal(c.state.approvedRevision, null);
  assert.equal(c.state.flowBasedOnRevision, null);
  assert.throws(() => c.approve());
});
test("missing context travels back to interviewer without autonomous runaway loops", async () => {
  const state = emptyPreparation();
  state.brief = brief;
  const c = new PreparationController(
    state,
    () => {},
    () =>
      mock("requestContext", {
        question: "Which storage example is available?",
      }),
  );
  await c.turn("storyteller", "Develop the flow");
  assert.equal(c.state.events[0].kind, "context.requested");
  assert.equal(c.state.events[0].to, "interview");
  assert.equal(c.state.flow, null);
});
test("unknown artifact references reject the entire draft", async () => {
  const events: any[] = [];
  const state = emptyPreparation();
  state.brief = brief;
  const c = new PreparationController(
    state,
    (e) => events.push(e),
    () =>
      mock("proposeFlow", {
        ...flow,
        beats: [{ ...flow.beats[0], artifactIds: ["foreign-id"] }],
      }),
  );
  await c.turn("storyteller", "Develop the flow");
  assert.equal(c.state.flow, null);
  assert.ok(events.some((e) => e.type === "agent_error"));
});
test("cancelled old response cannot overwrite a newer presenter correction", async () => {
  const c = new PreparationController(
    emptyPreparation(),
    () => {},
    () => mock("updateBrief", brief, 100),
  );
  const pending = c.turn("interview", "Prepare solar");
  c.editBrief({ ...brief, topic: "Wind" });
  await pending;
  assert.equal(c.state.brief?.topic, "Wind");
  assert.equal(c.state.messages.interview.length, 0);
});

test("finishing the interview hands a committed brief to the separate storyteller", async () => {
 let calls = 0;
 const c = new PreparationController(emptyPreparation(), () => {}, () => calls++ === 0 ? mock("updateBrief",brief) : mock("proposeFlow",flow));
 await c.finishInterview();
 assert.deepEqual(c.state.brief, brief); assert.deepEqual({...c.state.flow,beats:c.state.flow!.beats.map(({evidence,componentEvidence,...b})=>b)},flow);
 assert.equal(c.state.messages.interview.length,2); assert.equal(c.state.messages.storyteller.length,2);
});
test("incomplete interview does not launch a storyteller", async () => {
 let calls = 0;
 const c = new PreparationController(emptyPreparation(), () => {}, () => { calls++; return mock(); });
 await c.finishInterview(); assert.equal(calls,1); assert.equal(c.state.flow,null);
});
test("preparation with no materials exposes no readArtifact tool",()=>{
 const s=emptyPreparation();const agent=buildAgent("interview",mock(),s,new AbortController().signal,()=>{});
 assert.equal(Object.hasOwn(agent.tools,"readArtifact"),false);
});
test("storyteller tool schema excludes host-owned evidence contracts",()=>{
 const s=emptyPreparation();s.brief=brief;const agent=buildAgent("storyteller",mock(),s,new AbortController().signal,()=>{});
 const schema=(agent.tools as any).proposeFlow.inputSchema;assert.equal(Object.hasOwn(schema.shape.beats.element.shape,"evidence"),false);assert.equal(Object.hasOwn(schema.shape.beats.element.shape,"componentEvidence"),false);
});
