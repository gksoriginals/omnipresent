import React, { useEffect, useState } from "react";
import { AdaptiveCanvas } from "./AdaptiveCanvas";
import { Visual } from "./Visual";
import { SessionClient } from "./services/session-client";
import type { Stage } from "../../server/session";
import type { Preparation } from "../../shared/preparation";
import { Icon } from "./Icon";

export function AudienceView() {
  const [stage, setStage] = useState<Stage | null>(null);
  const [paused, setPaused] = useState(false);
  const [storyState, setStoryState] = useState<Preparation | null>(null);
  const [title, setTitle] = useState("Omnipresent");
  const [connected, setConnected] = useState(false);
  const [ended, setEnded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("sessionId") || "";
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${location.host}/session?role=audience${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ""}`;

    const client = new SessionClient(url, {
      open() {
        setConnected(true);
        if (sessionId) {
          client.send({ type: "session_attach", role: "audience", sessionId });
        }
      },
      event(event) {
        if (event.type === "presentation_loaded") {
          if (typeof event.title === "string") setTitle(event.title);
          if (event.state) setStoryState(event.state as Preparation);
          setEnded(false);
        }
        if (event.type === "stage" && event.stage) {
          setStage(event.stage);
          setEnded(false);
        }
        if (event.type === "snapshot") {
          if (event.stage) setStage(event.stage);
          if (typeof event.paused === "boolean") setPaused(event.paused);
        }
        if (event.type === "presentation_stopped") {
          setEnded(true);
        }
      },
      close() {
        setConnected(false);
      },
      error(err) {
        console.warn("Audience connection error:", err);
      },
    });

    client.connect();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      client.close();
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="audience-viewport" aria-label="Audience presentation display">
      <button
        className="audience-fullscreen-toggle"
        title={fullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
        aria-label="Toggle Fullscreen"
        onClick={toggleFullscreen}
      >
        <Icon name="external" />
        <span>{fullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
      </button>

      {!connected && (
        <div className="audience-reconnecting" role="status">
          Reconnecting to presentation…
        </div>
      )}

      {ended ? (
        <div className="audience-standby">
          <h1>Presentation Concluded</h1>
          <p>Thank you for attending.</p>
        </div>
      ) : stage?.composition?.adaptive && storyState ? (
        <div className="audience-canvas-container">
          <AdaptiveCanvas composition={stage.composition.adaptive} state={storyState} engine="openui" />
          {paused && <div className="audience-paused-badge">Paused</div>}
        </div>
      ) : stage?.composition ? (
        <article className={`scene ${stage.composition.visual || stage.composition.image ? "has-visual" : ""}`} key={stage.revision}>
          <h1>{stage.composition.title}</h1>
          {stage.composition.body && <p>{stage.composition.body}</p>}
          {stage.composition.visual && <Visual spec={stage.composition.visual} />}
          {stage.composition.image && <img className="scene-image" src={stage.composition.image.url} alt={stage.composition.image.alt} />}
          {paused && <div className="audience-paused-badge">Paused</div>}
        </article>
      ) : (
        <div className="audience-standby">
          <h1>{title}</h1>
          <p>Presentation will begin shortly…</p>
        </div>
      )}
    </div>
  );
}
