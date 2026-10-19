import { validateComposition, type AdaptiveComposition } from "../../shared/adaptive.js";
import type { Preparation } from "../../shared/preparation.js";

// Experimental offline policies. No model, network, media or application state side effects.
export const policyConfig = Object.freeze({ minimumScore: 0.6, immediateScore: 0.9, margin: 0.15, dwellMs: 800, confirmationMs: 1200, maxCandidates: 3 });
export type Strategy = "rules" | "fsm" | "behaviour-tree" | "hybrid";
export type Candidate = { id: string; score: number; composition: AdaptiveComposition };
export type Observation = { type: "observe"; at: number; sequence: number; epoch: number; revision: number; candidates: Candidate[]; missingEvidence?: boolean };
export type PolicyEvent = Observation | { type: "pause" | "resume" | "stop"; at: number };
export type PolicyResult = { action: "hold" | "commit" | "request-context"; reason: string; epoch: number; composition?: AdaptiveComposition; trace: string[] };
type Proposal = { candidate: Candidate; key: string; immediate: boolean };
type Pending = { key: string; at: number };
type Status = "success" | "failure" | "running";
type Node = () => Status;
const sequence = (...nodes: Node[]): Node => () => { for (const node of nodes) { const status = node(); if (status !== "success") return status; } return "success"; };
const fallback = (...nodes: Node[]): Node => () => { for (const node of nodes) { const status = node(); if (status !== "failure") return status; } return "failure"; };
const keyOf = (composition: AdaptiveComposition) => JSON.stringify(composition);

export class PresentationPolicy {
 private lifecycle: "running" | "paused" | "stopped" = "running";
 private phase: "stable" | "confirming" = "stable";
 private epoch = 0;
 private lastAt = -Infinity;
 private lastSequence = -1;
 private lastCommitAt = -Infinity;
 private pending?: Pending;
 private current: AdaptiveComposition;
 private currentKey: string;
 private feedbackSent = false;
 constructor(private strategy: Strategy, private state: Preparation, initial: AdaptiveComposition) {
  this.state = structuredClone(state);
  this.current = validateComposition(initial, this.state);
  this.currentKey = keyOf(this.current);
 }
 snapshot() { return { lifecycle: this.lifecycle, phase: this.phase, epoch: this.epoch, composition: structuredClone(this.current) }; }
 private clearPending() { this.pending = undefined; this.phase = "stable"; }
 handle(event: PolicyEvent): PolicyResult {
  const trace: string[] = [];
  const result = (action: PolicyResult["action"], reason: string, composition?: AdaptiveComposition): PolicyResult => ({ action, reason, epoch: this.epoch, ...(composition ? { composition: structuredClone(composition) } : {}), trace });
  // Common host boundary for every strategy; speech cannot issue lifecycle events.
  if (!Number.isFinite(event.at) || event.at < this.lastAt) return result("hold", "out-of-order-time");
  this.lastAt = event.at;
  if (event.type !== "observe") {
   if (this.lifecycle === "stopped") return result("hold", "stopped");
   this.lifecycle = event.type === "pause" ? "paused" : event.type === "stop" ? "stopped" : "running";
   this.epoch++; this.lastSequence = -1; this.clearPending(); this.feedbackSent = false;
   return result("hold", this.lifecycle);
  }
  if (this.lifecycle !== "running") return result("hold", this.lifecycle);
  if (event.epoch !== this.epoch || event.revision !== this.state.revision) return result("hold", "stale-context");
  if (!Number.isSafeInteger(event.sequence) || event.sequence <= this.lastSequence) return result("hold", "duplicate-or-out-of-order");
  this.lastSequence = event.sequence;
  if (event.missingEvidence) {
   this.clearPending();
   if (this.feedbackSent) return result("hold", "context-already-requested");
   this.feedbackSent = true; return result("request-context", "missing-evidence");
  }
  this.feedbackSent = false;
  let proposal: Proposal | undefined;
  try { proposal = this.select(event, trace); }
  catch { this.clearPending(); return result("hold", "invalid-candidates"); }
  if (!proposal) { this.clearPending(); return result("hold", "no-confident-candidate"); }
  if (proposal.key === this.currentKey) { this.clearPending(); return result("hold", "unchanged"); }
  const commit = () => {
   this.current = proposal.candidate.composition; this.currentKey = proposal.key;
   this.lastCommitAt = event.at; this.clearPending();
   return result("commit", "selected", this.current);
  };
  if (event.at - this.lastCommitAt < policyConfig.dwellMs) { this.clearPending(); return result("hold", "minimum-dwell"); }
  if (this.strategy === "rules") { trace.push("rules:eligible"); return commit(); }
  if (this.strategy === "fsm") {
   trace.push(`fsm:${this.phase}`);
   if (proposal.immediate) return commit();
   if (this.transitionStability(proposal.key, event.at)) return commit();
   return result("hold", "await-confirmation");
  }
  // Reactive priority selector with a persistent blackboard and RUNNING confirmation leaf.
  // Hybrid additionally routes temporal stability through explicit FSM transitions.
  let output: PolicyResult | undefined;
  const immediate: Node = () => { trace.push("bt:immediate"); if (!proposal.immediate) return "failure"; output = commit(); return "success"; };
  const confirmed: Node = () => {
   trace.push("bt:confirmation");
   if (this.strategy === "hybrid") {
    trace.push(`fsm:${this.phase}`);
    if (this.transitionStability(proposal.key, event.at)) return "success";
   } else {
    if (this.pending?.key === proposal.key && event.at - this.pending.at <= policyConfig.confirmationMs) return "success";
    this.pending = { key: proposal.key, at: event.at };
   }
   output = result("hold", "await-confirmation"); return "running";
  };
  fallback(immediate, sequence(confirmed, () => { output = commit(); return "success"; }))();
  return output!;
 }
 private transitionStability(key: string, at: number): boolean {
  switch (this.phase) {
   case "stable": this.pending = {key, at}; this.phase = "confirming"; return false;
   case "confirming":
    if (this.pending?.key === key && at - this.pending.at <= policyConfig.confirmationMs) return true;
    this.pending = {key, at}; return false;
  }
 }
 private select(event: Observation, trace: string[]): Proposal | undefined {
  if (event.candidates.length > policyConfig.maxCandidates) throw Error("Unbounded shortlist");
  const candidates = event.candidates.map(candidate => {
   if (!candidate.id || !Number.isFinite(candidate.score) || candidate.score < 0 || candidate.score > 1) throw Error("Invalid score");
   return { ...candidate, composition: validateComposition(candidate.composition, this.state) };
  }).sort((a,b) => b.score - a.score || a.id.localeCompare(b.id));
  if (new Set(candidates.map(c=>c.id)).size !== candidates.length || new Set(candidates.map(c=>keyOf(c.composition))).size !== candidates.length) throw Error("Duplicate candidates");
  trace.push("guard:grounded-bounded-candidates");
  const first = candidates[0];
  if (!first || first.score < policyConfig.minimumScore) return;
  const gap = first.score - (candidates[1]?.score ?? 0);
  if (gap + Number.EPSILON < policyConfig.margin) return;
  return { candidate: first, key: keyOf(first.composition), immediate: first.score >= policyConfig.immediateScore };
 }
}
