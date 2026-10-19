import { z } from "zod";
import { emptyPreparation, preparationSchema, type Preparation } from "./preparation.js";
export const WORKSPACE_KEY = "omnipresent-workspace-v1";
const projectSchema = z.object({
  id: z.string().min(1), title: z.string().max(160), createdAt: z.number(), updatedAt: z.number(),
  state: preparationSchema, composer: z.string().max(6000),
});
const storySchema = z.object({ id: z.string().min(1), projectId: z.string().min(1), savedAt: z.number(), state: preparationSchema });
const workspaceSchema = z.object({ version: z.literal(1), activeProjectId: z.string(), projects: z.array(projectSchema).min(1), stories: z.array(storySchema), storyHistory: z.array(storySchema).optional(), removedStories: z.array(storySchema).optional(), removedProjects: z.array(projectSchema).optional() });
export type Project = z.infer<typeof projectSchema>;
export type SavedStory = z.infer<typeof storySchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function newProject(id: string = crypto.randomUUID(), now = Date.now()): Project {
  return { id, title: "New presentation", createdAt: now, updatedAt: now, state: emptyPreparation(), composer: "" };
}
export function projectTitle(state: Preparation): string {
  return (state.brief?.topic || state.flow?.title || state.messages.interview.find(m => m.role === "user")?.content || "").replace(/\s+/g," ").slice(0,80);
}
function parse(raw: string | null): unknown { try { return JSON.parse(raw ?? "null"); } catch { return null; } }
export function readWorkspace(storage: StorageLike): Workspace {
  const stored = storage.getItem(WORKSPACE_KEY);
  if (stored) {
    const result = workspaceSchema.safeParse(parse(stored));
    if (!result.success) throw Error("Saved projects could not be read. Browser data has been preserved; do not clear storage.");
    const workspace = result.data;
    if (!workspace.projects.some(p => p.id === workspace.activeProjectId)) workspace.activeProjectId = workspace.projects[0].id;
    const compatible=(story:SavedStory)=>story.state.flow?.beats.every(b=>b.evidence?.approved);
    workspace.stories=workspace.stories.filter(compatible);
    workspace.storyHistory=workspace.storyHistory?.filter(compatible);
    workspace.removedStories=workspace.removedStories?.filter(compatible);
    for(const project of [...workspace.projects,...workspace.removedProjects??[]])if(project.state.flow?.beats.some(b=>!b.evidence)){
      project.state.flow=null;project.state.flowBasedOnRevision=null;project.state.approvedRevision=null;
    }
    storage.setItem(WORKSPACE_KEY,JSON.stringify(workspace));
    return consolidateStories(workspace);
  }
  const project=newProject();
  return {version:1,activeProjectId:project.id,projects:[project],stories:[]};
}

export function updateProject(workspace: Workspace, projectId: string, state: Preparation, now = Date.now()): Workspace {
  return {...workspace, projects:workspace.projects.map(p => {
    if (p.id !== projectId) return p;
    const nextState = structuredClone(state);
    const pendingFeedback = p.state.events.filter(e => e.from === "realtime" && !nextState.events.some(next => next.id === e.id));
    nextState.events = [...nextState.events, ...pendingFeedback].slice(-60);
    return {...p,state:nextState,title:projectTitle(state) || p.title,updatedAt:now};
  })};
}
export function saveStory(workspace: Workspace, projectId: string, state: Preparation, id: string = crypto.randomUUID(), now = Date.now()): Workspace {
  if (!workspace.projects.some(p => p.id === projectId)) throw Error("Project no longer exists");
  if (!state.flow || state.approvedRevision !== state.revision || state.flowBasedOnRevision === null) throw Error("Review the current story before saving");
  if(state.flow.beats.some(b=>!b.evidence?.approved||Object.values(b.componentEvidence??{}).some(c=>c&&!c.evidence.approved)))throw Error("Review evidence before saving the story");
  const current = consolidateStories(workspace);
  const existing = current.stories.find(s => s.projectId === projectId);
  const changed = existing && JSON.stringify(existing.state) !== JSON.stringify(state);
  return {...current,
    storyHistory: changed ? [...(current.storyHistory ?? []), existing] : current.storyHistory,
    stories:[...current.stories.filter(s => s.projectId !== projectId),{id:existing?.id ?? id,projectId,savedAt:now,state:structuredClone(state)}]};
}
export function addPresentationFeedback(workspace: Workspace, projectId: string, question: string): Workspace {
  if (!question.trim() || question.length > 2000) return workspace;
  return {...workspace, projects:workspace.projects.map(p => {
    if (p.id !== projectId || p.state.events.some(e=>e.from === "realtime" && e.summary === question)) return p;
    return {...p, state:{...p.state,events:[...p.state.events.slice(-59),{id:crypto.randomUUID(),from:"realtime" as const,to:"interview" as const,kind:"context.requested" as const,revision:p.state.revision,summary:question}]}};
  })};
}

// One current story per project; retain every older snapshot outside the gallery.
function consolidateStories(workspace: Workspace): Workspace {
  const latest = new Map<string, SavedStory>();
  const history = [...(workspace.storyHistory ?? [])];
  for (const story of workspace.stories) {
    const previous = latest.get(story.projectId);
    if (!previous) latest.set(story.projectId, story);
    else if (story.savedAt >= previous.savedAt) { history.push(previous); latest.set(story.projectId, story); }
    else history.push(story);
  }
  return {...workspace, stories:[...latest.values()], storyHistory:history};
}
export function removeStory(workspace: Workspace, id: string): Workspace {
  const story = workspace.stories.find(s => s.id === id);
  return story ? {...workspace, stories:workspace.stories.filter(s => s.id !== id), removedStories:[...(workspace.removedStories ?? []), story]} : workspace;
}
export function removeProject(workspace: Workspace, id: string): Workspace {
  const project = workspace.projects.find(p => p.id === id);
  if (!project) return workspace;
  const projects = workspace.projects.filter(p => p.id !== id);
  if (!projects.length) projects.push(newProject());
  return {...workspace, projects, activeProjectId:workspace.activeProjectId === id ? projects[0].id : workspace.activeProjectId,
    removedProjects:[...(workspace.removedProjects ?? []),project]};
}
export function restoreRemoved(workspace: Workspace, kind: "story" | "project", id: string): Workspace {
  if (kind === "project") {
    const project = workspace.removedProjects?.find(p => p.id === id);
    return project ? {...workspace, projects:[...workspace.projects,project], removedProjects:workspace.removedProjects!.filter(p => p.id !== id)} : workspace;
  }
  const story = workspace.removedStories?.find(s => s.id === id);
  // Restoring makes this snapshot current and preserves any replacement in history.
  return story ? {...workspace,
    stories:[...workspace.stories.filter(s => s.projectId !== story.projectId),story],
    storyHistory:workspace.stories.some(s => s.projectId === story.projectId) ? [...(workspace.storyHistory ?? []),...workspace.stories.filter(s => s.projectId === story.projectId)] : workspace.storyHistory,
    removedStories:workspace.removedStories!.filter(s => s.id !== id)} : workspace;
}
