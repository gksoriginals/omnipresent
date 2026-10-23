import {approvePreparedEvidence} from "../server/presentation/component-evidence.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import {prepareEvidence} from "../server/presentation/prepare-evidence.js";
import { emptyPreparation } from "../shared/preparation.js";
import { removeStory, removeProject, restoreRemoved, addPresentationFeedback, readWorkspace, WORKSPACE_KEY, newProject, updateProject, saveStory, type Workspace } from "../shared/workspace.js";
function storage() { const data = new Map<string,string>(); return {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}}; }
function reviewed() {
 const state = emptyPreparation(); state.flow = {title:"Solar story",summary:"Summary",openQuestions:[],beats:[{title:"Sunlight",audienceText:"Energy",speakerNotes:"Private",visualDirection:"Statement",artifactIds:[]}]};
 state.flow=prepareEvidence(state.flow,state);approvePreparedEvidence(state.flow,state);
 state.flowBasedOnRevision = 0; state.approvedRevision = 0; return state;
}
test("legacy stories are not imported into the evidence baseline",()=>{
 const s=storage();s.setItem("omnipresent-preparation",JSON.stringify(reviewed()));s.setItem("omnipresent-stories",JSON.stringify([{id:"old",state:reviewed()}]));
 const result=readWorkspace(s);assert.equal(result.stories.length,0);assert.equal(result.projects[0].state.flow,null);
});
test("incompatible saved stories are removed rather than migrated",()=>{
 const s=storage(),p=newProject("p");const state=reviewed();delete state.flow!.beats[0].evidence;p.state=state;
 s.setItem(WORKSPACE_KEY,JSON.stringify({version:1,activeProjectId:p.id,projects:[p],stories:[{id:"old",projectId:p.id,savedAt:1,state}]}));
 const restored=readWorkspace(s);assert.equal(restored.stories.length,0);assert.equal(restored.projects[0].state.flow,null);
});
test("project chats, materials and composer drafts remain isolated across serialization", () => {
 const a = newProject("a"), b = newProject("b"); a.composer = "Unsent solar question"; b.composer="Unsent second question";
 const workspace: Workspace = {version:1,activeProjectId:"b",projects:[a,b],stories:[]};
 const state = emptyPreparation(); state.messages.interview.push({role:"user",content:"Solar energy"}); state.artifacts.push({id:crypto.randomUUID(),name:"notes.txt",content:"Only A"});
 const next = updateProject(workspace,"a",state);
 const s = storage(); s.setItem(WORKSPACE_KEY,JSON.stringify(next)); const restored = readWorkspace(s);
 assert.equal(restored.activeProjectId,"b"); assert.equal(restored.projects[0].title,"Solar energy");
 assert.equal(restored.projects[1].state.artifacts.length,0); assert.equal(restored.projects[1].state.messages.interview.length,0);
 assert.equal(restored.projects[0].composer,"Unsent solar question"); assert.equal(workspace.projects[0].state.artifacts.length,0);
});
test("interrupted preparation requests survive workspace validation and reload", () => {
 const p=newProject("resume-project");
 p.pendingPreparation={kind:"message",text:"Explain the audience and goal",role:"interview",status:"interrupted",baseRevision:2,startedAt:123};
 const s=storage();s.setItem(WORKSPACE_KEY,JSON.stringify({version:1,activeProjectId:p.id,projects:[p],stories:[]}));
 const restored=readWorkspace(s);
 assert.deepEqual(restored.projects[0].pendingPreparation,p.pendingPreparation);
});
test("repeated identical saves update one immutable project-linked snapshot", () => {
 let w = readWorkspace(storage()); const id = w.activeProjectId, state = reviewed();
 for(let i=0;i<15;i++) w=saveStory(w,id,state,`story-${i}`);
 state.flow!.title="Changed draft";
 assert.equal(w.stories.length,1); assert.equal(w.stories[0].id,"story-0"); assert.equal(w.storyHistory?.length,0); assert.equal(w.stories[0].state.flow?.title,"Solar story");
 assert.equal(w.stories[0].projectId,id);
 assert.throws(()=>saveStory(w,"missing",reviewed()));
 assert.throws(()=>saveStory(w,id,emptyPreparation()));
});
test("unreadable project data is preserved instead of replaced by an empty workspace", () => {
 const s = storage(); s.setItem(WORKSPACE_KEY,"broken");
 assert.throws(()=>readWorkspace(s),/preserved/); assert.equal(s.getItem(WORKSPACE_KEY),"broken");
});

test("presentation context requests return only to the originating project", () => {
 const a=newProject("a"), b=newProject("b");
 const w: Workspace={version:1,activeProjectId:"b",projects:[a,b],stories:[]};
 const next=addPresentationFeedback(w,"a","Which ocean example should I use?");
 assert.equal(next.projects[0].state.events[0].to,"interview");
 assert.equal(next.projects[1].state.events.length,0);
 assert.equal(updateProject(next,"a",emptyPreparation()).projects[0].state.events.length,1);
 assert.equal(addPresentationFeedback(next,"a","Which ocean example should I use?").projects[0].state.events.length,1);
});

test("saving updates a stable story id and retains changed snapshots", () => {
 let w=readWorkspace(storage()); const id=w.activeProjectId;
 const state=reviewed(); w=saveStory(w,id,state,"first",1);
 state.flow!.title="Revised story"; w=saveStory(w,id,state,"second",2);
 assert.equal(w.stories.length,1); assert.equal(w.stories[0].id,"first");
 assert.equal(w.stories[0].state.flow?.title,"Revised story");
 assert.equal(w.storyHistory?.[0].state.flow?.title,"Solar story");
 const other=newProject("other"); w={...w,projects:[...w.projects,other]};
 w=saveStory(w,other.id,state,"third",3); assert.equal(w.stories.length,2);
});
test("story removal preserves chat and can be restored after reload", () => {
 let w=readWorkspace(storage()); w=saveStory(w,w.activeProjectId,reviewed(),"story");
 w=removeStory(w,"story"); assert.equal(w.stories.length,0); assert.equal(w.projects.length,1);
 const s=storage(); s.setItem(WORKSPACE_KEY,JSON.stringify(w)); w=readWorkspace(s);
 w=restoreRemoved(w,"story","story"); assert.equal(w.stories.length,1); assert.equal(w.removedStories?.length,0);
});
test("removing active and last sessions preserves stories and valid active project", () => {
 let w=readWorkspace(storage()); const id=w.activeProjectId;
 w.projects[0].composer="Keep draft"; w=saveStory(w,id,reviewed(),"story");
 w=removeProject(w,id); assert.equal(w.projects.length,1); assert.notEqual(w.activeProjectId,id);
 assert.equal(w.stories.length,1); assert.equal(w.removedProjects?.[0].composer,"Keep draft");
 w=restoreRemoved(w,"project",id); assert.equal(w.projects.find(p=>p.id===id)?.composer,"Keep draft");
 assert.equal(removeProject(w,"missing"),w);
});
test("restoring a removed story preserves its replacement in history", () => {
 let w=readWorkspace(storage()); const id=w.activeProjectId;
 w=saveStory(w,id,reviewed(),"old"); w=removeStory(w,"old");
 w=saveStory(w,id,reviewed(),"replacement"); w=restoreRemoved(w,"story","old");
 assert.equal(w.stories.length,1); assert.equal(w.stories[0].id,"old");
 assert.equal(w.storyHistory?.[0].id,"replacement");
});
