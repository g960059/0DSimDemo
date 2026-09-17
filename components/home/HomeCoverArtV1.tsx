import React from "react";
import type { HomeItemV1 } from "./HomeDiscoveryV1";

/** Editorial illustrations, not charts or calculated output from the content. */
export function homeCoverSubjectV1(
  item: Pick<HomeItemV1, "kind" | "title" | "description">,
) {
  if (item.kind === "course") return "course";
  const text = `${item.title} ${item.description}`;
  if (/Guyton|循環平衡|equilibrium/i.test(text)) return "equilibrium";
  if (/Starling|スターリング/i.test(text)) return "starling";
  if (/呼吸|PEEP|respira/i.test(text)) return "respiration";
  if (/硬さ|弛緩|充満圧|relaxation|stiffness/i.test(item.title))
    return "filling";
  if (/後負荷|抵抗|afterload|resistance/i.test(item.title)) return "afterload";
  if (/収縮|contractil/i.test(item.title)) return "contractility";
  if (/血液量|前負荷|preload|blood volume/i.test(text)) return "preload";
  return "cycle";
}
function Heart({
  x = 200,
  y = 108,
  scale = 1,
}: {
  x?: number;
  y?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 53C-10 48-60 15-60-17C-60-46-23-56 0-30C23-56 60-46 60-17C60 15 10 48 0 53Z"
        fill="var(--art-coral)"
      />
      <path
        d="M0-30C23-56 60-46 60-17C60 15 10 48 0 53Z"
        fill="var(--art-rose)"
      />
      <path
        d="M-24-18C-34-18-39-12-38-3"
        stroke="var(--art-paper)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        opacity=".8"
      />
    </g>
  );
}
export function HomeCoverArtV1({ item }: { item: HomeItemV1 }) {
  const subject = homeCoverSubjectV1(item);
  return (
    <svg
      className={`home-cover-art home-art-${subject}`}
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="240" fill="var(--art-bg)" />
      <circle cx="334" cy="36" r="112" fill="var(--art-wash)" />
      <circle cx="51" cy="211" r="68" fill="var(--art-wash)" opacity=".7" />
      {subject === "course" ? (
        <>
          <path
            d="M70 66Q142 48 200 77Q258 48 330 66V195Q260 177 200 205Q140 177 70 195Z"
            fill="var(--art-blue)"
            opacity=".28"
          />
          <path
            d="M82 55Q145 42 200 70V190Q148 166 82 180Z"
            fill="var(--art-paper)"
          />
          <path
            d="M200 70Q255 42 318 55V180Q253 166 200 190Z"
            fill="var(--art-paper)"
          />
          <path
            d="M200 74V186"
            stroke="var(--art-blue)"
            strokeWidth="3"
            opacity=".3"
          />
          <Heart x={202} y={99} scale={0.64} />
          <path
            d="M106 137H147M107 150H162M239 149H291M256 136H291"
            stroke="var(--art-blue)"
            strokeWidth="6"
            strokeLinecap="round"
            opacity=".35"
          />
          <circle cx="63" cy="66" r="10" fill="var(--art-coral)" />
          <circle cx="330" cy="189" r="7" fill="var(--art-blue)" />
        </>
      ) : subject === "afterload" ? (
        <>
          <path
            d="M54 72H137Q164 72 176 96H235Q247 72 270 72H346V168H270Q247 168 235 144H176Q164 168 137 168H54Z"
            fill="var(--art-coral)"
            opacity=".28"
          />
          <path
            d="M54 94H133Q158 94 172 109H240Q254 94 274 94H346V146H274Q254 146 240 131H172Q158 146 133 146H54Z"
            fill="var(--art-paper)"
          />
          {[83, 116, 195, 225, 283, 321].map((x, i) => (
            <ellipse
              key={x}
              cx={x}
              cy={i % 2 ? 126 : 115}
              rx="10"
              ry="6"
              fill="var(--art-coral)"
              transform={`rotate(-15 ${x} 120)`}
            />
          ))}
          <path
            d="M206 55V86M197 77L206 86L215 77M206 186V155M197 164L206 155L215 164"
            stroke="var(--art-blue)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      ) : subject === "preload" ? (
        <>
          <rect
            x="65"
            y="51"
            width="97"
            height="132"
            rx="20"
            fill="var(--art-blue)"
            opacity=".2"
          />
          <path
            d="M75 107Q114 92 152 107V159Q152 173 138 173H89Q75 173 75 159Z"
            fill="var(--art-blue)"
          />
          <path
            d="M162 134H198V166H249"
            stroke="var(--art-blue)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity=".7"
          />
          <Heart x={273} y={107} scale={0.8} />
          <path
            d="M112 43C112 43 98 63 98 70A14 14 0 0 0 126 70C126 63 112 43 112 43Z"
            fill="var(--art-blue)"
          />
          <path
            d="M222 156L233 166L222 176"
            stroke="var(--art-paper)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      ) : subject === "contractility" ? (
        <>
          <circle cx="200" cy="119" r="85" fill="var(--art-paper)" />
          <Heart y={113} scale={0.83} />
          <g
            stroke="var(--art-blue)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <path d="M77 117H121L109 105M121 117L109 129M323 117H279L291 105M279 117L291 129M200 23V52L188 40M200 52L212 40M200 218V189L188 201M200 189L212 201" />
          </g>
        </>
      ) : subject === "filling" ? (
        <>
          <ellipse
            cx="201"
            cy="120"
            rx="103"
            ry="89"
            fill="var(--art-blue)"
            opacity=".19"
          />
          <ellipse cx="201" cy="120" rx="83" ry="70" fill="var(--art-paper)" />
          <Heart y={115} scale={0.76} />
          <path
            d="M60 119H105M295 119H340M90 109L105 119L90 129M310 109L295 119L310 129"
            fill="none"
            stroke="var(--art-blue)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M131 54Q202 7 271 56"
            fill="none"
            stroke="var(--art-coral)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".65"
          />
        </>
      ) : subject === "starling" ? (
        <>
          <Heart x={110} y={121} scale={0.61} />
          <Heart x={276} y={109} scale={1.05} />
          <path
            d="M163 126H202M189 114L202 126L189 138"
            fill="none"
            stroke="var(--art-blue)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M72 190H146M211 190H341"
            stroke="var(--art-blue)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity=".3"
          />
          <circle cx="89" cy="51" r="7" fill="var(--art-blue)" />
          <circle
            cx="328"
            cy="49"
            r="10"
            fill="var(--art-coral)"
            opacity=".6"
          />
        </>
      ) : subject === "equilibrium" ? (
        <>
          <path
            d="M174 60H101Q57 60 57 120Q57 180 101 180H174"
            fill="none"
            stroke="var(--art-blue)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M226 60H299Q343 60 343 120Q343 180 299 180H226"
            fill="none"
            stroke="var(--art-coral)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <Heart y={112} scale={0.73} />
          <path
            d="M114 49L127 60L114 71M286 169L273 180L286 191"
            fill="none"
            stroke="var(--art-paper)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : subject === "respiration" ? (
        <>
          <path
            d="M183 69C173 36 122 54 100 110C77 168 123 197 168 173C184 164 180 101 183 69Z"
            fill="var(--art-blue)"
          />
          <path
            d="M217 69C227 36 278 54 300 110C323 168 277 197 232 173C216 164 220 101 217 69Z"
            fill="var(--art-blue)"
            opacity=".65"
          />
          <path
            d="M200 38V99L146 137M200 99L254 137"
            fill="none"
            stroke="var(--art-paper)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Heart x={201} y={162} scale={0.38} />
        </>
      ) : (
        <>
          <path
            d="M118 53C64 74 58 151 118 187"
            fill="none"
            stroke="var(--art-blue)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M282 187C336 166 342 89 282 53"
            fill="none"
            stroke="var(--art-coral)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <Heart y={111} scale={0.97} />
          <path
            d="M101 176L118 187L120 166M299 64L282 53L280 74"
            fill="none"
            stroke="var(--art-paper)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="204" cy="30" r="7" fill="var(--art-blue)" opacity=".6" />
          <circle
            cx="205"
            cy="204"
            r="6"
            fill="var(--art-coral)"
            opacity=".6"
          />
        </>
      )}
    </svg>
  );
}
