import { z } from "zod";
import {componentClaimsSchema,componentEvidenceSchema} from "./component-evidence.js";
import {evidenceSchema} from "./evidence.js";
import { visualSchema, mediaSchema, type Visual, type Media } from "./visuals.js";
const text = z.string().trim().min(1).max(2000);
export const briefSchema = z.object({
  topic: text,
  audience: text,
  goal: text,
  durationMinutes: z.number().min(1).max(240),
  keyPoints: z.array(text).min(1).max(12),
  constraints: z.array(text).max(12),
  openQuestions: z.array(text).max(12),
});
export const flowSchema = z.object({
  title: text,
  summary: text,
  beats: z
    .array(
      z.object({
        title: text,
        audienceText: z.string().trim().max(1000).optional(),
        speakerNotes: text,
        visualDirection: text,
        visualId: z.string().optional(),
        imageArtifactId: z.string().optional(),
        artifactIds: z.array(z.string()).max(12),
        evidence: evidenceSchema.optional(),
        componentClaims: componentClaimsSchema.optional(),
        componentEvidence: componentEvidenceSchema.optional(),
        cueAliases: z.array(z.string().trim().min(1).max(1000)).max(12).optional(),
      }),
    )
    .min(1)
    .max(12),
  openQuestions: z.array(text).max(12),
});
export type Brief = z.infer<typeof briefSchema>;
export type Flow = z.infer<typeof flowSchema>;
export type AgentRole = "interview" | "storyteller";
export type Artifact = { id: string; name: string; content: string; media?: Media };
export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};
export type AgentEvent = {
  id: string;
  from: AgentRole | "presenter" | "realtime";
  to: AgentRole | "presenter";
  kind:
    | "brief.updated"
    | "flow.proposed"
    | "context.requested"
    | "presenter.corrected";
  revision: number;
  summary: string;
};
export type Preparation = {
  revision: number;
  brief: Brief | null;
  flow: Flow | null;
  flowBasedOnRevision: number | null;
  approvedRevision: number | null;
  visuals?: { id: string; spec: Visual }[];
  artifacts: Artifact[];
  messages: Record<AgentRole, ConversationMessage[]>;
  events: AgentEvent[];
};
export const emptyPreparation = (): Preparation => ({
  revision: 0,
  brief: null,
  flow: null,
  flowBasedOnRevision: null,
  approvedRevision: null,
  artifacts: [],
  messages: { interview: [], storyteller: [] },
  events: [],
});
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(8000),
});
export const preparationSchema = z.object({
  revision: z.number().int().nonnegative(),
  brief: briefSchema.nullable(),
  flow: flowSchema.nullable(),
  flowBasedOnRevision: z.number().int().nonnegative().nullable(),
  approvedRevision: z.number().int().nonnegative().nullable(),
  visuals: z.array(z.object({ id: z.string().uuid(), spec: visualSchema })).max(24).optional(),
  artifacts: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(160),
        content: z.string().max(24000),
        media: mediaSchema.optional(),
      }),
    )
    .max(8),
  messages: z.object({
    interview: z.array(messageSchema).max(24),
    storyteller: z.array(messageSchema).max(24),
  }),
  events: z
    .array(
      z.object({
        id: z.string(),
        from: z.enum(["interview", "storyteller", "presenter", "realtime"]),
        to: z.enum(["interview", "storyteller", "presenter"]),
        kind: z.enum([
          "brief.updated",
          "flow.proposed",
          "context.requested",
          "presenter.corrected",
        ]),
        revision: z.number(),
        summary: z.string().max(2000),
      }),
    )
    .max(60),
});
