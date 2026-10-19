import type {LibraryAsset} from "../server/controllers/library-search.js";
import type {CueBundle} from "../server/controllers/library-policy.js";
import {largeCases} from "./large-library-fixture.js";
// Preparation metadata is generated from asset titles, never expected labels or target transcripts.
export function cueBundles(assets:readonly LibraryAsset[]):CueBundle[]{return assets.map(a=>{
 const topic=a.title.slice(a.entity.length+2).replace(/, 20\d\d \((actual|illustrative)\)$/u,"").toLowerCase();
 const name=`${a.status} ${a.year} ${a.entity} ${topic} ${a.family}`;
 return {assetId:a.id,requests:[`show the ${name}`,`show ${name}`,`use the ${name}`,`use ${name}`,...a.family==="chart"?[`show the ${name} and its measured breakdown`]:[]]};
});}
export const policyCases=[...largeCases,
 {id:"repeated-solar",speech:"Show the actual 2025 Harbor School solar generation chart and its measured breakdown.",expected:"solar/Harbor School/2025/actual/chart",action:"show"},
 {id:"repeated-solar-again",speech:"Show the actual 2025 Harbor School solar generation chart and its measured breakdown.",expected:"solar/Harbor School/2025/actual/chart",action:"show"},
 {id:"quoted",speech:'The rehearsal note says "show the actual 2025 Harbor School solar generation chart", but we are only checking the microphone.',expected:null,action:"hold"},
 {id:"extra-fact",speech:"Show the actual 2025 Harbor School solar generation chart including the payback period.",expected:null,action:"context"},
 {id:"wrong-status",speech:"Show the audited 2025 Harbor School solar generation chart.",expected:null,action:"context"},
 {id:"ambiguous-year",speech:"Show the actual Harbor School solar generation chart.",expected:null,action:"hold"},
 {id:"keep",speech:"Keep this visual.",expected:null,action:"hold"},
];
