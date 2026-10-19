import {sourceDigest,type EvidenceAsset,type EvidenceIntent} from '../server/controllers/evidence-contract.js';
// Authored role-only screen. Complete coverage is declared; synthetic data are not external evidence.
const topics=[
 {id:'solar',entity:'solar-demo',subject:'solar output',unit:'Wh',values:'Morning 10, noon 20, evening 5',process:'Sunlight reaches a panel, cells convert light, a battery stores electricity'},
 {id:'water',entity:'water-demo',subject:'water use',unit:'litres',values:'Monday 10, Tuesday 20, Wednesday 5',process:'Rain enters a tank, a filter removes debris, a pump supplies water'},
 {id:'visitors',entity:'museum-demo',subject:'museum visits',unit:'visitors',values:'Morning 10, afternoon 20, evening 5',process:'Guests book a ticket, enter the gallery, and leave feedback'},
 {id:'seedlings',entity:'garden-demo',subject:'seedling growth',unit:'cm',values:'Week one 10, week two 20, week three 5',process:'A seed absorbs water, roots emerge, and leaves unfold'},
];
export function preferenceQualityFixture(){
 const groups=topics.map(t=>{
  const summary=`Synthetic ${t.subject} teaching example: ${t.values} ${t.unit}. ${t.process}. All views explain the same declared example.`;
  const variants=[
   {key:'trend',family:'chart',title:`${t.subject}: change over time`,text:`Line plot connects observations in time order, highlighting rises, falls and the peak. ${summary}`},
   {key:'comparison',family:'chart',title:`${t.subject}: compare categories`,text:`Bar plot places categories beside each other to compare magnitudes and identify the largest and smallest. ${summary}`},
   {key:'process',family:'diagram',title:`${t.subject}: how the process works`,text:`Flow diagram follows sequential stages with arrows and explains what happens before and after each step. ${summary}`},
   {key:'overview',family:'statement',title:`${t.subject}: main takeaway`,text:`One short sentence gives a simple high-level explanation for newcomers without detailed numbers or steps. ${summary}`},
   {key:'illustration',family:'image',title:`${t.subject}: visual setting`,text:`Illustrated scene shows the objects and setting so the audience can picture the situation rather than examine a graph. ${summary}`},
  ];
  const assets:EvidenceAsset[]=variants.map(v=>({id:`${t.id}-${v.key}`,title:v.title,text:v.text,entity:t.entity,year:2026,status:'illustrative',family:v.family as EvidenceAsset['family'],evidence:{version:1,approved:true,provenance:'illustrative',verification:'unknown',entity:t.entity,timeframe:null,unit:null,independentReview:'pending',sources:[{id:'synthetic',uri:'fixture://preference-quality-v1',sha256:sourceDigest(summary),summary}],claims:[{id:t.id,aliases:[t.subject],sourceIds:['synthetic']}]}}));
  const requests=[
   ['trend',`For ${t.subject}, help people see how the values rise and fall as time passes, especially where they peak.`],
   ['comparison',`For ${t.subject}, I want the audience to compare the sizes of the categories beside one another and spot the biggest.`],
   ['process',`For ${t.subject}, walk through what happens first, what follows, and how the final stage is reached.`],
   ['overview',`For ${t.subject}, introduce just the main idea in a short sentence so newcomers do not get lost in details.`],
   ['illustration',`For ${t.subject}, help the audience picture the objects in the scene and their surroundings.`],
   ['trend',`The point about ${t.subject} is the trajectory: it climbs, reaches a high point, then drops again.`],
   ['process',`With ${t.subject}, the audience needs the causal chain, from the starting input through to the final result.`],
   ['comparison',`The question about ${t.subject} is which category is greater, not the path through time.`],
  ];
  const intent:EvidenceIntent={mode:'present',reason:'declared-role-only-test',claims:[t.id],entities:[t.entity],years:[],family:null,provenance:'illustrative',audited:false,unit:null,unknown:[]};
  return {id:t.id,assets,intent,cases:requests.map(([key,speech],i)=>({id:`${t.id}-${i}`,speech,expected:`${t.id}-${key}`}))};
 });
 return {version:1,groups,passes:3,budgetMs:300,promotionGate:{minAccuracy:.9,minGainOverHybrid:.05,maxWarmP95Ms:150,maxFallbackRate:.01},scope:'32 authored preference requests, exact single expected asset, three rotated option orders. Role-only oracle intent; actual host interpretation measured separately. Development set, not independent acceptance.'};
}
