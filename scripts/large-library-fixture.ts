import type {LibraryAsset} from "../server/controllers/library-search.js";
const topics=[
 ["solar","Solar generation","Photovoltaic panels convert sunlight into electricity. Noon output exceeds morning and evening production.","MWh","Morning 14, noon 32, evening 7","Sunlight → panels → inverter"],
 ["storage","Battery storage","Batteries store surplus electricity and supply evening demand after sunset.","MWh","Charged 24, discharged 19, reserve 5","Surplus → battery → evening load"],
 ["cost","Installation expenditure","Capital expenditure covers equipment, installation labour and grid connection; operating expense is separate.","USD thousands","Equipment 80, labour 25, connection 15","Procurement → installation → connection"],
 ["reliability","Service reliability","Incidents reduce availability. Recovery procedures restore service while monitoring verifies health.","minutes","Detection 3, mitigation 8, recovery 14","Detect → mitigate → recover"],
 ["water","Water consumption","Irrigation demand changes seasonally. Meter readings distinguish delivered water from distribution losses.","kilolitres","Spring 42, summer 78, winter 31","Reservoir → distribution → meters"],
 ["learning","Learning assessment","Assessment separates evidence, reasoning and communication. A rubric supports formative feedback.","rubric points","Evidence 3, reasoning 4, communication 2","Attempt → feedback → revision"],
 ["queue","Queue processing","A bounded queue absorbs bursts while workers process requests. Backpressure limits overload.","requests per second","Ingress 90, processed 84, rejected 6","Producers → queue → workers"],
 ["emissions","Carbon emissions","Operational emissions depend on energy consumption and the electricity mix. Purchased offsets are accounted separately.","tonnes CO2e","Electricity 45, transport 18, heating 27","Activity → emission factor → inventory"],
] as const;
export function largeLibrary():LibraryAsset[]{return topics.flatMap(([topic,title,text,unit,data,process])=>["Harbor School","River Hospital","Cedar Campus"].flatMap(entity=>[2023,2024,2025].flatMap(year=>(["actual","illustrative"] as const).flatMap(status=>(["statement","chart","diagram"] as const).map(family=>({id:`${topic}/${entity}/${year}/${status}/${family}`,title:`${entity}: ${title}, ${year} (${status})`,text:`${text} ${family==="chart"?`Chart in ${unit}: ${data}.`:family==="diagram"?`Process: ${process}.`:"Overview of the topic."} Evidence scope: ${entity}, ${year}, ${status}. All assets are constructed benchmark material; actual is a simulated provenance label, not real institutional data.`,entity,year,status,family}))))));}
export const largeCases=[
 ...topics.map(([topic,title])=>({id:`positive-${topic}`,speech:`Show the actual 2025 Harbor School ${title.toLowerCase()} chart and its measured breakdown.`,expected:`${topic}/Harbor School/2025/actual/chart`,action:"show"})),
 {id:"paraphrase-storage",speech:"For Harbor School in 2024, show the actual diagram explaining how surplus electricity is saved for after sunset.",expected:"storage/Harbor School/2024/actual/diagram",action:"show"},
 {id:"illustrative",speech:"Use the illustrative 2023 Cedar Campus water consumption chart.",expected:"water/Cedar Campus/2023/illustrative/chart",action:"show"},
 {id:"missing-year",speech:"Show actual 2026 Harbor School installation expenditure figures.",expected:null,action:"context"},
 {id:"missing-entity",speech:"Show actual 2025 Mountain Academy installation expenditure figures.",expected:null,action:"context"},
 {id:"missing-fact",speech:"What was the actual 2025 Harbor School battery manufacturer's warranty duration?",expected:null,action:"context"},
 {id:"negation",speech:"Do not show a chart. I am only checking whether the microphone is working.",expected:null,action:"hold"},
 {id:"correction",speech:"Instead of Harbor School show the actual 2024 River Hospital carbon emissions chart.",expected:"emissions/River Hospital/2024/actual/chart",action:"show"},
 {id:"missing-private",speech:"Show the actual 2025 Cedar Campus patient names and medical diagnoses.",expected:null,action:"context"},
];
