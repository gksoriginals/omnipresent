import { useEffect, useId, useState, lazy, Suspense } from "react";
const Chart = lazy(() => import("./Chart"));
import { diagramSource, type Visual as Spec } from "../../shared/visuals";
const diagramCache = new Map<string, string>();
export function Visual({ spec }: { spec: Spec }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState(""), [error, setError] = useState("");
  useEffect(() => {
    if (spec.kind !== "diagram") return;
    let cancelled = false;
    const key = id + JSON.stringify(spec);
    setSvg(""); setError("");
    const cached = diagramCache.get(key);
    if (cached) { setSvg(cached); return; }
    void import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", flowchart: { htmlLabels: false }, fontFamily: "Helvetica Neue, sans-serif" });
      const result = await mermaid.render(`diagram${id}`, diagramSource(spec));
      if (cancelled) return;
      if (diagramCache.size >= 32) diagramCache.delete(diagramCache.keys().next().value!);
      diagramCache.set(key, result.svg); setSvg(result.svg);
    }).catch(() => { if (!cancelled) setError("Diagram could not be drawn. Revise it in the conversation."); });
    return () => { cancelled = true; };
  }, [spec, id]);
  if (spec.kind === "diagram") return <figure className="visual">
    <div role="img" aria-label={`${spec.title}: ${spec.nodes.join(" → ")}`} className="diagram" dangerouslySetInnerHTML={{ __html: svg }} />
    {error && <p role="alert">{error}</p>}
    <figcaption>{spec.title}</figcaption>
  </figure>;
  return <Suspense fallback={<p role="status">Preparing chart…</p>}><Chart spec={spec} /></Suspense>;
}
