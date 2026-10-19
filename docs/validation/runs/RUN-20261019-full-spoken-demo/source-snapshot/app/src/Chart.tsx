import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import type { Visual } from "../../shared/visuals";
export default function Chart({spec}: {spec: Extract<Visual, {kind:"chart"}>}) {
  const axes = <><CartesianGrid vertical={false} stroke="#e5e6e2" /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /></>;
  return <figure className="visual" aria-label={spec.title}>
    <div className="chart"><ResponsiveContainer width="100%" height="100%">
      {spec.chartType === "bar" ? <BarChart data={spec.data}>{axes}<Bar dataKey="value" fill="#35654e" isAnimationActive={false} /></BarChart> :
        <LineChart data={spec.data}>{axes}<Line dataKey="value" stroke="#35654e" strokeWidth={3} isAnimationActive={false} /></LineChart>}
    </ResponsiveContainer></div>
    <figcaption>{spec.title}{spec.unit && ` · ${spec.unit}`}</figcaption>
    <table className="sr-only"><caption>{spec.title}</caption><tbody>{spec.data.map((row,i) => <tr key={i}><th>{row.label}</th><td>{row.value} {spec.unit}</td></tr>)}</tbody></table>
  </figure>;
}
