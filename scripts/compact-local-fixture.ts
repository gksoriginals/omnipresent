import {sourceDigest,type EvidenceAsset} from '../server/controllers/evidence-contract.js';
export type LocalCase={id:string;story:string;speech:string;expected:string;category:'positive'|'hold'|'missing';slice:string};
const specifications={
 solar:[['panels','Solar conversion','Photovoltaic cells convert sunlight into electricity.','statement',null,null],['storage','Battery storage','Batteries store surplus electricity for use after sunset.','statement',null,null],['curve','Generation curve','Illustrative daily output: morning 10, noon 20, evening 5 Wh.','chart','2025','Wh']],
 water:[['evaporation','Evaporation','Liquid water changes to water vapor.','diagram',null,null],['condensation','Condensation','Water vapor cools and forms liquid droplets.','diagram',null,null],['rainfall','Rainfall totals','Illustrative rainfall: May 20 and June 40 mm.','chart','2025','mm']],
 energy:[['north25','North demand 2025','Illustrative North energy demand is 40 kWh.','chart','2025','kWh'],['north24','North demand 2024','Illustrative North energy demand is 30 kWh.','chart','2024','kWh'],['south25','South demand 2025','Illustrative South energy demand is 90 kWh.','chart','2025','kWh']],
} as const;
export function compactAssets(){return Object.fromEntries(Object.entries(specifications).map(([story,specs])=>[story,specs.map(([id,title,text,family,timeframe,unit]):EvidenceAsset=>({id,title,text,family,entity:story==='energy'?id.startsWith('north')?'North':'South':story,year:timeframe?Number(timeframe):2026,status:'illustrative',evidence:{version:1,approved:true,entity:story==='energy'?id.startsWith('north')?'North':'South':story,timeframe,unit,provenance:'illustrative',verification:'unknown',independentReview:'pending',sources:[{id:`source-${id}`,uri:`fixture://${id}`,summary:text,sha256:sourceDigest(text)}],claims:[{id,aliases:[title,text],sourceIds:[`source-${id}`]}]}}))]));}
export const localCases:LocalCase[]=[
 ...[
 ['s1','solar','Photovoltaic cells convert sunlight into electricity.','panels','exact'],['s2','solar','Explain how sunshine becomes electrical power.','panels','paraphrase'],['s3','solar','Batteries store surplus electricity for use after sunset.','storage','exact'],['s4','solar','What keeps our lights powered after sundown?','storage','paraphrase'],['s5','solar','Show the illustrative generation curve for 2025 in Wh.','curve','scope'],['s6','solar','Instead of battery storage, explain solar conversion.','panels','correction'],
 ['w1','water','Liquid water changes to water vapor.','evaporation','exact'],['w2','water','Now explain how water vapor becomes liquid droplets.','condensation','paraphrase'],['w3','water','Show illustrative rainfall totals for 2025 in mm.','rainfall','scope'],
 ['e1','energy','Show illustrative North demand 2025 in kWh.','north25','date'],['e2','energy','Use illustrative North demand 2024 in kWh.','north24','date'],['e3','energy','Instead of North, show illustrative South demand 2025 in kWh.','south25','correction'],
 ].map(([id,story,speech,expected,slice])=>({id,story,speech,expected,slice,category:'positive' as const})),
 ...[
 ['h1','solar','Checking the microphone.','incidental'],['h2','water','Keep the current visual.','retention'],['h3','solar','Do not show battery storage.','negation'],['h4','water','Someone said "show evaporation", but that is only a quotation.','quotation'],['h5','solar','Suppose we showed battery storage; I am not asking you to show it now.','hypothetical'],['h6','energy','Show that one again.','ambiguous'],
 ].map(([id,story,speech,slice])=>({id,story,speech,expected:'hold',slice,category:'hold' as const})),
 ...[
 ['m1','solar','What is the installation cost in dollars?','missing-claim'],['m2','solar','Show audited battery lifetime measurements.','audit'],['m3','water','Show rainfall totals for 2024.','date'],['m4','energy','Show West demand 2025 in kWh.','entity'],['m5','energy','Show actual North demand 2025 in kWh.','provenance'],['m6','solar','Explain solar conversion and its installation cost.','extra-obligation'],
 ].map(([id,story,speech,slice])=>({id,story,speech,expected:'context',slice,category:'missing' as const})),
];
export const precisionScreen={minPositiveAccuracy:.8,minNegativeAccuracy:.75,minOverallAccuracy:.8,note:'Gate for further precision experiments only; not production acceptance. No thresholds are tuned from model results.'};
