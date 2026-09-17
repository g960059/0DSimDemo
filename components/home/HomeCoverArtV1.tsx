import React from "react";
import type { HomeItemV1 } from "./HomeDiscoveryV1";

const subjects = [
  ["equilibrium", /Guyton|循環平衡|equilibrium/i],
  ["starling", /Starling|スターリング/i],
  ["respiration", /呼吸|PEEP|respira/i],
  ["filling", /EDPVR|硬さ|弛緩|充満圧|relaxation|stiffness/i],
  ["afterload", /後負荷|抵抗|afterload|resistance|\bEa\b/i],
  ["preload", /血液量|前負荷|preload|blood volume/i],
  ["contractility", /ESPVR|Ees|収縮|能動張力|contractil/i],
] as const;

/** A title's main subject wins over incidental topics in its summary. */
export function homeCoverSubjectV1(
  item: Pick<HomeItemV1, "kind" | "title" | "description">,
) {
  if (item.kind === "course") return "course";
  for (const text of [item.title, item.description]) {
    const matches = subjects.flatMap(([subject, pattern]) => {
      const match = pattern.exec(text);
      return match ? [{ subject, index: match.index }] : [];
    });
    if (matches.length)
      return matches.sort((a, b) => a.index - b.index)[0].subject;
    if (/PV|一拍|心周期|圧.?容積|cardiac.?cycle|pressure.?volume/i.test(text))
      return "cycle";
  }
  return "cycle";
}

type Tone = "primary" | "secondary" | "baseline" | "axis";
const color = (tone: Tone) => `var(--art-${tone})`;
function Line({
  d,
  tone = "primary",
  reference = false,
  width = 4,
  fill = false,
}: {
  d: string;
  tone?: Tone;
  reference?: boolean;
  width?: number;
  fill?: boolean;
}) {
  return (
    <path
      d={d}
      fill={fill ? color(tone) : "none"}
      fillOpacity={fill ? 0.09 : undefined}
      stroke={color(tone)}
      strokeWidth={width}
      strokeDasharray={reference ? "6 7" : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Axes({ x = "V", y = "P" }: { x?: string; y?: string }) {
  return (
    <g fill="var(--art-label)" fontSize="12" fontWeight="500">
      <Line d="M48 35V188H353" tone="axis" width={1.5} />
      <text x="35" y="33" textAnchor="middle">
        {y}
      </text>
      <text x="354" y="208" textAnchor="end">
        {x}
      </text>
    </g>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <text
      x="351"
      y="38"
      textAnchor="end"
      fill="var(--art-label)"
      fontSize="13"
      fontWeight="500"
    >
      {children}
    </text>
  );
}
function Point({
  x,
  y,
  reference = false,
}: {
  x: number;
  y: number;
  reference?: boolean;
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r="5"
      fill={reference ? "var(--art-paper)" : color("primary")}
      stroke={reference ? color("baseline") : "var(--art-paper)"}
      strokeWidth="2.5"
    />
  );
}

// Dimensionless concept geometry, never simulated or measured output. Comparative
// PV loops share V0; change one of Ees/Ea/EDV and keep the other two fixed. Their
// end-systolic points lie on both construction lines, even after simplification.
function pv({ edv = 314, ees = 1.15, ea = 0.67 } = {}) {
  const v0 = 82,
    floor = 188;
  const esv = (ees * v0 + ea * edv) / (ees + ea);
  const end = floor - ees * (esv - v0),
    span = edv - esv;
  const filling = 180 - (edv - 244) * 0.16;
  return {
    esv,
    end,
    loop: `M${edv} ${filling}V${end - 5}C${edv - span * 0.2} ${end - 32} ${esv + span * 0.16} ${end - 16} ${esv} ${end}V184C${esv + span * 0.35} 184 ${edv - span * 0.28} 184 ${edv} ${filling}Z`,
    espvr: `M${v0} ${floor}L${v0 + (floor - 36) / ees} 36`,
    ea: `M${edv} ${floor}L${edv - (floor - 42) / ea} 42`,
  };
}
function PvComparison({
  subject,
}: {
  subject: "contractility" | "afterload" | "preload";
}) {
  const base = pv(subject === "preload" ? { edv: 270 } : {});
  const changed = pv(
    subject === "contractility"
      ? { ees: 1.9 }
      : subject === "afterload"
        ? { ea: 1.06 }
        : {},
  );
  return (
    <>
      <Axes />
      {subject === "contractility" ? (
        <>
          <Line d={base.espvr} tone="baseline" reference width={2.5} />
          <Line d={changed.espvr} width={2.5} />
          <Label>ESPVR</Label>
        </>
      ) : subject === "afterload" ? (
        <>
          <Line d={base.espvr} tone="axis" width={2} />
          <Line d={base.ea} tone="baseline" reference width={2.5} />
          <Line d={changed.ea} width={2.5} />
          <Label>Ea</Label>
        </>
      ) : (
        <Line d={base.espvr} tone="axis" width={2} />
      )}
      <Line d={base.loop} tone="baseline" reference width={3} />
      <Line d={changed.loop} fill />
      <Point x={base.esv} y={base.end} reference />
      <Point x={changed.esv} y={changed.end} />
    </>
  );
}
function Cycle() {
  const beat = pv();
  return (
    <>
      <Axes />
      <Line d={beat.loop} fill width={4.5} />
      <Line
        d={`M${beat.esv - 5} 133L${beat.esv} 140L${beat.esv + 5} 133M309 122L314 115L319 122`}
        width={2.5}
      />
      <Point x={beat.esv} y={beat.end} />
    </>
  );
}
function curve(fn: (x: number) => number, from: number, to: number) {
  return Array.from({ length: 49 }, (_, i) => {
    const x = from + ((to - from) * i) / 48;
    return `${i ? "L" : "M"}${x.toFixed(1)} ${fn(x).toFixed(1)}`;
  }).join(" ");
}
const starling = (x: number) => 184 - 134 * (1 - Math.exp(-(x - 60) / 97));
function Starling() {
  return (
    <>
      <Axes x="EDV" y="SV" />
      <Line
        d={`M129 188V${starling(129)}M248 188V${starling(248)}`}
        tone="axis"
        reference
        width={1.5}
      />
      <Line d={curve(starling, 66, 337)} />
      <Point x={129} y={starling(129)} reference />
      <Point x={248} y={starling(248)} />
    </>
  );
}
function Filling() {
  const relaxed = (x: number) => 188 - 7 * (Math.exp((x - 65) / 100) - 1);
  const stiff = (x: number) => 188 - 16.1 * (Math.exp((x - 65) / 100) - 1);
  return (
    <>
      <Axes />
      <Label>EDPVR</Label>
      <Line
        d={`M260 ${relaxed(260)}V${stiff(260)}`}
        tone="axis"
        reference
        width={1.5}
      />
      <Line d={curve(relaxed, 66, 337)} tone="baseline" reference width={3} />
      <Line d={curve(stiff, 66, 299)} />
      <Point x={260} y={relaxed(260)} reference />
      <Point x={260} y={stiff(260)} />
    </>
  );
}
const cardiac = (x: number) => 188 - 135 * (1 - Math.exp(-(x - 64) / 100));
const venous = (x: number) => 61 + (Math.max(96, x) - 86) * 0.55;
// Find the actual intersection of the two drawn concept curves.
const equilibrium = (() => {
  let low = 96,
    high = 300;
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2;
    if (cardiac(middle) > venous(middle)) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
})();
function Guyton() {
  const y = cardiac(equilibrium);
  return (
    <>
      <Axes x="RAP" y="Q" />
      <Line
        d={`M48 ${y}H${equilibrium}V188`}
        tone="axis"
        reference
        width={1.5}
      />
      <Line d={curve(venous, 68, 316)} tone="secondary" />
      <Line d={curve(cardiac, 68, 337)} />
      <Point x={equilibrium} y={y} />
      <g fontSize="12" fontWeight="500">
        <text x="331" y="53" textAnchor="end" fill={color("primary")}>
          CO
        </text>
        <text x="321" y="170" fill={color("secondary")}>
          VR
        </text>
      </g>
    </>
  );
}
function Respiration() {
  const pressure =
    "M65 174H84Q91 174 91 165V98Q91 91 100 91H132Q144 91 149 100Q161 126 169 174H209Q216 174 216 165V98Q216 91 225 91H257Q269 91 274 100Q286 126 294 174H335";
  return (
    <>
      <Axes x="t" y="Paw" />
      <Label>PEEP</Label>
      <Line d={pressure} tone="baseline" reference width={3} />
      <g transform="translate(0 -30)">
        <Line d={pressure} />
      </g>
    </>
  );
}

/** Simplified editorial diagrams: topology and comparison, without data claims. */
export function HomeCoverArtV1({ item }: { item: HomeItemV1 }) {
  const subject = homeCoverSubjectV1(item);
  return (
    <svg
      className={`home-cover-art home-art-${subject}`}
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="225" fill="var(--art-bg)" />
      {subject === "course" ? (
        <>
          <g transform="translate(0 45) scale(.48)">
            <Cycle />
          </g>
          <Line
            d="M187 111H209M203 105L209 111L203 117"
            tone="axis"
            width={2}
          />
          <g transform="translate(208 45) scale(.48)">
            <Guyton />
          </g>
        </>
      ) : subject === "contractility" ||
        subject === "afterload" ||
        subject === "preload" ? (
        <PvComparison subject={subject} />
      ) : subject === "starling" ? (
        <Starling />
      ) : subject === "equilibrium" ? (
        <Guyton />
      ) : subject === "filling" ? (
        <Filling />
      ) : subject === "respiration" ? (
        <Respiration />
      ) : (
        <Cycle />
      )}
    </svg>
  );
}
