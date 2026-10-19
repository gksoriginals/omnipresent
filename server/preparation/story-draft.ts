import {randomUUID} from "node:crypto";
import {flowSchema,type Flow,type Preparation} from "../../shared/preparation.js";
import {prepareEvidence} from "../presentation/prepare-evidence.js";
export function validateReferences(flow: Flow, state: Preparation) {
  for (const visual of state.visuals ?? []) {
    const spec = visual.spec;
    if (spec.kind === "chart" && !state.artifacts.some(a => a.id === spec.sourceArtifactId)) throw Error("Chart references an unknown source");
    if (spec.kind === "diagram" && spec.edges.some(e => e.from >= spec.nodes.length || e.to >= spec.nodes.length)) throw Error("Diagram references an unknown node");
  }
  for (const beat of flow.beats) {
    if (beat.visualId && !state.visuals?.some(v => v.id === beat.visualId)) throw Error("Unknown visual ID");
    if (beat.imageArtifactId && !state.artifacts.some(a => a.id === beat.imageArtifactId && a.media)) throw Error("Unknown image artifact");
    for (const id of beat.artifactIds)
      if (!state.artifacts.some((a) => a.id === id))
        throw Error("Flow references an unknown artifact");
  }
}

// Shared domain operation. Neither a prompt nor a model can approve this draft.
export function proposeStoryDraft(state:Preparation,input:unknown,signal:AbortSignal){
 signal.throwIfAborted();
 const draftSchema=flowSchema.extend({beats:flowSchema.shape.beats.element.omit({evidence:true,componentEvidence:true}).array().min(1).max(12)});
 const flow=draftSchema.parse(input);
 validateReferences(flow,state);
 const prepared=prepareEvidence(flow,state);
 signal.throwIfAborted();
 state.flow=prepared;state.flowBasedOnRevision=state.revision;state.approvedRevision=null;
 state.events.push({id:randomUUID(),from:"storyteller",to:"presenter",kind:"flow.proposed",summary:"Storyteller proposed a flow for review.",revision:state.revision+1});
 state.events=state.events.slice(-60);
 return {saved:true};
}
