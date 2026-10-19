import React, { useEffect } from "react";
import { Visual } from "./Visual";
import { AdaptiveCanvas } from "./AdaptiveCanvas";
import { Icon } from "./Icon";
import type { SavedStory } from "../../shared/workspace";
import type { Stage } from "../../server/session";

export function PresentationRoom({
  selectedStory,
  active,
  stage,
  paused,
  starting,
  connected,
  endPresentation,
  onBack,
  onStart,
  sessionId,
  lastTranscript,
  cueBeat,
}: {
  selectedStory: SavedStory;
  active: boolean;
  stage: Stage | null;
  paused: boolean;
  starting: boolean;
  connected: boolean;
  endPresentation(): void;
  onBack(): void;
  onStart(): void;
  sessionId?: string;
  lastTranscript?: string;
  cueBeat?: (index: number) => void;
}) {
  const beats = selectedStory.state.flow?.beats ?? [];
  const opening = beats[0];
  const currentBeatIndex =
    stage?.composition?.beat ??
    stage?.composition?.adaptive?.blocks[0]?.beat ??
    0;
  const currentBeat = beats[currentBeatIndex] ?? opening;

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        if (currentBeatIndex < beats.length - 1) {
          cueBeat?.(currentBeatIndex + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (currentBeatIndex > 0) {
          cueBeat?.(currentBeatIndex - 1);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, currentBeatIndex, beats.length, cueBeat]);

  const openAudienceDisplay = () => {
    const sid = sessionId || `${selectedStory.projectId}:${selectedStory.id}`;
    window.open(
      `/?audience=true&sessionId=${encodeURIComponent(sid)}`,
      "_blank",
      "menubar=no,status=no,titlebar=no,toolbar=no",
    );
  };

  if (!active) {
    return (
      <section className="presentation-room" aria-label="Presentation canvas">
        <div className="room-toolbar">
          <button
            disabled={starting}
            onClick={() => {
              endPresentation();
              onBack();
            }}
          >
            ← All stories
          </button>
          <span>{selectedStory.state.flow!.title}</span>
        </div>
        <div className="canvas">
          <div className="story-ready">
            <div className="opening-preview" aria-label="Opening scene preview">
              <h1>{opening?.title}</h1>
              <p>{opening?.audienceText}</p>
              {selectedStory.state.visuals?.find(
                (v) => v.id === opening?.visualId,
              ) && (
                <Visual
                  spec={
                    selectedStory.state.visuals.find(
                      (v) => v.id === opening?.visualId,
                    )!.spec
                  }
                />
              )}
              {selectedStory.state.artifacts.find(
                (a) => a.id === opening?.imageArtifactId,
              )?.media && (
                <img
                  className="scene-image"
                  src={
                    selectedStory.state.artifacts.find(
                      (a) => a.id === opening?.imageArtifactId,
                    )!.media!.url
                  }
                  alt={
                    selectedStory.state.artifacts.find(
                      (a) => a.id === opening?.imageArtifactId,
                    )!.media!.alt
                  }
                />
              )}
            </div>
            <div className="start-actions">
              <button
                className="primary"
                disabled={!connected || starting}
                onClick={() => void onStart()}
              >
                {starting ? "Starting…" : "Start presentation"}
              </button>
              {starting && <button onClick={endPresentation}>Cancel</button>}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="presenter-console" aria-label="Presenter Console">
      <div className="presenter-toolbar">
        <div className="toolbar-left">
          <span className="presenter-story-title">
            {selectedStory.state.flow?.title}
          </span>
          <span className="beat-progress-badge">
            Beat {currentBeatIndex + 1} of {beats.length}
          </span>
        </div>
        <div className="toolbar-center">
          <button
            className="step-btn"
            disabled={currentBeatIndex <= 0}
            onClick={() => cueBeat?.(currentBeatIndex - 1)}
            title="Previous beat (Left Arrow)"
          >
            ← Previous
          </button>
          <button
            className="step-btn primary"
            disabled={currentBeatIndex >= beats.length - 1}
            onClick={() => cueBeat?.(currentBeatIndex + 1)}
            title="Next beat (Right Arrow)"
          >
            Next →
          </button>
        </div>
        <div className="toolbar-right">
          <button
            className="open-audience-btn"
            onClick={openAudienceDisplay}
            title="Open clean audience canvas on secondary screen or projector"
          >
            <Icon name="external" />
            <span>Open Audience Display</span>
          </button>
        </div>
      </div>

      <div className="presenter-grid">
        <div className="mirror-column">
          <div className="column-card mirror-card">
            <div className="card-top">
              <h3>Audience Display Mirror</h3>
              {paused && <span className="paused-pill">Paused</span>}
            </div>
            <div className="audience-mirror-view">
              {stage?.composition?.adaptive ? (
                <AdaptiveCanvas
                  composition={stage.composition.adaptive}
                  state={selectedStory.state}
                  engine="openui"
                />
              ) : stage?.composition ? (
                <article
                  className={`scene ${stage.composition.visual || stage.composition.image ? "has-visual" : ""}`}
                  key={stage.revision}
                >
                  <h1>{stage.composition.title}</h1>
                  {stage.composition.body && <p>{stage.composition.body}</p>}
                  {stage.composition.visual && (
                    <Visual spec={stage.composition.visual} />
                  )}
                  {stage.composition.image && (
                    <img
                      className="scene-image"
                      src={stage.composition.image.url}
                      alt={stage.composition.image.alt}
                    />
                  )}
                </article>
              ) : (
                <div className="mirror-empty">Awaiting stage…</div>
              )}
            </div>
          </div>
        </div>

        <div className="cockpit-column">
          <div className="column-card notes-card">
            <div className="card-top">
              <div className="card-title-group">
                <Icon name="notes" />
                <h3>Speaker Notes</h3>
              </div>
              <span className="current-title-badge">{currentBeat?.title}</span>
            </div>
            <div className="speaker-notes-content">
              <p>
                {currentBeat?.speakerNotes ||
                  "No speaker notes written for this beat."}
              </p>
            </div>
          </div>

          <div className="column-card copy-card">
            <div className="card-top">
              <h3>Audience Text & Visual Cue</h3>
            </div>
            <div className="audience-copy-content">
              <p className="audience-text">
                {currentBeat?.audienceText || currentBeat?.title}
              </p>
              {currentBeat?.visualDirection && (
                <div className="visual-direction-tag">
                  <strong>Direction:</strong> {currentBeat.visualDirection}
                </div>
              )}
            </div>
          </div>

          <div className="column-card hud-card">
            <div className="card-top">
              <div className="hud-status">
                <span className="hud-dot" />
                <h3>Live Speech Transcript</h3>
              </div>
            </div>
            <div className="hud-content">
              <p className="transcript-text">
                {lastTranscript
                  ? `“${lastTranscript}”`
                  : "Listening for spoken narrative cues…"}
              </p>
            </div>
          </div>

          <div className="column-card outline-card">
            <div className="card-top">
              <h3>Story Beats Outline</h3>
              <span className="outline-count">{beats.length} beats</span>
            </div>
            <div className="beats-nav-list">
              {beats.map((b, idx) => (
                <div
                  key={idx}
                  className={`outline-beat-row ${idx === currentBeatIndex ? "active" : ""}`}
                  onClick={() => cueBeat?.(idx)}
                >
                  <span className="row-num">{idx + 1}</span>
                  <div className="row-info">
                    <span className="row-title">{b.title}</span>
                    <span className="row-snippet">
                      {b.speakerNotes.slice(0, 48)}…
                    </span>
                  </div>
                  <button
                    className="row-cue-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      cueBeat?.(idx);
                    }}
                  >
                    Cue
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
