import type { AdaptiveComposition } from "../shared/adaptive.js";
import type { Visual, Media } from "../shared/visuals.js";
import { performance } from "node:perf_hooks";
export type Stage = {
  text: string;
  revision: number;
  source: "manual" | "speech" | "agent";
  composition?: { adaptive?: AdaptiveComposition; title: string; body: string; beat: number; flowRevision: number; visual?: Visual; image?: Media };
  committedAt: number;
};
export class Session {
  stage: Stage = {
    text: "",
    revision: 0,
    source: "manual",
    committedAt: Date.now(),
  };
  paused = false;
  generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(private emit: (event: Record<string, unknown>) => void) {}
  snapshot() {
    return { type: "snapshot", stage: this.stage, paused: this.paused };
  }
  propose(text: string, source: Stage["source"], delay = 0, composition?: Stage["composition"]) {
    this.cancel();
    const epoch = this.generation;
    if (this.paused) return;
    const started = performance.now();
    const commit = () => {
      if (epoch !== this.generation || this.paused) return;
      this.stage = {
        text,
        composition,
        source,
        revision: this.stage.revision + 1,
        committedAt: Date.now(),
      };
      this.emit({
        type: "stage",
        stage: this.stage,
        dispatchMs: performance.now() - started,
      });
    };
    if (delay) this.timer = setTimeout(commit, delay);
    else commit();
  }
  cancel() {
    this.generation++;
    clearTimeout(this.timer);
    this.timer = undefined;
  }
  pause(value: boolean) {
    this.cancel();
    this.paused = value;
    this.emit(this.snapshot());
  }
}
