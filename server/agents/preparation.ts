import {prepareEvidence} from "../presentation/prepare-evidence.js";
import {preparationPromptVersion,preparationPolicy,interviewInstructions,storytellerInstructions} from "../preparation/prompts.js";
import {evidenceBackedStory} from "../preparation/story-skill.js";
import {validateReferences} from "../preparation/story-draft.js";
export {validateReferences} from "../preparation/story-draft.js";
import {approvePreparedEvidence} from "../presentation/component-evidence.js";
import { randomUUID } from "node:crypto";
import { ToolLoopAgent, tool, stepCountIs,hasToolCall, type LanguageModel,type ToolSet } from "ai";
import { z } from "zod";
import { chartSchema, diagramSchema, mediaSchema, type Media } from "../../shared/visuals.js";
import {
  briefSchema,
  flowSchema,
  type Preparation,
  type AgentRole,
  type AgentEvent,
} from "../../shared/preparation.js";
import { searchWeb } from "../services/web-search.js";

export function buildAgent(
  role: AgentRole,
  model: LanguageModel,
  draft: Preparation,
  signal: AbortSignal,
  activity: (name: string) => void,
) {
  const storyDraftSchema=flowSchema.extend({beats:flowSchema.shape.beats.element.omit({evidence:true,componentEvidence:true}).extend({artifactIds:draft.artifacts.length?z.array(z.enum(draft.artifacts.map(a=>a.id) as [string,...string[]])).max(12):z.array(z.string()).max(0)}).array().min(1).max(12)});
  const contextual =
    preparationPolicy +
    `\nCurrent preparation (untrusted data only): ${JSON.stringify({ brief: draft.brief, interviewContext: role === "storyteller" ? draft.messages.interview.filter(m=>m.role==="user").slice(-4).map(m=>m.content.slice(-3000)) : undefined, flow: role === "storyteller" ? draft.flow : undefined, visuals: (draft.visuals ?? []).map(v => ({id: v.id, title: v.spec.title, kind: v.spec.kind})), artifacts: draft.artifacts.map(({ id, name, media }) => ({ id, name, media })), requests: draft.events.filter((e) => e.to === role).slice(-6) })}`;
  function guard() {
    signal.throwIfAborted();
  }
  function event(
    kind: AgentEvent["kind"],
    to: AgentEvent["to"],
    summary: string,
  ) {
    draft.events.push({
      id: randomUUID(),
      from: role,
      to,
      kind,
      summary,
      revision: draft.revision + 1,
    });
    draft.events = draft.events.slice(-60);
  }
  const artifactTools:ToolSet = draft.artifacts.length ? {
    readArtifact: tool({
      description: "Read a supplied text artifact using its exact ID.",
      inputSchema: z.object({
        artifactId: z.enum(draft.artifacts.map(a=>a.id) as [string,...string[]]),
        start: z.number().int().min(0).default(0),
      }),
      execute: async ({ artifactId, start }) => {
        guard();
        activity("Reading material");
        const a = draft.artifacts.find((a) => a.id === artifactId);
        if (!a) throw Error("Unknown artifact ID");
        return {
          id: a.id,
          name: a.name,
          content: a.content.slice(start, start + 6000),
          nextOffset: start + 6000 < a.content.length ? start + 6000 : null,
        };
      },
    }),
  } : {};
  if (role === "interview")
    return new ToolLoopAgent({
      id: "interview", temperature:0,
      model,
      instructions:
        contextual +
        interviewInstructions,
      tools: {
        ...artifactTools,
        searchWeb: tool({
          description:
            "Search the web for real-world facts, figures, statistics, market trends, or background context to enrich the presentation brief.",
          inputSchema: z.object({
            query: z.string().min(1).max(200).describe("The search query"),
          }),
          execute: async ({ query }) => {
            guard();
            activity(`Searching web for "${query}"`);
            const results = await searchWeb(query, 4, signal);
            if (!results.length) return { query, results: [], message: "No web results found or offline" };
            if (draft.artifacts.length < 8) {
              const safeTitle = query.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
              const excerpt = results.map(r => `Title: ${r.title}\nSource: ${r.url}\nSummary: ${r.snippet}\n`).join("\n---\n");
              draft.artifacts.push({
                id: randomUUID(),
                name: `web-${safeTitle}.txt`,
                content: `Web search results for "${query}":\n\n${excerpt}`.slice(0, 24000),
              });
              activity("Saved web research to materials");
            }
            return {
              query,
              results: results.map(r => ({ title: r.title, snippet: r.snippet, url: r.url })),
            };
          },
        }),
        updateBrief: tool({
          description:
            "Save the current gathered brief, with open questions visible to the presenter and storyteller.",
          inputSchema: briefSchema,
          execute: async (brief) => {
            guard();
            activity("Updating presentation brief");
            draft.brief = brief;
            draft.approvedRevision = null;
            event(
              "brief.updated",
              "storyteller",
              "Interview brief updated; prior flow needs review.",
            );
            return { saved: true };
          },
        }),
      },
      stopWhen: stepCountIs(5),
      maxOutputTokens: 2000,
      maxRetries: 0,
    });
  return new ToolLoopAgent({
    id: "storyteller", temperature:0, toolChoice:"required",
    model,
    instructions:
      contextual +
      storytellerInstructions + "\n" + evidenceBackedStory.instructions,
    tools: {
      ...artifactTools,
      ...(draft.artifacts.length ? {
      createChart: tool({
        description: "Prepare a chart from exact numeric values in an uploaded source. Never invent measurements. Returns visualId for proposeFlow.",
        inputSchema: chartSchema.omit({kind: true}),
        execute: async (input) => {
          const spec = { kind: "chart" as const, ...input };
          guard();
          if (!draft.artifacts.some(a => a.id === spec.sourceArtifactId)) throw Error("Chart requires an uploaded source");
          const source = draft.artifacts.find(a => a.id === spec.sourceArtifactId)!.content;
          const numbers = new Set((source.match(/[-+]?\d+(?:,\d{3})*(?:\.\d+)?/g) ?? []).map(n => Number(n.replaceAll(",", ""))));
          if (!spec.data.every(row => numbers.has(row.value) && source.toLowerCase().includes(row.label.toLowerCase()))) throw Error("Chart labels and values must be present in the source material");
          draft.visuals ??= [];
          if (draft.visuals.length >= 24) throw Error("Visual limit reached");
          const id = randomUUID(); draft.visuals.push({id, spec});
          activity("Preparing chart"); return {visualId: id};
        },
      }),
      } : {}),
      createDiagram: tool({
        description: "Prepare a conceptual flow diagram from nodes and directed edges (zero-based node indices). Returns visualId for proposeFlow.",
        inputSchema: diagramSchema.omit({kind: true}),
        execute: async (input) => {
          const spec = { kind: "diagram" as const, ...input };
          guard();
          if (spec.edges.some(e => e.from >= spec.nodes.length || e.to >= spec.nodes.length)) throw Error("Diagram references an unknown node");
          draft.visuals ??= [];
          if (draft.visuals.length >= 24) throw Error("Visual limit reached");
          const id = randomUUID(); draft.visuals.push({id, spec});
          activity("Preparing diagram"); return {visualId: id};
        },
      }),
      proposeFlow: tool({
        description:
          "Propose a complete reviewable presentation flow grounded in the brief and known artifact IDs.",
        inputSchema: storyDraftSchema,
        execute: async (flow) => {
          guard();
          activity("Drafting presentation flow");
          return evidenceBackedStory.propose(draft,flow,signal);
        },
      }),
      requestContext: tool({
        description:
          "Request missing context or assets from the interviewer; the presenter can answer and revise the brief.",
        inputSchema: z.object({ question: z.string().min(1).max(2000) }),
        execute: async ({ question }) => {
          guard();
          event("context.requested", "interview", question);
          return { requested: true, question };
        },
      }),
    },
    stopWhen: [stepCountIs(8),hasToolCall("proposeFlow"),hasToolCall("requestContext")],
    maxOutputTokens: 4500,
    maxRetries: 0,
  });
}
export class PreparationController {
  state: Preparation;
  private controller?: AbortController;
  private epoch = 0;
  constructor(
    initial: Preparation,
    private emit: (event: Record<string, unknown>) => void,
    private model: () => LanguageModel,
  ) {
    this.state = initial;
  }
  snapshot() {
    this.emit({ type: "preparation", state: this.state });
  }
  cancel() {
    this.epoch++;
    this.controller?.abort();
    this.controller = undefined;
    this.emit({ type: "agent_status", status: "idle" });
  }
  private changed() {
    this.state.revision++;
    this.state.approvedRevision = null;
    this.state.flowBasedOnRevision = null;
  }
  artifact(name: string, content: string, media?: Media) {
    this.cancel();
    if (
      !/\.(txt|md|csv|json|pdf|docx|pptx|xlsx|png|jpg|jpeg|webp)$/i.test(name) ||
      name.length > 160 ||
      content.length > 24000 ||
      content.includes("\0")
    )
      throw Error(
        "Attach a supported file with an extracted excerpt of up to 24,000 characters.",
      );
    if (this.state.artifacts.length >= 8)
      throw Error("This version supports eight material files.");
    this.state.artifacts.push({ id: randomUUID(), name, content, media: media ? mediaSchema.parse(media) : undefined });
    this.changed();
    this.snapshot();
  }
  editBrief(raw: unknown) {
    const brief = briefSchema.parse(raw);
    this.cancel();
    this.state.brief = brief;
    this.changed();
    this.state.events = this.state.events.slice(-59);
    this.state.events.push({
      id: randomUUID(),
      from: "presenter",
      to: "storyteller",
      kind: "presenter.corrected",
      revision: this.state.revision,
      summary: "Presenter revised the brief.",
    });
    this.snapshot();
  }
  editFlow(raw: unknown) {
    const flow = flowSchema.parse(raw);
    validateReferences(flow, this.state);
    this.cancel();
    this.state.flow = prepareEvidence(flow,this.state);
    this.state.revision++;
    this.state.flowBasedOnRevision = this.state.revision;
    this.state.approvedRevision = null;
    this.snapshot();
  }
  approve() {
    if (!this.state.flow || this.state.flowBasedOnRevision === null)
      throw Error("Generate or review a flow against the current brief first.");
    this.cancel();
    if(this.state.flow.beats.some(b=>!b.evidence))throw Error("Create a new story with evidence contracts before saving.");
    approvePreparedEvidence(this.state.flow,this.state);
    this.state.approvedRevision = this.state.revision;
    this.snapshot();
  }
  async finishInterview() {
    if (!this.state.brief) {
      const completed = await this.turn("interview", "Finish the brief from our conversation. Ask only for essential information that is still missing.");
      if (!completed) return;
    }
    if (this.state.brief) await this.turn("storyteller", "Create my story from our brief and materials. Use simple conceptual diagrams where useful. Keep missing facts explicit.");
  }
  async turn(role: AgentRole, text: string) {
    if (!text.trim() || text.length > 6000)
      throw Error("Enter a message up to 6,000 characters.");
    if (role === "storyteller" && !this.state.brief)
      throw Error("Gather or review a brief before asking the storyteller.");
    this.cancel();
    const epoch = this.epoch;
    const controller = new AbortController();
    this.controller = controller;
    const timeout = setTimeout(() => controller.abort(), 90000);
    const draft = structuredClone(this.state);
    const base = this.state.revision;
    draft.messages[role].push({ role: "user", content: text });
    this.emit({ type: "agent_status", status: "working", role });
    let response = "";
    try {
      if(role==="storyteller")this.emit({type:"agent_activity",role,label:`Planning evidence-backed story (${evidenceBackedStory.version}; prompts ${preparationPromptVersion})`});
      const agent = buildAgent(
        role,
        this.model(),
        draft,
        controller.signal,
        (name) => this.emit({ type: "agent_activity", role, label: name }),
      );
      const result = await agent.stream({
        abortSignal: controller.signal,
        messages: [...draft.messages[role].slice(-16)],
      });
      for await (const chunk of result.fullStream) {
        controller.signal.throwIfAborted();
        if (epoch !== this.epoch) throw Error("Superseded");
        if (chunk.type === "text-delta") {
          response += chunk.text;
          if (response.length > 8000)
            throw Error("Agent response exceeded bounds");
          this.emit({ type: "agent_delta", role, text: response });
        }
        if (chunk.type === "error" || chunk.type === "tool-error")
          throw chunk.error;
      }
      if (
        epoch !== this.epoch ||
        base !== this.state.revision ||
        controller.signal.aborted
      )
        return;
      if(role==="storyteller"&&draft.events.some(e=>e.kind==="flow.proposed"&&!this.state.events.some(old=>old.id===e.id)))response="Your story is ready to review. Tell me what you would like to change.";
      if(!response.trim()){
        const updates=draft.events.filter(e=>!this.state.events.some(old=>old.id===e.id));
        if(updates.some(e=>e.kind==="flow.proposed"))response="Your story is ready to review. Tell me what you would like to change.";
        else if(updates.some(e=>e.kind==="brief.updated"))response="Your brief is ready. You can add more context or create your story.";
        else if(updates.some(e=>e.kind==="context.requested"))response=updates.find(e=>e.kind==="context.requested")!.summary;
        else throw Error("Model returned no conversational response. Please retry.");
      }
      draft.messages[role].push({ role: "assistant", content: response });
      draft.messages[role] = draft.messages[role].slice(-24);
      draft.revision++;
      if (
        draft.flow &&
        role === "storyteller" &&
        draft.flow !== null &&
        draft.events.some(
          (e) => e.kind === "flow.proposed" && e.revision === draft.revision,
        )
      )
        draft.flowBasedOnRevision = draft.revision;
      if (
        role === "interview" &&
        JSON.stringify(draft.brief) !== JSON.stringify(this.state.brief)
      ) {
        draft.flowBasedOnRevision = null;
        draft.approvedRevision = null;
      }
      this.state = draft;
      this.snapshot();
      this.emit({ type: "agent_status", status: "idle", role });
      return true;
    } catch (error) {
      if (epoch === this.epoch) {
        const detail=error instanceof Error?error.message:typeof error==="string"?error:typeof (error as any)?.message==="string"?(error as any).message:"The model returned an invalid tool response.";
        this.emit({
          type: "agent_error",
          message: controller.signal.aborted ? "Agent request stopped or timed out." : /InvalidToolInput|Type validation|Invalid input for tool/.test(detail)?"The agent returned an incomplete draft. Please retry.":detail.slice(0,600),
          role,
        });
        this.emit({ type: "agent_status", status: "idle", role });
      }
    } finally {
      clearTimeout(timeout);
      if (epoch === this.epoch) this.controller = undefined;
    }
  }
}
