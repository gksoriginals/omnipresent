import {sourceDigest,type EvidenceAsset} from "../server/controllers/evidence-contract.js";
import {largeLibrary} from "./large-library-fixture.js";
export function contractedLibrary():EvidenceAsset[]{return largeLibrary().map(a=>{
 const topic=a.id.split('/')[0],title=a.title.slice(a.entity.length+2).replace(/, 20\d\d \((actual|illustrative)\)$/u,"");
 const aliases=[title,...topic==="storage"?["battery","surplus electricity is saved for after sunset","store surplus electricity"]:[]];
 return {...a,evidence:{version:1,approved:true,provenance:a.status==="actual"?"source-backed":"illustrative",verification:"unknown",entity:a.entity,timeframe:String(a.year),unit:a.family==="chart"?a.text.match(/Chart in ([^:]+):/)?.[1]??null:null,sources:[{id:"fixture",uri:"fixture://large-library-v1",sha256:sourceDigest(a.text),summary:a.text}],claims:[{id:topic,aliases,sourceIds:["fixture"]}],independentReview:"pending"}};
});}
