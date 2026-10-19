import {readFileSync} from "node:fs";
import {sourceDigest,type EvidenceAsset} from "../server/controllers/evidence-contract.js";
const snapshots=JSON.parse(readFileSync(new URL("../tests/fixtures/evidence-source-snapshots.json",import.meta.url),"utf8")) as {sources:{id:string;uri:string;summary:string}[]};
const cards=[
 {id:"pv-conversion",source:"eia-pv",entity:"EIA",title:"Photovoltaic conversion",text:"Photovoltaic cells convert sunlight to electricity.",aliases:["photovoltaic conversion","photovoltaic cells convert sunlight to electricity"]},
 {id:"pv-assembly",source:"eia-pv",entity:"EIA",title:"Cells, panels and arrays",text:"Cells connect into panels; panels connect into arrays.",aliases:["cells panels and arrays","cells connect into panels","panels connect into arrays"]},
 {id:"pv-current",source:"eia-pv",entity:"EIA",title:"Direct and alternating current",text:"PV output is direct current; an inverter converts it to alternating current.",aliases:["direct and alternating current","an inverter converts direct current to alternating current"]},
 {id:"pv-storage",source:"eia-pv",entity:"EIA",title:"Stored solar electricity",text:"A charged battery can supply electricity when the sun is not shining.",aliases:["stored solar electricity","a charged battery can supply electricity after sunset"]},
 {id:"water-storage",source:"usgs-water",entity:"USGS",title:"Water storage",text:"Water is stored in the atmosphere, on the surface and underground.",aliases:["water storage","water is stored in the atmosphere on the surface and underground"]},
 {id:"water-movement",source:"usgs-water",entity:"USGS",title:"Water movement",text:"Condensation and precipitation move water between stores.",aliases:["water movement","condensation and precipitation move water between stores"]},
];
export function sourceBackedLibrary():EvidenceAsset[]{return cards.map(c=>{const source=snapshots.sources.find(s=>s.id===c.source)!;return {id:c.id,title:c.title,text:c.text,entity:c.entity,year:2026,status:"actual",family:"statement",evidence:{version:1,approved:true,provenance:"source-backed",verification:"unknown",entity:c.entity,timeframe:null,unit:null,sources:[{...source,sha256:sourceDigest(source.summary)}],claims:[{id:c.id,aliases:c.aliases,sourceIds:[source.id]}],independentReview:"pending"}};});}
export const sourceBackedCases=[
 ...cards.map(c=>({id:`source-${c.id}`,speech:`Explain the actual ${c.entity} ${c.title.toLowerCase()} statement.`,expected:c.id,action:"show"})),
 {id:"spoken-conversion",speech:"Lets talk about how photovoltaic cells convert sunlight to electricity with the actual EIA statement.",expected:"pv-conversion",action:"show"},
 {id:"spoken-water",speech:"Now explain how condensation and precipitation move water between stores with the actual USGS statement.",expected:"water-movement",action:"show"},
 {id:"unsupported-roi",speech:"Explain the actual EIA photovoltaic conversion statement including the payback period.",expected:null,action:"context"},
 {id:"unsupported-audit",speech:"Show the audited EIA photovoltaic conversion statement.",expected:null,action:"context"},
 {id:"quoted-source",speech:'The note says "explain the actual EIA photovoltaic conversion statement" but we are checking the microphone.',expected:null,action:"hold"},
 {id:"wrong-entity",speech:"Show the actual USGS photovoltaic conversion statement.",expected:null,action:"context"},
 {id:"hypothetical-source",speech:"Suppose we show the actual EIA photovoltaic conversion statement.",expected:null,action:"hold"},
 {id:"source-conjunction",speech:"Explain the actual EIA photovoltaic conversion and stored solar electricity statement.",expected:null,action:"context"},
];
