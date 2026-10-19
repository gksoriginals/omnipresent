import { mkdir,writeFile } from "node:fs/promises";
import { PreparationController } from "../server/agents/preparation.js";
import { localModel } from "../server/agents/model.js";
import { emptyPreparation } from "../shared/preparation.js";
const events:Record<string,unknown>[]=[];
const agent=new PreparationController(emptyPreparation(),e=>{events.push(e);if(e.type==="agent_error")console.error(e);},localModel);
agent.artifact("solar-facts.csv","Time,EnergyWh\nMorning,10\nNoon,20\nEvening,5\n\nSynthetic teaching example, not measured performance. Panels convert sunlight into electricity. Batteries store electricity for use after sunset. Process: Sun, Panels, Battery.");
await agent.turn("interview","I am teaching solar energy to teachers for five minutes. Explain panels, the daily energy pattern, and battery storage. Use the uploaded synthetic example; no invented measurements. We have all the context. Call updateBrief with these points now and briefly confirm.");
if(!agent.state.brief)throw Error("Interview did not produce brief");
await agent.turn("storyteller","Read the uploaded material. Call createDiagram with Sun → Panels → Battery and createChart for Morning 10, Noon 20, Evening 5 Wh, labelled synthetic teaching data, linked to the uploaded artifact. Then proposeFlow with exactly three beats: How panels work (linked to the diagram); Daily energy pattern (linked to the chart); Storage after sunset (linked to the diagram). Provide concise audienceText on each beat and use the returned visual IDs. End with a short confirmation.");
if(!agent.state.flow || (agent.state.visuals?.length??0)<2)throw Error("Story generation did not prepare both visuals");
agent.approve();
const variants=[
 {id:"generation-first",title:"Generation → pattern → storage",paragraphs:[
 "Solar panels turn sunlight into electricity. First, sunlight reaches the panels. Let us focus on the panels converting that light into electrical energy.",
 "The daily energy pattern changes. Our synthetic teaching example produces ten watt hours in the morning, twenty at noon, and five in the evening. Noon is the highest point on this chart.",
 "Now connect generation and storage. Panels make electricity while sunlight is available, and a battery stores it for later. Show the relationship between the panels and storage together.",
 "After sunset there is no sunlight. The battery supplies energy stored earlier. Let us focus on storage after sunset."
 ]},
 {id:"storage-first",title:"Storage first, then comparison",paragraphs:[
 "Imagine it is after sunset. We still need electricity. Start with the battery: storage makes energy available when sunlight is gone.",
 "Where did the stored electricity come from? Compare the panels generating electricity with the battery saving it. These are connected but different jobs.",
 "Look at the daily energy chart. The synthetic example has twenty watt hours at noon, ten in the morning, and five in the evening. Noon is highest.",
 "Return to the process diagram. Start with the sun alone, then reveal the panels. Finally connect the panels to the battery, showing the full process."
 ]},
 {id:"detour-and-return",title:"Elaboration, detour and return",paragraphs:[
 "Look at the daily energy pattern. Noon is the highest point in our synthetic example, followed by morning, and then evening.",
 "Keep that chart in view while I explain. These numbers are a teaching example, not measurements from a real installation.",
 "My favourite lunch is pasta with tomatoes. I left my notebook in the kitchen. Anyway, let us return to the presentation.",
 "We can explain the whole relationship now. Put the daily energy pattern beside the storage explanation. Solar electricity is produced during daylight, while batteries make it available after sunset."
 ]}
];
await mkdir("output/adaptive-trial",{recursive:true});
await writeFile("output/adaptive-trial/manifest.json",JSON.stringify({createdAt:new Date().toISOString(),scope:"Actual local-model interview and storyteller; narrated replays use Piper TTS, never transcript injection",state:agent.state,preparationEvents:events,variants:variants.map(v=>({...v,audio:`/api/trial/${v.id}.wav`}))},null,2));
console.log("Prepared interview, story and 3 narrative variants.");
