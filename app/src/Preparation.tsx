import {Icon} from "./Icon";
import {MessageText} from "./MessageText";
import { useEffect, useRef, useState } from "react";
import type { Preparation as State, AgentRole } from "../../shared/preparation";
import { Visual } from "./Visual";
type Props = { send: (e: Record<string, unknown>) => void; state: State; busy: boolean; activity: string; connected: boolean; input: string; onInput: (value: string) => void; onSave: () => void };
export function Preparation({ send, state, busy, activity, connected, input, onInput: setInput, onSave }: Props) {
  const [uploading, setUploading] = useState(false), [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const role: AgentRole = state.flow ? "storyteller" : "interview";
  const messages = [...state.messages.interview, ...state.messages.storyteller];
  const pendingInput = useRef("");
  const conversation=useRef<HTMLDivElement>(null),followConversation=useRef(true);
  useEffect(()=>{if(conversation.current&&followConversation.current)conversation.current.scrollTop=conversation.current.scrollHeight;},[messages.length,busy,activity]);
  const uploads = useRef<AbortController | null>(null);
  useEffect(() => () => uploads.current?.abort(), []);
  useEffect(() => {
    if (messages.some(m => m.role === "user" && m.content === pendingInput.current) && input === pendingInput.current) setInput("");
  }, [state.messages]);
  async function upload(files: FileList | null) {
    if (!files) return;
    setError(""); setUploading(true);
    const controller = new AbortController(); uploads.current = controller;
    try {
      for (const item of Array.from(files)) {
        if (item.size > 8_000_000) throw Error("Choose files smaller than 8 MB each.");
        const result = await fetch("/api/materials", { method: "POST", headers: { "X-File-Name": encodeURIComponent(item.name) }, body: item, signal: controller.signal });
        controller.signal.throwIfAborted();
        const material = await result.json();
        if (!result.ok) throw Error(material.error);
        send({ type: "artifact_add", ...material });
        if (material.truncated) setError(`${item.name}: only the first 24,000 characters were extracted. Split the source for complete coverage.`);
      }
    } catch (e) { if (controller.signal.aborted) return; setError(e instanceof Error ? e.message : "Could not attach material."); }
    finally { setUploading(false); }
  }
  return <div className={`preparation ${state.flow ? "with-story" : ""}`}>
    <div className="conversation-heading"><div><h2>{state.flow ? "Refine your story" : "Prepare your presentation"}</h2><p>{state.flow ? "Make changes through the conversation." : "A conversation to shape what comes next."}</p></div><span className="agent-state">{busy ? activity || "Working…" : state.flow ? "Storyteller" : "Discovery"}</span></div>
    <section className="interview" aria-label="Presentation conversation">
      <div className="conversation" ref={conversation} onScroll={e=>{const node=e.currentTarget;followConversation.current=node.scrollHeight-node.scrollTop-node.clientHeight<80;}}>
        {!messages.length && !busy && <div className="prep-intro"><h1>What’s your story?</h1><p>Tell me what you want to present, who it’s for, and what you want them to take away.</p></div>}
        {messages.map((m,i) => <article className={`message ${m.role}`} key={i}><span>{m.role === "user" ? "You" : "Omnipresent"}</span><MessageText text={m.content}/></article>)}
        {busy && <article className="message assistant" role="status"><span>Omnipresent</span><p>{activity || (state.flow ? "Updating your story…" : "Working on your presentation…")}</p></article>}
        {state.events.filter(e=>e.kind === "context.requested" && !messages.some(m=>m.content===e.summary)).filter((e,i,all)=>all.findIndex(x=>x.summary===e.summary)===i).slice(-2).map(e=><article className="message assistant" key={e.id}><span>Omnipresent</span><p>{e.summary}</p></article>)}
      </div>
    </section>
    <div className="composer-dock">
      {state.artifacts.length > 0 && <ul className="attachments" aria-label="Attached material">{state.artifacts.map(a => <li key={a.id}>{a.name}</li>)}</ul>}
      {error && <p role="alert" className="inline-error">{error}</p>}
      <form className="prep-composer" onSubmit={e => { e.preventDefault(); if (!input.trim() || busy || uploading) return; pendingInput.current = input; followConversation.current=true; send({type: "agent_turn", role, text: input}); }}>
        <label className="sr-only" htmlFor="agent-input">{state.flow ? "Request story changes" : "Message assistant"}</label>
        <textarea id="agent-input" name="message" value={input} maxLength={6000} onChange={e => setInput(e.target.value)} rows={2} placeholder={state.flow ? "What would you like to change…" : "Share an idea or add your material…"} />
        <div className="composer-actions">
          <input ref={file} hidden type="file" aria-label="Material files" accept=".txt,.md,.csv,.json,.pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.webp" multiple disabled={busy || uploading || !connected} onChange={e => { void upload(e.target.files); e.target.value = ""; }} />
          <button className="attach-button" type="button" aria-label={uploading ? "Attaching material" : "Attach material"} title="Attach material" onClick={() => file.current?.click()} disabled={busy || uploading || !connected}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 11-8.5 8.5a6 6 0 0 1-8.5-8.5L13 2a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8l8.4-8.4" /></svg></button>
          {busy ? <button type="button" onClick={() => send({type: "agent_cancel"})}>Stop</button> : <button className="primary" disabled={!connected || uploading || !input.trim()} aria-label="Send message">Send <Icon name="send"/></button>}
        </div>
      </form>
      {!state.flow && messages.length > 0 && <div className="finish-interview"><button disabled={busy || uploading || !connected} onClick={() => send({ type: "finish_interview" })}>Create story from conversation</button></div>}
    </div>
    {!state.flow && <section className="story-placeholder" aria-label="Story preview"><Icon name="spark"/><h2>Your story takes shape here</h2><p>Start with a conversation. Add your material, then create a story when the brief feels right.</p></section>}
    {state.flow && <section className="story-pane" aria-label="Story preview">
      <div className="story-plan">
      <div className="story-section-label"><h2>Story</h2><span>{state.flow.beats.length} scenes</span></div>
      <div className="story-heading"><div><h1>{state.flow.title}</h1><p>{state.flow.summary}</p></div></div>
      {state.flowBasedOnRevision === null && <p role="status">Material changed. Ask for an updated story before saving.</p>}
      <ol>{state.flow.beats.map((beat,i) => <li key={i}><span className="beat-number">{i+1}</span><div><h2>{beat.title}</h2><p>{beat.audienceText}</p>
        {state.visuals?.find(v => v.id === beat.visualId) && <Visual spec={state.visuals.find(v => v.id === beat.visualId)!.spec} />}
        {state.artifacts.find(a => a.id === beat.imageArtifactId)?.media && <img className="story-image" alt={state.artifacts.find(a => a.id === beat.imageArtifactId)!.media!.alt} src={state.artifacts.find(a => a.id === beat.imageArtifactId)!.media!.url} />}
        {beat.componentEvidence && <details className="evidence-details"><summary>Component coverage</summary>{Object.entries(beat.componentEvidence).map(([kind,contract])=>contract&&<div key={kind}><strong>{kind === "visual" ? "Chart / diagram" : kind === "image" ? "Image" : "Text"}</strong><p>{contract.evidence.claims.map(c=>c.aliases[0]).join("; ")} · {contract.evidence.provenance === "illustrative" ? "Illustrative" : "Source-backed"} · {contract.evidence.approved ? "Presenter approved" : "Awaiting review"}</p></div>)}<p>Declared coverage; not independent verification.</p></details>}
        {beat.evidence && <details className="evidence-details"><summary>{beat.evidence.provenance === "illustrative" ? "Concept illustration" : "Supporting material"}</summary><p>{beat.evidence.verification === "audited" ? "Audited evidence" : "Not independently verified"}{beat.evidence.unit ? ` · ${beat.evidence.unit}` : ""}</p>{beat.evidence.sources.map(source=><div key={source.id}><strong>{state.artifacts.find(a=>a.id===source.id)?.name ?? "Prepared narrative"}</strong><p>{source.summary.slice(0,600)}{source.summary.length>600?"…":""}</p></div>)}</details>}
        </div></li>)}</ol>
      {state.flow.openQuestions.length > 0 && <details><summary>Open questions</summary><ul>{state.flow.openQuestions.map(q => <li key={q}>{q}</li>)}</ul></details>}
      </div>
      <div className="story-save-dock"><span>{state.approvedRevision===state.revision ? "Saved to your canvas library" : "Review the flow before saving"}</span><button className="primary" disabled={busy || uploading || !connected || state.flowBasedOnRevision === null} onClick={onSave}>Save story</button></div>
    </section>}
  </div>;
}
