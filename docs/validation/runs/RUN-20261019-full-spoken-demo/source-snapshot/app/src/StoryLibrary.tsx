import {Icon} from "./Icon";
import type { SavedStory, Project } from "../../shared/workspace";
export function StoryLibrary({stories, projects, onSelect, onCreate, onRemove}: {stories: SavedStory[]; projects: Project[]; onSelect:(id:string)=>void; onCreate:()=>void; onRemove:(id:string)=>void}) {
  return <section className="story-library" aria-label="Your stories">
    <div className="library-heading"><div><h1>Your stories</h1><p>Choose a story and start presenting.</p></div><button onClick={onCreate}><Icon name="plus"/> New presentation</button></div>
    {stories.length ? <div className="story-grid">{[...stories].reverse().map(story => {
      const flow = story.state.flow!, first = flow.beats[0];
      const image = story.state.artifacts.find(a => a.id === first.imageArtifactId)?.media;
      return <article className="story-card" key={story.id}><button className="story-card-open" aria-label={`Open story ${flow.title}`} onClick={() => onSelect(story.id)}>
        <span className="story-thumbnail">{image ? <img src={image.url} alt="" loading="lazy" /> : <span><strong>{first.title}</strong><span>{first.audienceText}</span></span>}</span>
        <span className="story-card-title">{flow.title}</span>
        <span className="story-card-meta">{projects.find(p => p.id === story.projectId)?.title ?? "Presentation"} · {flow.beats.length} {flow.beats.length === 1 ? "scene" : "scenes"}</span>
        <span className="story-card-date">{new Date(story.savedAt).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}</span>
      </button><button className="story-remove" aria-label={`Remove story ${flow.title}`} title="Remove story" onClick={() => onRemove(story.id)}><Icon name="trash"/></button></article>;
    })}</div> : <div className="library-empty"><h2>Your next presentation starts with a conversation.</h2><p>Create a project in Prepare, then save its story here.</p><button className="primary" onClick={onCreate}>Create a project</button></div>}
  </section>;
}
