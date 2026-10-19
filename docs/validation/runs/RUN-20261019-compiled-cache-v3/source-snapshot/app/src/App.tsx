import {Icon} from "./Icon";
import React, { useEffect, useRef, useState } from "react";
import { Preparation } from "./Preparation";
import { StoryLibrary } from "./StoryLibrary";
import { newProject, updateProject, saveStory, addPresentationFeedback, removeProject, removeStory, restoreRemoved, type Workspace } from "../../shared/workspace";
import {PresentationRoom} from "./PresentationRoom";
import {WorkspaceStore} from "./services/workspace-store";
import {SessionClient} from "./services/session-client";
import {usePresentation} from "./hooks/usePresentation";

export default function App() {
  const [sidebarVisible, setSidebarVisible] = useState(() => { try { return localStorage.getItem("omnipresent-sidebar-hidden") !== "true"; } catch { return true; } });
  const [mode, setMode] = useState<"prepare" | "canvas">("prepare");
  const [store] = useState(() => new WorkspaceStore(()=>localStorage));
  const [workspace,setWorkspace]=useState(store.current);
  const workspaceRef=store;
  const project = workspace.projects.find(p => p.id === workspace.activeProjectId)!;
  const preparation = project.state, stories = workspace.stories;
  const [showRemoved, setShowRemoved] = useState(false);
  const [undo, setUndo] = useState<{kind:"story"|"project";id:string;label:string}|null>(null);
  const [selected, setSelected] = useState("");
  const selectedStory = stories.find(s => s.id === selected);
  function commit(next:Workspace){const result=store.commit(next);setWorkspace(next);if(result.error)setError(result.error);return result.persisted;}
  function activateProject(id: string) {
    if (id === workspaceRef.current.activeProjectId) { setMode("prepare"); return; }
    endPresentation(); pendingSave.current = null;
    socket.current?.close(); socket.current = null;
    setBusy(false); setResponse(""); setActivity(""); setNotice(""); setConnected(false);
    commit({...workspaceRef.current, activeProjectId:id}); setMode("prepare");
  }
  function removeItem(kind: "story" | "project", id: string) {
    const current = workspaceRef.current;
    const label = kind === "project" ? current.projects.find(p => p.id === id)?.title : current.stories.find(s => s.id === id)?.state.flow?.title;
    if (!label) return;
    if (kind === "project" && id === current.activeProjectId) {
      endPresentation(); pendingSave.current = null;
      socket.current?.close(); socket.current = null;
      setBusy(false); setResponse(""); setActivity(""); setConnected(false);
    }
    commit(kind === "project" ? removeProject(current,id) : removeStory(current,id));
    setUndo({kind,id,label});
  }
  function restoreItem(kind: "story" | "project", id: string) {
    commit(restoreRemoved(workspaceRef.current,kind,id)); setUndo(null);
  }
  function createProject() {
    const next = newProject();
    next.title = `New presentation ${workspaceRef.current.projects.length + 1}`;
    // Commit the new project before activation; existing project snapshots are retained.
    commit({...workspaceRef.current, projects:[...workspaceRef.current.projects,next]});
    activateProject(next.id);
  }
  const [connected, setConnected] = useState(false), [busy, setBusy] = useState(false);
  const [response, setResponse] = useState(""), [activity, setActivity] = useState("");
  const [error, setError] = useState(store.error), [notice, setNotice] = useState("");
  const socket=useRef<SessionClient|null>(null),pendingSave=useRef<string|null>(null);
  const presentation=usePresentation(socket,setError);
  const {stage,active,starting,paused,endPresentation}=presentation;
  const presentationRef=useRef(presentation);presentationRef.current=presentation;
  const send=(event:Record<string,unknown>)=>socket.current?.send(event);
  useEffect(() => {
    const projectId = workspace.activeProjectId;
    const client=new SessionClient(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/session`,{
      open(){setConnected(true);send({type:"preparation_open",state:workspaceRef.current.projects.find(p=>p.id===projectId)!.state});},
      event(event){
        presentationRef.current.event(event);
        if (event.type === "preparation") {
          const state = event.state;
          setResponse("");
          let next = updateProject(workspaceRef.current, projectId, state);
          let storySaved = false;
          if (pendingSave.current === projectId && state.flow && state.approvedRevision === state.revision) {
            pendingSave.current = null;
            next = saveStory(next,projectId,state);
            storySaved = true;
          }
          const persisted = commit(next);
          if (storySaved) setNotice(persisted ? "Story saved. Open Canvas when you’re ready." : "Story kept in this tab. Browser saving failed.");
        }
        if (event.type === "presentation_feedback" && typeof event.projectId === "string" && typeof event.question === "string") {
          commit(addPresentationFeedback(workspaceRef.current,event.projectId,event.question));
        }
        if (event.type === "agent_status") { setBusy(event.status === "working"); if (event.status === "working") { setResponse(""); setActivity(""); setNotice(""); } }
        if (event.type === "agent_activity") setActivity(event.label);
        if (event.type === "agent_delta") setResponse(event.text);
        if (event.type === "error" || event.type === "worker_error" || event.type === "agent_error") {
          setError(event.message); pendingSave.current = null;
          if (event.type === "agent_error") { setBusy(false); setResponse(""); }
          else { presentationRef.current.endPresentation(); }
        }
      },
      close(){setConnected(false);setBusy(false);setResponse("");presentationRef.current.disconnected();},
      error(message){setError(message);}
    });
    socket.current=client;client.connect();
    return ()=>{presentationRef.current.stopCapture();client.close();if(socket.current===client)socket.current=null;};
  }, [workspace.activeProjectId]);
  return <main>
    <a className="skip-link" href="#workspace">Skip to workspace</a>
    <header className={active ? "presenting-header" : ""}>
      {mode === "prepare" && <button className="sidebar-toggle" aria-label={sidebarVisible ? "Hide sessions sidebar" : "Show sessions sidebar"} aria-expanded={sidebarVisible} aria-controls="project-sessions mobile-project-sessions" title={sidebarVisible ? "Hide sessions" : "Show sessions"} onClick={() => { setSidebarVisible(!sidebarVisible); try { localStorage.setItem("omnipresent-sidebar-hidden",String(sidebarVisible)); } catch {} }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg></button>}
      <a href="/" className="wordmark">Omnipresent</a>
      <nav aria-label="Workspace"><button aria-current={mode === "prepare" ? "page" : undefined} onClick={() => { endPresentation(); send({type:"preparation_open",state:workspaceRef.current.projects.find(p=>p.id === workspaceRef.current.activeProjectId)!.state}); setMode("prepare"); }}>Prepare</button><button aria-current={mode === "canvas" ? "page" : undefined} onClick={() => { endPresentation(); setSelected(""); setMode("canvas"); }}>Canvas</button></nav>
      <div className="header-context">{mode === "prepare" ? project.title : selectedStory?.state.flow?.title ?? "Your stories"}</div>
      {!active && <button className="removed-toggle icon-button" title="Removed items" aria-label="Removed items" onClick={() => setShowRemoved(!showRemoved)}><Icon name="archive"/></button>}
      {active && <div className="presentation-controls"><button onClick={() => send({type: "pause", value: !paused})}>{paused ? "Resume" : "Pause"}</button><button onClick={endPresentation}>End</button></div>}
      {!connected && <span className="connection" role="status">Reconnecting…</span>}
    </header>
    {error && <div className="error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError("")}>×</button></div>}
    {notice && mode === "prepare" && <p className="notice" role="status">{notice}</p>}
    {undo && <div className="removal-notice" role="status"><span>Removed {undo.label}</span><button onClick={() => restoreItem(undo.kind,undo.id)}>Undo</button><button aria-label="Dismiss removal notice" onClick={() => setUndo(null)}>×</button></div>}
    {showRemoved && <section className="removed-items" aria-label="Removed items"><div><h2>Removed items</h2><button onClick={() => setShowRemoved(false)}>Close</button></div><p>Removing a session keeps its saved story. Removed items remain available here.</p>
      {!(workspace.removedProjects?.length || workspace.removedStories?.length) && <p>No removed items.</p>}
      {workspace.removedProjects?.map(p => <div key={p.id}><span>Session: {p.title}</span><button onClick={() => restoreItem("project",p.id)}>Restore session {p.title}</button></div>)}
      {workspace.removedStories?.map(s => <div key={s.id}><span>Story: {s.state.flow?.title}</span><button onClick={() => restoreItem("story",s.id)}>Restore story {s.state.flow?.title}</button></div>)}
    </section>}
    <div id="workspace" className={mode === "prepare" ? "workspace-prepare" : "workspace-canvas"}>
      {mode === "prepare" ? <div className={`prepare-workspace ${sidebarVisible ? "" : "sessions-hidden"}`}>
        <aside id="project-sessions" className="project-list" aria-label="Preparation projects">
          <div className="projects-heading"><h2>Sessions</h2><button onClick={createProject} aria-label="New project" title="New project"><Icon name="plus"/></button></div>
          <nav aria-label="Project chats">{[...workspace.projects].sort((a,b) => b.updatedAt-a.updatedAt).map(p => <div className="project-row" key={p.id}><button aria-current={p.id === project.id ? "page" : undefined} onClick={() => activateProject(p.id)} title={p.title}>{p.title}</button><button className="session-remove" aria-label={`Remove session ${p.title}`} title="Remove session" onClick={() => removeItem("project",p.id)}><Icon name="trash"/></button></div>)}</nav>
        </aside>
        <div className="prepare-body">
          <div id="mobile-project-sessions" className="mobile-projects"><label className="sr-only" htmlFor="project-select">Project</label><select id="project-select" value={project.id} onChange={e => activateProject(e.target.value)}>{workspace.projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><button onClick={createProject}>New project</button><button aria-label={`Remove session ${project.title}`} onClick={() => removeItem("project",project.id)}>×</button></div>
          <Preparation key={project.id} send={event => { if (workspaceRef.current.activeProjectId === project.id) send(event); }} state={preparation} busy={busy} response={response} activity={activity} connected={connected} input={project.composer} onInput={value => commit({...workspaceRef.current,projects:workspaceRef.current.projects.map(p=>p.id === project.id ? {...p,composer:value} : p)})} onSave={() => { pendingSave.current = project.id; send({type: "flow_approve"}); }} />
        </div>
      </div> : !selectedStory ? <StoryLibrary stories={stories} projects={[...workspace.projects,...(workspace.removedProjects ?? [])]} onRemove={id => removeItem("story",id)} onSelect={setSelected} onCreate={createProject} /> :
        <PresentationRoom selectedStory={selectedStory} active={active} stage={stage} paused={paused} starting={starting} connected={connected} endPresentation={endPresentation} onBack={()=>setSelected("")} onStart={()=>void presentation.startPresentation(selectedStory,connected)}/>}
    </div>
  </main>;
}
