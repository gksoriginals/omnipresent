import type { Preparation } from "../../shared/preparation.js";
import type { AdaptiveComposition } from "../../shared/adaptive.js";
import { validateComposition } from "../../shared/adaptive.js";
import type { Candidate } from "./presentation-policy.js";

const stopWords = new Set("a an the of and or to for in on is are it this that with from as we our how why".split(" "));
const tokens = (value: string) => new Set((value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(t=>t.length>2 && !stopWords.has(t)));
const fingerprint = (state: Preparation) => JSON.stringify({beats:state.flow?.beats.map(b=>({title:b.title,audienceText:b.audienceText,visualId:b.visualId})),visualIds:state.visuals?.map(v=>v.id)});
export type PreparedIndex = { fingerprint: string; revision: number; topics: { beat: number; terms: Set<string>; hasVisual: boolean }[] };
// Index only audience-visible prepared text. No speaker notes or uploaded raw instructions.
export function buildPreparedIndex(state: Preparation): PreparedIndex {
 return { fingerprint:fingerprint(state), revision: state.revision, topics: (state.flow?.beats ?? []).map((beat,i)=>({beat:i,terms:tokens(`${beat.title} ${beat.audienceText ?? ""}`),hasVisual:!!state.visuals?.some(v=>v.id===beat.visualId)})) };
}
export function shortlist(index: PreparedIndex, state: Preparation, speech: string): Candidate[] {
 if (index.revision !== state.revision || index.fingerprint !== fingerprint(state)) throw Error("Stale prepared index");
 const words = tokens(speech.slice(-3000));
 const ranked = index.topics.map(topic=>({...topic,hits:[...topic.terms].filter(t=>words.has(t)).length})).filter(t=>t.hits>0).sort((a,b)=>b.hits-a.hits || a.beat-b.beat).slice(0,3);
 const composition = (topics: typeof ranked): AdaptiveComposition => validateComposition({layout:topics.length>1?"split":"focus",blocks:topics.map((t,i)=>({id:i===0?"primary":"secondary",beat:t.beat,kind:t.hasVisual?"visual":"statement",emphasis:i===0?"strong":"normal",reveal:null}))},state);
 if (/\b(compare|versus|side by side)\b/i.test(speech) && ranked.length>=2) return [{id:`compare-${ranked[0].beat}-${ranked[1].beat}`,score:Math.min(0.95,0.6+(ranked[0].hits+ranked[1].hits)*0.05),composition:composition(ranked.slice(0,2))}];
 return ranked.map(t=>({id:`topic-${t.beat}`,score:Math.min(0.95,0.5+t.hits*0.1),composition:composition([t])}));
}
