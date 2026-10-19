import { useRef } from "react";
import {Icon} from "./Icon";
import type { SavedStory, Project } from "../../shared/workspace";

export function StoryLibrary({
  stories,
  projects,
  onSelect,
  onCreate,
  onRemove,
  onExport,
  onImport,
}: {
  stories: SavedStory[];
  projects: Project[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onRemove: (id: string) => void;
  onExport?: (id: string) => void;
  onImport?: (file: File) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return <section className="story-library" aria-label="Your stories">
    <div className="library-heading">
      <div><h1>Your stories</h1><p>Choose a story and start presenting.</p></div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          ref={fileInput}
          type="file"
          accept=".omnipresent,.json"
          hidden
          onChange={e => {
            const file = e.target.files?.[0];
            if (file && onImport) onImport(file);
            e.target.value = "";
          }}
        />
        <button onClick={() => fileInput.current?.click()} title="Import an .omnipresent bundle"><Icon name="upload"/> Import</button>
        <button onClick={onCreate}><Icon name="plus"/> New presentation</button>
      </div>
    </div>
    {stories.length ? <div className="story-grid">{[...stories].reverse().map(story => {
      const flow = story.state.flow!, first = flow.beats[0];
      const image = story.state.artifacts.find(a => a.id === first.imageArtifactId)?.media;
      return <article className="story-card" key={story.id}>
        <button className="story-card-open" aria-label={`Open story ${flow.title}`} onClick={() => onSelect(story.id)}>
          <span className="story-thumbnail">{image ? <img src={image.url} alt="" loading="lazy" /> : <span><strong>{first.title}</strong><span>{first.audienceText}</span></span>}</span>
          <span className="story-card-title">{flow.title}</span>
          <span className="story-card-meta">{projects.find(p => p.id === story.projectId)?.title ?? "Presentation"} · {flow.beats.length} {flow.beats.length === 1 ? "scene" : "scenes"}</span>
          <span className="story-card-date">{new Date(story.savedAt).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}</span>
        </button>
        {onExport && <button className="story-export" aria-label={`Export story ${flow.title}`} title="Export story (.omnipresent)" onClick={() => onExport(story.id)}><Icon name="download"/></button>}
        <button className="story-remove" aria-label={`Remove story ${flow.title}`} title="Remove story" onClick={() => onRemove(story.id)}><Icon name="trash"/></button>
      </article>;
    })}</div> : <div className="library-empty">
      <h2>Your next presentation starts with a conversation.</h2>
      <p>Create a project in Prepare, or import a saved .omnipresent story.</p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="primary" onClick={onCreate}>Create a project</button>
        <button onClick={() => fileInput.current?.click()}><Icon name="upload"/> Import</button>
      </div>
    </div>}
  </section>;
}
