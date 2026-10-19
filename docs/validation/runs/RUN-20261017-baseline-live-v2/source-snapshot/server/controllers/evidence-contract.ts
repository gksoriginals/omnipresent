import {createHash} from "node:crypto";
import type {LibraryAsset} from "./library-search.js";
import type {DecisionGate,LibraryDecision} from "./library-policy.js";
export {evidenceSchema,type EvidenceContract} from "../../shared/evidence.js";
import {evidenceSchema,type EvidenceContract} from "../../shared/evidence.js";
export type EvidenceAsset=LibraryAsset & {evidence:EvidenceContract};
export function sourceDigest(text:string){return createHash("sha256").update(text).digest("hex");}
export function validateEvidence(asset:LibraryAsset):EvidenceContract{
 const e=evidenceSchema.parse((asset as EvidenceAsset).evidence);
 if(e.entity!==asset.entity)throw Error("Evidence entity mismatch");
 if(e.timeframe!==null&&e.timeframe!==String(asset.year))throw Error("Evidence timeframe mismatch");
 if(new Set(e.sources.map(s=>s.id)).size!==e.sources.length||new Set(e.claims.map(c=>c.id)).size!==e.claims.length)throw Error("Duplicate evidence identifiers");
 for(const source of e.sources)if(sourceDigest(source.summary)!==source.sha256)throw Error("Source snapshot hash mismatch");
 for(const claim of e.claims)if(claim.sourceIds.some(id=>!e.sources.some(s=>s.id===id)))throw Error("Unknown claim source");
 return e;
}
const normalized=(s:string)=>s.toLowerCase().replace(/[’']/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
const contains=(text:string,phrase:string)=>` ${text} `.includes(` ${normalized(phrase)} `);
export type EvidenceIntent={mode:"present"|"hold"|"clarify"|"missing";reason:string;claims:string[];entities:string[];years:string[];family:LibraryAsset["family"]|null;provenance:"source-backed"|"illustrative"|null;audited:boolean;unit:string|null;unknown:string[]};
// A bounded interpreter over prepared claim aliases, not a general natural-language understanding claim.
export function interpretEvidence(speech:string,assets:readonly LibraryAsset[]):EvidenceIntent{
 const base:EvidenceIntent={mode:"hold",reason:"unresolved-intent",claims:[],entities:[],years:[],family:null,provenance:null,audited:false,unit:null,unknown:[]};
 let original=speech.trim();
 const correction=/^instead of [^"“”]+?\b(show|use|explain)\s+(.+)$/i.exec(original);if(correction)original=`${correction[1]} ${correction[2]}`;
 // Mixed quoted/current clauses are intentionally held; do not strip quotes and accidentally execute them.
 if(/["“”‘]/.test(original)||/(^|\s)'[^']+'(?=$|\s|[,.!?])/.test(original)||/(?:^|\b)(?:if|suppose|hypothetically|imagine|would|could we|dont|do not|not asking|instead|rather than)\b/.test(normalized(original)))return {...base,reason:"quoted-hypothetical-negated-or-corrected"};
 const text=normalized(original);
 if(/^(keep this|keep this visual|keep the current visual)$/.test(text)||/\b(checking|testing) (the )?(microphone|audio)\b/.test(text))return {...base,reason:"keep-or-incidental"};
 const contracts=assets.flatMap(a=>{try{return [{asset:a,e:validateEvidence(a)}];}catch{return [];}});
 const entities=[...new Set(assets.map(a=>a.entity))].filter(e=>contains(text,e));
 const years=[...new Set(text.match(/\b20\d\d\b/g)??[])];
 const claims=[...new Set(contracts.flatMap(({e})=>e.claims.filter(c=>c.aliases.some(alias=>contains(text,alias))).map(c=>c.id)))];
 const families=(["statement","chart","diagram","image"] as const).filter(f=>contains(text,f));
 const statuses=[contains(text,"actual"),contains(text,"illustrative")];
 const audited=contains(text,"audited");
 const units=[...new Set(contracts.map(({e})=>e.unit).filter((u):u is string=>!!u))].filter(u=>contains(text,u));
 const result={...base,claims,entities,years,family:families.length===1?families[0]:null,provenance:statuses[1]?"illustrative" as const:statuses[0]?"source-backed" as const:null,audited,unit:units.length===1?units[0]:null};
 if(!claims.length)return {...result,mode:/\b(show|use|explain|what|how|tell)\b/.test(text)?"missing":"hold",reason:"unknown-requested-claim"};
 if(entities.length>1||years.length>1||families.length>1||statuses.every(Boolean)||units.length>1)return {...result,mode:"clarify",reason:"conflicting-scope"};
 let residual=` ${text} `;
 const consume=(phrase:string)=>{const p=normalized(phrase);if(p)residual=residual.split(` ${p} `).join(" ");};
 const aliases=[...contracts.flatMap(({e})=>e.claims.flatMap(c=>c.aliases)),...entities,...years,...units].sort((a,b)=>b.length-a.length);for(const alias of aliases)consume(alias);
 const glue=new Set("show use explain explaining tell me lets now look at discuss talk about the a an for in of and its measured breakdown actual illustrative audited statement chart diagram image including with please how works work is this".split(" "));
 const unknown=residual.trim().split(/\s+/).filter(t=>t&&!glue.has(t));
 if(unknown.length)return {...result,mode:"missing",reason:"unrecognized-request-obligations",unknown:[...new Set(unknown)]};
 if(!entities.length||!result.family||(!result.provenance&&!audited))return {...result,mode:"clarify",reason:"unspecified-scope"};
 // A concept without a temporal dimension may omit year; numerical series may not.
 const temporal=contracts.some(({asset,e})=>entities.includes(asset.entity)&&e.claims.some(c=>claims.includes(c.id))&&e.timeframe!==null);
 if(temporal&&!years.length)return {...result,mode:"clarify",reason:"unspecified-timeframe"};
 return {...result,mode:"present",reason:"recognized-obligations"};
}
export function supportsEvidence(asset:LibraryAsset,intent:EvidenceIntent,requireReview=false){
 try{const e=validateEvidence(asset);return e.approved&&e.provenance!=="unknown"&&(!requireReview||e.independentReview==="accepted")&&intent.mode==="present"&&intent.entities.includes(e.entity)&&(!intent.years.length||intent.years.includes(e.timeframe??""))&&(!intent.family||asset.family===intent.family)&&(!intent.provenance||e.provenance===intent.provenance)&&(!intent.audited||e.verification==="audited")&&(!intent.unit||e.unit===intent.unit)&&intent.claims.every(id=>e.claims.some(c=>c.id===id));}catch{return false;}
}
export type EvidenceFeedback={audience:"presenter";kind:"missing-evidence"|"clarification";reason:string;claims:string[];unknown:string[]};
export function evidenceGate(options:{requireIndependentReview?:boolean;feedback?:(event:EvidenceFeedback)=>void}={}):DecisionGate{
 const feedback=(i:EvidenceIntent,kind:EvidenceFeedback["kind"],reason=i.reason)=>options.feedback?.({audience:"presenter",kind,reason,claims:i.claims,unknown:i.unknown});
 const evaluate=(speech:string,assets:readonly LibraryAsset[])=>interpretEvidence(speech,assets);
 return {
  before(speech,assets){const i=evaluate(speech,assets);if(i.mode==="hold")return {action:"hold",selected:null};if(i.mode==="clarify"){feedback(i,"clarification");return {action:"hold",selected:null};}if(i.mode==="missing"){feedback(i,"missing-evidence");return {action:"context",selected:null};}if(!assets.some(a=>supportsEvidence(a,i,options.requireIndependentReview??true))){feedback(i,"missing-evidence","no-eligible-evidence");return {action:"context",selected:null};}return null;},
  after(speech,result,assets){if(result.action!=="show")return result;const i=evaluate(speech,assets);const selected=assets.find(a=>a.id===result.selected);if(!selected||!supportsEvidence(selected,i,options.requireIndependentReview??true)){feedback(i,"missing-evidence","selected-evidence-does-not-cover-request");return {action:"context",selected:null};}return result;},
 };
}
