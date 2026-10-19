import { z } from "zod";
const label = z.string().trim().min(1).max(160);
export const chartSchema = z.object({
  kind: z.literal("chart"), title: label, chartType: z.enum(["bar", "line"]),
  unit: z.string().max(40), sourceArtifactId: z.string(),
  data: z.array(z.object({ label, value: z.number().finite() })).min(1).max(30),
});
export const diagramSchema = z.object({
  kind: z.literal("diagram"), title: label,
  nodes: z.array(label).min(2).max(12),
  edges: z.array(z.object({ from: z.number().int().min(0).max(11), to: z.number().int().min(0).max(11) })).min(1).max(20),
});
export const visualSchema = z.discriminatedUnion("kind", [chartSchema, diagramSchema]);
export type Visual = z.infer<typeof visualSchema>;
export const mediaSchema = z.object({
  url: z.string().regex(/^\/api\/materials\/[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/),
  alt: z.string().max(500),
});
export type Media = z.infer<typeof mediaSchema>;
export function diagramSource(visual: z.infer<typeof diagramSchema>) {
  // Labels become numeric HTML entities; agents cannot inject Mermaid directives/links.
  const escape = (s: string) => Array.from(s).map(c => `#${c.codePointAt(0)};`).join("");
  return "flowchart LR\n" + visual.nodes.map((s,i) => `n${i}["${escape(s)}"]`).join("\n") + "\n" +
    visual.edges.map(e => `n${e.from} --> n${e.to}`).join("\n");
}
