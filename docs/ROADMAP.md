# CircleHeart / 0DSimDemo Roadmap

最終更新: 2026-06-07  
対象: `g960059/0DSimDemo` の現行実装、Web preview engine、official cases / lessons、将来の calibration / validation / UQ / accurate engine  
位置づけ: このファイルを、数理モデル・検証・UI/UX・ケース運用の **single source of truth** とする。古い計画書や会話ログよりも、このファイルを優先する。

---

## 0. 現在の結論

現在の repo は、もはや単なる「0D循環動態デモ」ではない。すでに以下を備えた **研究・教育用 physiology workbench** になっている。

- active-stress 型心腔を既定とする 0D closed-loop engine
- time-varying elastance fallback / 教材用比較経路
- 動的弁開閉、弁慣性、線形/二次損失、狭窄・逆流ノブ
- systemic / pulmonary の複数コンパートメント
- collapse / open / stiff 領域を持つ非線形静脈容量
- TBV ledger / projector / hemorrhage-fluid control
- 軽量な pericardium / septal coupling
- LAD / LCx / RCA の 3 territory coronary teaching model
- `PreviewController` + `previewWorker` + `transitionSteadyWorker`
- `CaseDocument` / `CaseInstance` / clinical knob mapping / versioned knob resolver
- official cases / official lessons / lesson playback / note rendering
- low-noise `SimulationHealth` UX と first-run model limitation modal
- baseline freeze、morphology gates、official case directionality tests

したがって、次の主戦場は **新しい病態を増やすことではなく、信頼性・検証可能性・構造分離を上げること**である。

直近の優先順位は次の通り。

1. ROADMAP / limitation text / docs を現行実装に同期する。
2. `ModelCore.ts` と `WorkbenchPage.tsx` を挙動不変で分割する。
3. `CaseSpec` を expected findings / structured limitations / validation metadata へ拡張する。
4. `ValidationReport` と `verify:cases` を作り、official case を機械的に検証する。
5. Python accurate engine prototype を作り、preview との cross-check を始める。
6. Calibration / UQ を normal + major official cases の最小セットで始める。
7. その後に dynamic Vu、PEEP精緻化、baroreflex、PH/RV failure/tamponade、coronary validation、organ beds、AI authoring を進める。

---

## 1. 基本方針

### 1.1 Source of truth

- **Engine が計算の真実**である。
- **Validator が表示・共有・公開の門番**である。
- **LLM は planner / writer / UI composer** であり、simulation source of truth ではない。
- LLM/import/manual raw patch は、必ず review / sanitize / validation を通す。

### 1.2 Preview と Accurate を分ける

- Preview engine: TypeScript / Web Worker / fixed step / realtime response 優先。
- Accurate engine: Python or native / Radau-BDF-LSODA-CVODE候補 / validation・calibration・UQ優先。
- UI の滑らかさと、研究検証用の数値精度を同一 solver に背負わせない。

### 1.3 Case は parameter set ではなく educational document

`CaseDocument` は単なる raw parameter dump ではない。最低限、次を持つべきである。

- 何を見せたいか
- どの branch / instance を比較するか
- 期待される変化方向
- どの morphology gate を通るか
- どの限界があるか
- どの version の engine / knob mapping / solver で解決されるか

### 1.4 Validation の優先順位

絶対値の完全一致よりも、次の順で重視する。

1. Numerical safety: NaN/Inf なし、状態有限、破綻しない。
2. Invariants: TBV drift、左右CO balance、弁開閉、projector quiet、clamp hit。
3. Morphology: LA/RA figure-eight、MV/TV inflow、PVF S/D/Ar、PV loop shape、valve gradient direction。
4. Directionality: 介入・病態による CO/MAP/LAP/RAP/PAP/SV/EF の方向。
5. Calibration: 文献・臨床レンジとの整合。
6. UQ: parameter uncertainty と output uncertainty。

---

## 2. 現在地点: 実装ステータス

凡例: ✅ 実装済み / 🟡 実装済みだが検証・整理不足 / ❌ 未実装 / ⚠️ 実装済みだが負債あり

| ID | 領域 | 現在の実装 | 判定 | 次にやること |
|---|---|---|:---:|---|
| S0 | Baseline freeze / regression | `engine/harness.ts`, `engine/__tests__/baseline.test.ts`, snapshot。TBV drift、弁開閉、LA/RA morphology、PVF、右心 gate あり | ✅ | gate を ValidationReport に接続 |
| S1 | Health UX | `SimulationHealth`, `HealthBadge`, `HealthToasts`, low-noise表示あり | ✅ | health report を case validation に再利用 |
| S1b | Model limitation UX | `components/ModelLimitations.tsx` の first-run modal + info button あり | 🟡 | 文言が古い。coronary実装済み等に同期し、structured limitationへ移行 |
| S2 | Chamber plugin / active-stress default | `engine/chambers.ts`, active-stress default, elastance fallback | ✅ | `f_iso` / active model parameter provenance の整理 |
| S3 | Preview hardening | `PreviewController`, `previewWorker`, `transitionSteadyWorker`, buffer, transition steady | ✅ | worker protocol のテスト拡張、performance budget の明文化 |
| M4 | Clinical knobs | `engine/knobs.ts`, versioned `KNOB_MAPPING_VERSION`, no silent fallback | ✅ | knob metadata / safe range / review range を UI と validation に接続 |
| M4b | CaseDocument | `caseDoc.ts`, knob-primary save/load, schemaVersion, workspace, notes, lesson | ✅ | expected findings / structured limitations / validation summary を追加 |
| M4c | Intervention provenance | named interventions はあるが、再保存時に effective knobs へ flatten される | ⚠️ | `interventionStack` と `resolvedKnobs` を分ける |
| M5 | Venous / fluids | target TBV、bleed/fluid ledger、TBV projector、非線形静脈容量あり | 🟡 | true dynamic Vu を導入。`tau_u * dVu/dt = Vu_target - Vu` |
| M6 | Respiratory / PEEP | Pth/Palv/PEEP/resp signals はある | 🟡 | PEEP→Pth/Palv係数、pulmonary waterfall/RLC の文献整合 |
| M7 | Accurate engine | なし | ❌ | Python `solve_ivp(Radau/BDF/LSODA)` prototype |
| M8 | Baroreflex | `baroreflexEnabled` は knob にあるが unmapped | ❌ | MAP low-pass → HR/SVR/venous tone/contractility を段階導入 |
| M9 | Pericardium / septum | lightweight pericardium/septal coupling 実装済み | 🟡 | PH/RV failure/tamponade case と validation。TriSeg-lite は後 |
| M10 | Data-driven topology / organ beds | topology は `buildNodes/buildEdges` ハードコード | ❌ | topology DSL / graph schema へ移行後、organ beds |
| M11 | Coronary | LAD/LCx/RCA teaching model 実装済み | 🟡 | validation/caveat/lesson化。虚血予測ではなく teaching pane として整理 |
| M12 | Calibration / UQ | measurement harness はあるが optimizer/UQ なし | ❌ | ValidationReport → objective function → Morris/Sobol |
| M13 | Case branch / lessons | official cases/lessons/workbench/note/authoring がある | 🟡 | official case を validation badge 付きにする |
| M14 | AI-native authoring | なし | ❌ | validation gate 後。LLM patch は `requiresReview:true` |
| M15 | i18n | README ja/en はあるが app/content i18n は未整理 | ❌ | UI chrome から導入。signal IDs は翻訳しない |

---

## 3. 直近の開発キュー

### P0: Documentation sync / limitation sync

目的: 現行実装とドキュメントのズレをなくす。

Tasks:

- `docs/ROADMAP.md` を現行実装へ更新する。
- `components/ModelLimitations.tsx` の文言を現行実装へ合わせる。
  - coronary は「未実装」ではなく「0D teaching modelとして実装済み、局所虚血や詳細冠動脈樹は不可」と書く。
  - pericardium/septum も「未実装」ではなく「lightweight model、TriSegではない」と書く。
- README / README.en / docs/research の current status を合わせる。
- 古い「Workerは不要/遅延」系記述を削除または historical に移動。

Acceptance:

- README, ROADMAP, UI limitation modal が同じ現在地を述べている。
- 「実装済みの機能を未実装と書く」記述がない。
- 「未検証なのにvalidatedと読める」記述がない。

---

### P1: `ModelCore.ts` behavior-neutral decomposition

目的: 新しい病態を足す前に、engine を検証可能な単位へ分ける。

推奨分割:

```text
engine/core/
  ModelCore.ts              # public facade only
  topology.ts               # node/edge definitions, name/index layout
  pressureLaws.ts           # node pressure-volume laws
  flowLaws.ts               # resistive/dynamic/valve flow laws
  valveDynamics.ts          # xi dynamics and valve effective losses
  tbvProjector.ts           # TBV ledger/projector
  observables.ts            # sample/debug observables
  metrics.ts                # SimMetrics
  health.ts                 # SimulationHealth
  beatFingerprint.ts        # per-beat summaries and steady detection bridge
  integrators/
    heun.ts
    rk4.ts                  # optional, for preview comparison only
```

Rules:

- 挙動不変PRにする。
- baseline snapshot と morphology tests を全通過させる。
- 数式・パラメータを変えない。
- import path の public compatibility を保つ。

Acceptance:

- `npm run test` が通る。
- baseline summary snapshot が変わらない。
- `ModelCore.ts` は facade + orchestration に近づく。

---

### P2: `WorkbenchPage.tsx` decomposition

目的: Workbench route が、simulation / persistence / panel layout を全部抱える状態をやめる。

推奨分割:

```text
features/workbench/
  WorkbenchRoute.tsx
  WorkbenchShell.tsx
  useWorkbenchSimulation.ts
  useWorkbenchScene.ts
  useWorkbenchPersistence.ts
  useWorkbenchPanels.ts
  useWorkbenchTheme.ts
```

Rules:

- 先に分割だけ。UI redesign を混ぜない。
- route/load/save/publish/simulation/panels の責務を明確にする。
- WorkbenchPage の肥大化を止める。

Acceptance:

- ユーザー操作の挙動が変わらない。
- official case load、local import/export、cloud save、lesson save/publish、panel add/remove が既存テストで守られる。

---

### P3: Structured case validation

目的: official case を「文章でそう書いてある」から「機械的に期待所見を検査できる」状態へ移す。

追加する型の方向性:

```ts
export type ExpectedFinding = {
  id: string;
  description: string;
  instanceId: string;
  comparatorInstanceId?: string;
  metric?: keyof SimMetrics;
  observable?: keyof SimSample;
  direction: "up" | "down" | "unchanged" | "present" | "absent";
  tolerance?: number;
  gate: "smoke" | "teaching" | "validation";
};

export type StructuredModelLimitation = {
  id: string;
  category: "0d" | "uncalibrated" | "missing-reflex" | "valve" | "coronary" | "pericardium" | "numerical" | "ui";
  severity: "info" | "caution" | "hard-limit";
  message: string;
  affects: string[];
  surfaceInUi: boolean;
};

export type ValidationReport = {
  schemaVersion: 1;
  generatedAt: number;
  modelVersion: string;
  engineVersion: string;
  knobMappingVersion: string;
  caseId: string;
  solver: SolverConfig;
  settleStatusByInstance: Record<string, SettleStatus>;
  healthByInstance: Record<string, SimulationHealth>;
  metricsByInstance: Record<string, SimMetrics>;
  expectedFindings: ExpectedFindingResult[];
  morphologyGates: MorphologyGateResult[];
  limitations: StructuredModelLimitation[];
  verdict: "pass" | "warning" | "fail";
};
```

Tasks:

- `CaseSpec` に `expectedFindings`, `structuredLimitations`, `validationProfile` を追加。
- `officialCases.ts` の各caseに expected findings を付ける。
- `tools/verifyCases.ts` を作る。
- `npm run verify:cases` を追加。
- JSON と Markdown report を `docs/validation/generated/` へ出すか、CI artifact 化する。

Acceptance:

- official cases が validation report を生成できる。
- report なしの official case は publish/official registry に入れない。
- validation は「正常値から外れる」ではなく「そのcaseの期待所見を満たすか」を判定する。

---

### P4: Accurate engine prototype

目的: preview solver の妥当性を、別 solver で cross-check する。

方針:

- 最初は Python でよい。
- `solve_ivp` の `Radau`, `BDF`, `LSODA` を比較する。
- TypeScript engine と完全同一UIに統合しない。
- validation/calibration 用の offline tool として作る。

推奨構成:

```text
accurate/
  README.md
  pyproject.toml
  circleheart_model/
    params.py
    topology.py
    rhs.py
    measure.py
    solve.py
  scripts/
    run_case.py
    compare_preview.py
```

Acceptance:

- normal baseline で preview と accurate の MAP/CO/SV/PAP/LAP が許容誤差内。
- stiff-ish cases、例: severe valve lesion / high PEEP / PH-like state で solver failure を検出できる。
- preview と accurate の差分を Markdown report へ出せる。

---

### P5: Calibration / UQ minimal

目的: 「それっぽい」から「どの程度信用できるか」へ移る。

最初の対象:

- normal-sinus
- acute-anterior-mi
- systolic-heart-failure
- diastolic-heart-failure
- aortic-stenosis
- valve-lesions: MR
- hypovolemia

最初の出力:

- MAP / SBP / DBP
- CO / SV / EF
- RAP / LAP / PAP / LVEDP
- LV/RV PV loop width/height/area
- LA/RA figure-eight score
- MV/TV E/A pattern
- PVF S/D/Ar pattern
- coronary total flow / diastolic fraction / FFR-like index, if coronary case

方針:

- calibration はまず metric fitting ではなく morphology + directionality を守る。
- objective function は weighted multi-objective にする。
- UQ は最初は Morris screening、次に Sobol。
- UIには uncertainty を過剰表示しない。validation badge / caveat / report link でよい。

Acceptance:

- `docs/validation/` に case別 calibration target / achieved / caveat が残る。
- parameter confidence が低いcaseは UI でも `indicative` と表示される。

---

### P6: Venous / respiratory refinement

目的: preload、PEEP、出血/輸液の教育価値を上げる。

Tasks:

- dynamic unstressed volume:

```text
tau_u * dVu/dt = Vu_target(knobs, reflex, intervention) - Vu
```

- systemic venous / VC / pulmonary venous group に段階導入。
- `bleedRate` / `fluidRate` を static target TBV だけでなく dynamic ledger として lesson に使う。
- PEEP→Pth/Palv 係数を literature target / validation report に載せる。
- pulmonary waterfall/RLC を整理。

Acceptance:

- fluid bolus で venous stressed volume と CO が妥当方向へ動く。
- hemorrhage で uncompensated shock が再現される。
- PEEP↑で venous return低下、RAP/LAP transmural interpretation が破綻しない。

---

### P7: Baroreflex MVP

目的: shock / hemorrhage / vasopressor / anesthetic physiology の教育価値を上げる。

段階導入:

1. MAP low-pass sensor
2. HR response
3. systemic resistance response
4. venous tone response
5. contractility response
6. per-case disable / uncompensated mode

Rules:

- まず slow response。速すぎる reflex は入れない。
- official cases は `uncompensated` / `compensated` を明示的に分ける。
- `baroreflexEnabled` knob を実際に mapping する。

Acceptance:

- MAP低下で HR/SVR/venous tone が上がる。
- high MAP で逆方向に動く。
- response time が数拍〜数十秒スケールで、beat-to-beatに暴れない。

---

### P8: Disease depth after validation

ValidationReport が入った後に、次の病態を追加する。

優先順:

1. PH / RV pressure overload
2. RV failure / RV infarction
3. Tamponade / pericardial constraint
4. PEEP / ventilation hemodynamics
5. AS/MR/MS/AR/TR の lesion-specific lessons
6. Coronary supply-demand lesson
7. Sepsis / vasoplegia
8. Anesthesia-induced hypotension
9. VAD / IABP / Impella / ECMO は後段

Rules:

- 新しい official case は expected findings と limitations なしに追加しない。
- 新しい physiology subsystem は morphology/invariant gate なしに default-on にしない。

---

### P9: AI-native authoring / MCP / Community

これは後回し。現時点で先にやると危険。

実装条件:

- ValidationReport がある。
- `ParameterPatchEnvelope` がある。
- LLM/import/manual patch が `requiresReview:true` で処理される。
- public/shared case に validation status が表示される。

禁止:

- LLM が raw params を直接 engine に反映する。
- validation なしで official/community case として公開する。
- AI の説明文を engine output より優先する。

---

## 4. Version plan

| Version | 内容 | 状態 |
|---|---|---|
| v0.1 | 初期 0D closed-loop preview / dynamic valves / nonlinear vessels | historical |
| v0.2 | active-stress chamber MVP / elastance fallback / basic knobs | mostly done |
| v0.3 | stabilization: health, baseline, morphology gates, PreviewController | mostly done |
| v0.4 | CaseDocument / official cases / lessons / Workbench authoring / Worker transition steady | current |
| v0.5 | behavior-neutral refactor + Structured ValidationReport | next |
| v0.6 | accurate engine prototype + preview-vs-accurate cross-check | planned |
| v0.7 | calibration / UQ minimal for official cases | planned |
| v0.8 | venous/respiratory/baroreflex refinement | planned |
| v0.9 | PH/RV/tamponade/coronary validated lessons + topology DSL preparation | planned |
| v1.0 | validated educational physiology studio with official case QA and exportable reports | target |

---

## 5. 技術的負債レジスタ

| ID | 負債 | 影響 | 返済先 | 状態 |
|---|---|---|---|---|
| D1 | `lvTmaxScale=4.5` 魔法定数 | scale解釈が不明瞭 | S2b | ✅ 解消済み |
| D2 | `f_iso` / active-stress の一部 ad-hoc 項 | 力-長さ依存の根拠が弱い | P5 | 🟡 保留。calibration後に判断 |
| D3 | 広範な derivative/state clamp | clamp発火中は方程式が歪む | P1/P4 | 🟡 monitor + accurate solver比較 |
| D4 | React内 simulation loop | UI/engine責務混在 | S3 | ✅ PreviewControllerで概ね解消 |
| D5 | chamber model switch hardcode | chamber差し替え困難 | S2 | ✅ plugin化済み |
| D6 | topology hardcode | organ beds/MCS/ECMO追加が重い | M10 | ❌ 未返済 |
| D7 | health UI未接続 | 破綻が見えない | S1 | ✅ HealthBadge/Toastあり |
| D8 | model limitation表示なし | 安全・説明責任不足 | S1 | ✅ modalあり。ただし文言更新が必要 |
| D9 | regression tests不足 | 拡張で静かに破綻 | S0 | ✅ baseline/morphology/official case testsあり |
| D10 | PEEP係数の根拠不足 | ventilation hemodynamics の定量不明 | P6 | ❌ 未返済 |
| D11 | `ModelCore.ts` 肥大化 | 数理検証・差分レビューが困難 | P1 | ❌ 未返済 |
| D12 | `WorkbenchPage.tsx` 肥大化 | UI変更が persistence/simulation を巻き込みやすい | P2 | ❌ 未返済 |
| D13 | ModelLimitations文言が現行実装とズレる | coronary/pericardium等の説明が不正確 | P0 | ❌ 未返済 |
| D14 | intervention provenance flatten | case再保存で「何を投与したか」が消える | P3 | ❌ 未返済 |
| D15 | accurate engineなし | preview solver の外部検証ができない | P4 | ❌ 未返済 |
| D16 | UQなし | parameter uncertainty が見えない | P5 | ❌ 未返済 |
| D17 | i18n設計未整理 | 海外展開時にcase/lesson移行が重い | M15 | ❌ 未返済 |

---

## 6. Acceptance criteria

### 6.1 Core engine

- NaN/Inf が出ない。
- TBV drift < 0.1% / 60s, projector off の生保存で確認する。
- projector on/off の意味を report に明示する。
- left/right forward CO mismatch が許容範囲内。
- clamp hit が report される。clamp hit が多いcaseは validation warning。

### 6.2 Valves

- 0 <= xi <= 1。
- 各弁が実際に開閉する。
- normal regurgitation fraction は negligible。
- stenosis で forward flow / gradient direction が妥当。
- regurgitation で reverse flow / chamber pressure direction が妥当。
- severe lesion で volume floor / degenerate EF に落ちない。

### 6.3 Atria / filling

- LA/RA PV loop が figure-eight morphology を持つ。
- MV/TV inflow が E/A を持ち、3峰性に退行しない。
- PVF が S/D/Ar として読める。
- atrial timing が ventricular phase と整合する。

### 6.4 Official cases

- displayable case は model limitations を持つ。
- all instances が finite/non-degenerate settled state に到達する。
- expected findings を満たす。
- validation report を生成できる。
- official case 追加時は tests と limitation を同PRに含める。

### 6.5 Preview / Worker

- normal + 3 instances + speed 5x で UI が固まらない。
- transition steady job が古い結果を promote しない。
- worker failure 時に sync fallback できる。
- phase alignment が比較UIで破綻しない。

### 6.6 Accurate engine

- normal baseline で preview と MAP/CO/SV/PAP/LAP が許容誤差内。
- dt sensitivity report を出せる。
- solver failure / non-convergence を明示できる。

### 6.7 AI / import safety

- unknown knobMappingVersion は silent fallback しない。
- unknown schemaVersion は migrationなしに読み込まない。
- import/LLM/manual raw patch は sanitize + review + validation を通す。
- public/official化には validation report が必要。

---

## 7. i18n方針

当初ユーザーの大半が日本人であっても、今から最低限の i18n 境界を作る。

方針:

- signal ID / metric ID / case ID は翻訳しない。
- display label / note / lesson body / model limitation は翻訳対象。
- `CaseDocument` には将来 `locale`, `fallbackLocale`, `translations` を入れられるようにする。
- 最初に UI chrome を i18n 化し、official lesson/case 本文は後でよい。
- 日本語 primary、英語 secondary でよいが、schema は locale-aware にする。

禁止:

- `LVP`, `AoP`, `CO`, `SV`, `LVEDP` などの内部IDを翻訳する。
- 翻訳済み本文だけに validation/caveat を埋め込み、structured limitation と乖離させる。

---

## 8. 実装上の禁止事項

1. React component 内に simulation equation を書かない。
2. engine 数式変更と UI redesign を同じPRに混ぜない。
3. baseline snapshot 変化を「たぶん大丈夫」で更新しない。理由を書く。
4. `KNOB_RESOLVERS` の既存 version を破壊的に変更しない。新versionを追加する。
5. unknown schema / unknown knob mapping を silent fallback しない。
6. model limitation なしに case / lesson / public share を出さない。
7. raw parameter を初学者向けUIの主役にしない。
8. LLM patch を validation なしに engine へ反映しない。
9. public/community機能を validation gate より先に拡張しない。
10. 新しい生理 subsystem を morphology/invariant gate なしに default-on にしない。

---

## 9. 直近の結論

次にやるべきことは、機能追加ではなく **信頼できる workbench への昇格**である。

最短ルート:

1. P0: limitation/doc sync
2. P1: `ModelCore.ts` 分割
3. P2: `WorkbenchPage.tsx` 分割
4. P3: Structured ValidationReport
5. P4: Accurate engine prototype
6. P5: Calibration / UQ minimal
7. P6以降: dynamic Vu / PEEP / baroreflex / disease depth
8. 最後に AI-native authoring / Community / MCP

この順なら、リアルタイムWebアプリとしての軽快さを維持しつつ、研究・教育用として説明責任を持てるプロダクトへ進められる。
