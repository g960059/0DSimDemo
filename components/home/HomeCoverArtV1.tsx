import React from "react";
import type { HomeItemV1 } from "./HomeDiscoveryV1";

const subjects = [
  ["equilibrium", /Guyton|循環平衡|equilibrium/i],
  ["starling", /Starling|スターリング/i],
  ["respiration", /呼吸|PEEP|respira/i],
  [
    "filling",
    /EDPVR|充満圧|心室.{0,5}硬さ|受動.{0,5}硬さ|ventricular stiffness/i,
  ],
  ["relaxation", /弛緩|relaxation|\btau\b/i],
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
    // A pressure/time question must not become a ventricular-stiffness diagram
    // just because it mentions arterial stiffness or changing resistance.
    if (
      /圧波形|waveform|pressure wave/i.test(text) &&
      /動脈.{0,5}硬さ|compliance|arterial stiffness/i.test(text)
    )
      return "waveform";
    if (
      /受動.{0,5}硬さ|ventricular stiffness/i.test(text) &&
      /充満圧|filling pressure/i.test(text)
    )
      return "filling";
    if (/最初の拍|直後|first beats?|transient/i.test(text)) return "waveform";
    if (
      /後負荷|体血管抵抗|afterload|resistance|\bEa\b/i.test(text) &&
      /二つの収縮|能動張力|coupling|two contractil/i.test(text)
    )
      return "coupling";
    const matches = subjects.flatMap(([subject, pattern]) => {
      const match = pattern.exec(text);
      return match ? [{ subject, index: match.index }] : [];
    });
    if (matches.length)
      return matches.sort((a, b) => a.index - b.index)[0].subject;
    if (/PV|一拍|心周期|圧.?容積|cardiac.?cycle|pressure.?volume/i.test(text))
      return "cycle";
    if (/波形|waveform|pressure trace/i.test(text)) return "waveform";
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
function Label({
  children,
  x = 351,
  y = 38,
  tone,
}: {
  children: React.ReactNode;
  x?: number;
  y?: number;
  tone?: Tone;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      fill={tone ? color(tone) : "var(--art-label)"}
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
  const espvrTop = { x: v0 + (floor - 36) / ees, y: 36 };
  const eaTop = { x: edv - (floor - 42) / ea, y: 42 };
  return {
    origin: { x: v0, y: floor },
    eaOrigin: { x: edv, y: floor },
    espvrTop,
    eaTop,
    esv,
    end,
    loop: `M${edv} ${filling}V${end - 5}C${edv - span * 0.2} ${end - 32} ${esv + span * 0.16} ${end - 16} ${esv} ${end}V184C${esv + span * 0.35} 184 ${edv - span * 0.28} 184 ${edv} ${filling}Z`,
    espvr: `M${v0} ${floor}L${espvrTop.x} ${espvrTop.y}`,
    ea: `M${edv} ${floor}L${eaTop.x} ${eaTop.y}`,
  };
}
function Preload() {
  const base = pv({ edv: 270 }),
    changed = pv();
  return (
    <>
      <Axes />
      <Line d={base.espvr} tone="axis" width={2} />
      <Line d={base.loop} tone="baseline" reference width={3} />
      <Line d={changed.loop} fill />
      <Point x={base.esv} y={base.end} reference />
      <Point x={changed.esv} y={changed.end} />
    </>
  );
}
function Coupling({
  subject,
}: {
  subject: "contractility" | "afterload" | "coupling";
}) {
  const base = pv(),
    stronger = pv({ ees: 1.9 }),
    loaded = pv({ ea: 1.06 }),
    both = pv({ ees: 1.9, ea: 1.06 });
  const wedge = (
    origin: { x: number; y: number },
    first: { x: number; y: number },
    second: { x: number; y: number },
  ) =>
    `M${origin.x} ${origin.y}L${first.x} ${first.y}L${second.x} ${second.y}Z`;
  const contractility = subject !== "afterload",
    afterload = subject !== "contractility";
  return (
    <>
      <Axes />
      {contractility && (
        <path
          d={wedge(base.origin, base.espvrTop, stronger.espvrTop)}
          fill={color("primary")}
          opacity=".08"
        />
      )}
      {afterload && (
        <path
          d={wedge(base.eaOrigin, base.eaTop, loaded.eaTop)}
          fill={color(subject === "coupling" ? "secondary" : "primary")}
          opacity=".08"
        />
      )}
      <Line
        d={base.espvr}
        tone={contractility ? "baseline" : "secondary"}
        reference={contractility}
        width={contractility ? 2.5 : 3}
      />
      {contractility && <Line d={stronger.espvr} />}
      <Line
        d={base.ea}
        tone={afterload ? "baseline" : "secondary"}
        reference={afterload}
        width={afterload ? 2.5 : 3}
      />
      {afterload && (
        <Line
          d={loaded.ea}
          tone={subject === "coupling" ? "secondary" : "primary"}
        />
      )}
      <Point x={base.esv} y={base.end} reference />
      {contractility && <Point x={stronger.esv} y={stronger.end} />}
      {afterload && <Point x={loaded.esv} y={loaded.end} />}
      {subject === "coupling" && <Point x={both.esv} y={both.end} />}
      <Label x={230} y={27} tone={contractility ? "primary" : "secondary"}>
        ESPVR
      </Label>
      <Label
        x={341}
        y={181}
        tone={subject === "afterload" ? "primary" : "secondary"}
      >
        Ea
      </Label>
    </>
  );
}
function PvCycle() {
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
function Waveform() {
  return (
    <>
      <Axes x="t" />
      {[65, 197].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <Line
            d="M0 111C8 113 8 115 10 114C17 67 21 49 28 50C48 54 76 90 132 111"
            tone="secondary"
            width={3.5}
          />
          <Line
            d="M0 177C4 177 10 74 18 56C28 22 41 55 47 85C54 119 58 174 65 182C79 173 95 171 132 177"
            width={3.5}
          />
        </g>
      ))}
      <Label x={304} y={27} tone="primary">
        LV
      </Label>
      <Label x={348} y={27} tone="secondary">
        Ao
      </Label>
    </>
  );
}
function Cycle() {
  return (
    <>
      <g transform="translate(-3 25) scale(.5 .78)">
        <PvCycle />
      </g>
      <g transform="translate(189 25) scale(.55 .78)">
        <Waveform />
      </g>
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
function Relaxation() {
  const pressure = (tau: number) => (x: number) =>
    184 - 132 * Math.exp(-(x - 66) / tau);
  return (
    <>
      <Axes x="t" />
      <Line
        d={curve(pressure(62), 66, 337)}
        tone="baseline"
        reference
        width={3}
      />
      <Line d={curve(pressure(118), 66, 337)} />
      <Label>τ</Label>
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
            <PvCycle />
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
        subject === "coupling" ? (
        <Coupling subject={subject} />
      ) : subject === "preload" ? (
        <Preload />
      ) : subject === "starling" ? (
        <Starling />
      ) : subject === "equilibrium" ? (
        <Guyton />
      ) : subject === "filling" ? (
        <Filling />
      ) : subject === "relaxation" ? (
        <Relaxation />
      ) : subject === "waveform" ? (
        <Waveform />
      ) : subject === "respiration" ? (
        <Respiration />
      ) : (
        <Cycle />
      )}
    </svg>
  );
}
