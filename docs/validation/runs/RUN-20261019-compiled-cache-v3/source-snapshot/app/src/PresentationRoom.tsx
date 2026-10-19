import React from "react";
import {Visual} from "./Visual";
import {AdaptiveCanvas} from "./AdaptiveCanvas";
import type {SavedStory} from "../../shared/workspace";
import type {Stage} from "../../server/session";
export function PresentationRoom({selectedStory,active,stage,paused,starting,connected,endPresentation,onBack,onStart}:{selectedStory:SavedStory;active:boolean;stage:Stage|null;paused:boolean;starting:boolean;connected:boolean;endPresentation():void;onBack():void;onStart():void}){
 const opening=selectedStory.state.flow?.beats[0];
 return (        <section className="presentation-room" aria-label="Presentation canvas">
          {!active && <div className="room-toolbar"><button disabled={starting} onClick={() => { endPresentation(); onBack(); }}>← All stories</button><span>{selectedStory.state.flow!.title}</span></div>}
          <div className="canvas">
          {active && stage?.composition?.adaptive ? <><AdaptiveCanvas composition={stage.composition.adaptive} state={selectedStory.state} engine="openui" />{paused && <span className="paused">Paused</span>}</> : active && stage?.composition ? <article className={`scene ${stage.composition.visual || stage.composition.image ? "has-visual" : ""}`} key={stage.revision}>
            <h1>{stage.composition.title}</h1>{stage.composition.body && <p>{stage.composition.body}</p>}
            {stage.composition.visual && <Visual spec={stage.composition.visual} />}
            {stage.composition.image && <img className="scene-image" src={stage.composition.image.url} alt={stage.composition.image.alt} />}
            {paused && <span className="paused" role="status">Paused</span>}
          </article> : <div className="story-ready">
            <div className="opening-preview" aria-label="Opening scene preview">
              <h1>{opening?.title}</h1><p>{opening?.audienceText}</p>
              {selectedStory.state.visuals?.find(v => v.id === opening?.visualId) && <Visual spec={selectedStory.state.visuals.find(v => v.id === opening?.visualId)!.spec} />}
              {selectedStory.state.artifacts.find(a => a.id === opening?.imageArtifactId)?.media && <img className="scene-image" src={selectedStory.state.artifacts.find(a => a.id === opening?.imageArtifactId)!.media!.url} alt={selectedStory.state.artifacts.find(a => a.id === opening?.imageArtifactId)!.media!.alt} />}
            </div>
            <div className="start-actions"><button className="primary" disabled={!connected || starting} onClick={() => void onStart()}>{starting ? "Starting…" : "Start presentation"}</button>{starting && <button onClick={endPresentation}>Cancel</button>}</div>
          </div>}
          </div>
        </section>);
}
