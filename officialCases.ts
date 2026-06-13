// Official lesson cases (milestone #3-d). Static, in-repo CaseDocuments authored
// purely on the "active-normal" baseline via clinical knobs / named interventions
// (no raw params), each carrying mandatory model limitations. These drive the
// Official Cases / Learning Path pages offline (#3-f) and are the M12-lite
// waveform-shape gate's subjects (#3-e).
//
// NOTE on round-trip: these load cleanly, but the Workbench is knob-primary, so
// loading a case and re-Saving it FLATTENS named interventions into their
// effective clinical knobs (CaseInstance.interventions becomes []). The resolved
// physiology is identical; only the intervention provenance is lost. That is by
// design for #3 — intervention-preserving editing is a later milestone.

import type { CaseDocument, CaseExposedController, CaseInstance, CaseReadingManifest } from "@/caseDoc";
import { CASE_SCHEMA_VERSION, ENGINE_VERSION, DEFAULT_SOLVER, defaultWorkspaceForPanels } from "@/caseDoc";
import type { ExpectedFinding, StructuredModelLimitation } from "@/caseValidation";
import { buttonOptionsFromRange } from "@/controllerItems";
import { KNOB_MAPPING_VERSION } from "@/engine/knobs";
import type { GraphBoardLayout, ViewSpec } from "@/features/workbench/viewSpec";
import { defaultControllerItemFor } from "@/knobMetadata";
import type { NoteContent } from "@/noteTypes";
import type { ControllerItem, PanelDef } from "@/types";

const COLORS = ["#a855f7", "#f472b6", "#22c55e", "#38bdf8", "#fbbf24"];

/** A standard teaching layout (note + waveforms + PV loop + controls + metrics),
 *  with a per-instance config entry for every instance in the case. */
function buildPanels(instanceIds: string[]): PanelDef[] {
  const cfg = (signals: string[]) => Object.fromEntries(instanceIds.map((id) => [id, { visible: true, selectedSignals: signals }]));
  return [
    { id: "p_note", type: "NOTE", title: "Interactive Notes", w: 4, h: 10, config: {}, isSettingsOpen: false },
    // Surface LAP so the filling-pressure / v-wave story each lesson tells is
    // actually visible; metrics carry SV alongside ABP/CO/CVP.
    { id: "p1", type: "WAVEFORM", title: "Waveforms", w: 5, h: 6, config: cfg(["LVP", "AoP", "LAP"]), isSettingsOpen: false, timeWindow: 5000 },
    { id: "p2", type: "PVLOOP", title: "PV Loop", w: 3, h: 6, config: cfg(["LV"]), isSettingsOpen: false, showGuides: true },
    { id: "p4", type: "CONTROLS", title: "Controls", w: 4, h: 4, config: cfg(["clinical", "Global", "fluids"]), isSettingsOpen: false },
    { id: "p3", type: "METRICS", title: "Metrics", w: 4, h: 4, config: cfg(["ABP", "CO", "SV", "CVP"]), isSettingsOpen: false },
  ];
}

type InstanceAuthor = Pick<CaseInstance, "name" | "knobs" | "interventions" | "targetVolume">;
type CaseAuthor = {
  id: string;
  title: string;
  description: string;
  modelLimitations: string[];
  instances: InstanceAuthor[];
  notes?: Record<string, NoteContent>;
  views?: ViewSpec[];
  graphBoardLayout?: GraphBoardLayout;
  initialActiveScenarioId?: string;
  reading?: CaseReadingManifest;
  exposedControllers?: CaseExposedController[];
  expectedFindings?: ExpectedFinding[];
  structuredLimitations?: StructuredModelLimitation[];
  validationProfileId?: string;
};

function instance(i: number, a: InstanceAuthor): CaseInstance {
  return {
    id: String(i + 1),
    name: a.name,
    color: COLORS[i % COLORS.length],
    isVisible: true,
    baseline: "active-normal",
    knobs: a.knobs,
    interventions: a.interventions,
    rawPatch: {},
    targetVolume: a.targetVolume,
  };
}

function makeCase(p: CaseAuthor): CaseDocument {
  const instances = p.instances.map((a, i) => instance(i, a));
  const panels = buildPanels(instances.map((x) => x.id));
  return {
    schemaVersion: CASE_SCHEMA_VERSION,
    defaultLocale: "en",
    availableLocales: ["en"],
    engineVersion: ENGINE_VERSION,
    knobMappingVersion: KNOB_MAPPING_VERSION,
    solver: DEFAULT_SOLVER,
    meta: { id: p.id, title: p.title, author: "CircleHeart", createdAt: 0, updatedAt: 0 },
    spec: {
      title: p.title,
      description: p.description,
      modelLimitations: p.modelLimitations,
      ...(p.expectedFindings ? { expectedFindings: p.expectedFindings } : {}),
      ...(p.structuredLimitations ? { structuredLimitations: p.structuredLimitations } : {}),
      ...(p.validationProfileId ? { validationProfileId: p.validationProfileId } : {}),
    },
    instances,
    panels,
    workspace: defaultWorkspaceForPanels(panels),
    ...(p.views ? { views: p.views } : {}),
    ...(p.graphBoardLayout ? { graphBoardLayout: p.graphBoardLayout } : {}),
    ...(p.initialActiveScenarioId ? { initialActiveScenarioId: p.initialActiveScenarioId } : {}),
    ...(p.notes ? { notes: p.notes } : {}),
    ...(p.reading ? { reading: p.reading } : {}),
    ...(p.exposedControllers ? { exposedControllers: p.exposedControllers } : {}),
    i18n: {
      en: {
        title: p.title,
        description: p.description,
        modelLimitations: p.modelLimitations,
        ...(p.notes ? { notes: p.notes } : {}),
        panels: Object.fromEntries(panels.map((panel) => [panel.id, { title: panel.title }])),
        instances: Object.fromEntries(instances.map((item) => [item.id, { name: item.name }])),
      },
    },
  };
}

const LIMIT_GENERAL = "0D lumped-parameter closed-loop model — no spatial flow, regional wall motion, or pulsatile wave reflection physics.";
const LIMIT_CALIB = "Active-stress single-fibre ventricles; parameters are not yet calibrated (M12), so absolute metric values are indicative, not validated — read the waveform SHAPE.";
const LIMIT_NOREFLEX = "No dynamic baroreflex / neurohormonal control — shock and hypovolemia are shown as UNCOMPENSATED states; any reflex tachycardia/vasoconstriction is only what an intervention explicitly encodes.";

type ExpectedMetric = NonNullable<ExpectedFinding["metric"]>;

function metricDirection(
  id: string,
  metric: ExpectedMetric,
  instanceId: string,
  comparatorInstanceId: string,
  direction: "up" | "down" | "unchanged",
  description: string,
  tolerance = 0,
): ExpectedFinding {
  return { id, description, instanceId, comparatorInstanceId, metric, direction, tolerance, gate: "teaching" };
}

function metricRange(
  id: string,
  metric: ExpectedMetric,
  instanceId: string,
  range: NonNullable<ExpectedFinding["range"]>,
  description: string,
): ExpectedFinding {
  return { id, description, instanceId, metric, range, gate: "teaching" };
}

// --- BlockNote authoring helpers (shapes verified against components/NotePanel.tsx
//     renderStaticBlock + BlockNoteSchema). Reading-mode renders heading/paragraph/
//     bulletListItem text, equation as mono/KaTeX, and the quiz QUESTION only. ---
const h = (text: string): Record<string, unknown> => ({ type: "heading", content: [{ type: "text", text, styles: {} }] });
const p = (text: string): Record<string, unknown> => ({ type: "paragraph", content: [{ type: "text", text, styles: {} }] });
const li = (text: string): Record<string, unknown> => ({ type: "bulletListItem", content: [{ type: "text", text, styles: {} }] });
const eq = (tex: string): Record<string, unknown> => ({ type: "equation", props: { tex } });
const quiz = (question: string, options: string, answerIndex: string): Record<string, unknown> => ({ type: "quiz", props: { question, options, answerIndex } });
const viewRef = (viewId: string): Record<string, unknown> => ({ type: "view_ref", props: { viewId } });

function buttonGroupItem(paramKey: string): ControllerItem {
  const item: ControllerItem = { ...defaultControllerItemFor(paramKey), kind: "buttonGroup" };
  return { ...item, options: buttonOptionsFromRange(item) };
}

const NORMAL_REFERENCE_NOTE: NoteContent = [
  h("The normal operating point"),
  p("Before you can recognize a sick heart, you need a clear picture of a healthy one at rest. This is your reference: one normal adult circulation, shown across the four panels below — waveforms, the PV loop, the metrics, and the controls. Every other lesson is a deviation from what you see here, so learn to read these four views fluently and the disease cases become much easier."),
  p("There are no steps to click through. Read this once, then scroll down and study each panel in turn. When you reach the controls at the bottom, nudge the heart and watch the panels above re-draw."),
  h("Panel 1 — Pressures over time (Waveforms)"),
  p("The first panel below plots pressure against time for one heartbeat, repeated. Three traces matter: left-ventricular pressure (LVP), aortic pressure (AoP), and left-atrial pressure (LAP)."),
  li("LVP swings the most: near zero during filling, then a sharp rise in systole to eject blood."),
  li("AoP tracks LVP during ejection, then holds a high diastolic floor — that floor is what perfuses the coronaries and brain between beats."),
  li("LAP stays low (a few mmHg) — low filling pressure is the hallmark of a healthy, compliant left heart."),
  p("Watch for the crossing: LVP must rise ABOVE AoP to open the aortic valve and eject, and the valve closes when LVP falls back below AoP. That crossing window is systole."),
  h("Panel 2 — One beat as a loop (PV Loop)"),
  p("The PV-loop panel draws the same beat as pressure (y) versus volume (x). Read it counter-clockwise: fill (bottom, volume rises), contract (left side rises with little volume change), eject (top, volume falls), relax (right side drops). The width of the loop is the stroke volume — the blood pumped per beat."),
  eq("SV = EDV - ESV"),
  p("EDV is the volume at end-filling (far right); ESV is what is left after ejection (far left). A normal loop is tall and wide. In later lessons a failing ventricle gives a narrow, short loop, and a leaky valve distorts the shape."),
  h("Panel 3 — The numbers that summarize it (Metrics)"),
  p("The metrics panel reduces those curves to the numbers clinicians quote. For this normal reference, expect roughly:"),
  li("ABP (arterial blood pressure): around 120/80 mmHg."),
  li("CO (cardiac output): about 5 L/min."),
  li("SV (stroke volume): roughly 70 mL per beat."),
  li("CVP (central venous / filling pressure): low, a few mmHg."),
  eq("CO = HR \\times SV"),
  p("Glance at this panel when you just want to know whether output and pressure are adequate. Treat the values as indicative, not lab-validated — this is an uncalibrated teaching model, so the POINT is the DIRECTION each number moves when you change something, not its exact value."),
  quiz("Which panel most directly tells you whether cardiac output and blood pressure are adequate?", "Waveforms|PV Loop|Metrics", "2"),
  h("Panel 4 — Try it: nudge the heart (Controls)"),
  p("The controls panel at the bottom lets you change the heart and instantly re-read every panel above. Each control offers Low / Normal / High. Leave them at Normal to keep this reference intact, or experiment:"),
  li("Contractility (High): the PV loop grows taller and wider; SV and CO rise."),
  li("Afterload (High): the loop is squeezed taller and narrower; ejection is harder, so SV tends to fall."),
  li("Heart rate (High): CO can rise (CO = HR x SV), but filling time shortens."),
  p("Change ONE control at a time, note which panels move and in which direction, then return it to Normal."),
  h("Takeaway"),
  p("A normal heart at rest: LVP and AoP that cross cleanly in systole, a low LAP, a tall-and-wide PV loop, about 120/80 with a CO near 5 L/min, and low filling pressure. Hold this picture — in every disease lesson you will be asking 'how is this different from the normal reference?'"),
];

const ACUTE_ANTERIOR_MI_NOTE: NoteContent = [
  h("Acute Anterior MI: when the pump stalls"),
  p("A heart attack in the anterior wall suddenly knocks out a big region of working muscle. The left ventricle can no longer squeeze as hard. In this lesson we put a normal heart and an acute anterior MI heart side by side and watch what the loss of contractility alone does to pressure, volume, and flow — at the same heart rate and the same blood volume, so the squeeze is the only thing that changes."),
  h("1. A weaker squeeze, a lower pressure"),
  p("Find the LV pressure trace (LVP) in the waveform panel below. The MI heart cannot build as much pressure during contraction, so its systolic peak sits lower than normal and the aortic pressure (AoP) it pushes out is reduced. The heart is working against the same afterload but with a weaker motor."),
  li("LVP peak: lower in the MI heart."),
  li("AoP (blood pressure): falls — less forward push."),
  li("LAP (left atrial / filling pressure): rises as blood backs up behind the failing ventricle."),
  h("2. Reading the failing PV loop"),
  p("The pressure-volume loop below is the clearest picture of the problem. Each lap around the loop is one heartbeat: width is stroke volume, height is pressure. Compare the two loops. The MI loop is SHORTER (lower peak pressure, weaker contraction) and NARROWER (less volume ejected), and it sits shifted to the right because the ventricle empties less completely and holds more blood at end-systole."),
  eq("SV = EDV - ESV"),
  p("Stroke volume is end-diastolic volume minus end-systolic volume. The MI ventricle ends each beat with MORE blood left inside (higher ESV), so the gap — the stroke volume — shrinks. A smaller loop literally means a smaller pump output."),
  h("3. The downstream cost"),
  p("Now the numbers in the metrics panel. With a smaller stroke volume on every beat and the heart rate held unchanged, cardiac output (CO = HR x SV) drops. Arterial blood pressure (ABP) falls with it. Meanwhile blood that the ventricle could not eject backs up — left atrial pressure rises, and that congestion is what drives breathlessness and pulmonary edema in a real patient."),
  eq("CO = HR \\times SV"),
  li("SV down -> CO down -> ABP down (forward failure)."),
  li("LAP up -> lung congestion (backward failure)."),
  h("4. Try it"),
  p("Use the Contractility control below to push the squeeze from Low back toward Normal and watch the PV loop grow taller and wider as stroke volume recovers. This is the idea behind inotropic support: when the muscle itself is failing, restoring contractile force is what reopens the loop. Nudging heart rate or afterload moves the numbers too, but only contractility fixes the loop's shape."),
  quiz("On the PV loop, what is the main change caused by the acute anterior MI?", "The loop gets taller and wider|The loop gets shorter and narrower (lower pressure, smaller stroke volume)|The loop is unchanged", "1"),
  h("Takeaway"),
  p("Acute anterior MI is, at heart, a sudden contractility problem. On the simulator it shows up as a smaller, lower PV loop, a falling stroke volume and cardiac output, and a rising left atrial pressure — forward failure and backward congestion from a single weakened squeeze."),
];

const SYSTOLIC_HF_NOTE: NoteContent = [
  h("Systolic Heart Failure (HFrEF)"),
  p("In HFrEF the left ventricle squeezes too weakly. With every beat it ejects a smaller fraction of the blood it holds, so the ejection fraction is reduced (the 'rEF' in HFrEF). On every graph below you are seeing two hearts overlaid: a Normal reference and an HFrEF heart. Compare them as you read."),
  h("1. A weaker pump ejects less"),
  p("Stroke volume (SV) is simply how much blood leaves the ventricle each beat — the difference between the volume at the end of filling (EDV) and the volume left after ejection (ESV)."),
  eq("SV = EDV - ESV"),
  p("A weak ventricle cannot eject down to a low ESV, so SV shrinks. Cardiac output is just that stroke volume delivered every minute:"),
  eq("CO = HR \\times SV"),
  p("WAVEFORMS panel (just below): watch LV pressure (LVP) and aortic pressure (AoP). In HFrEF the LV cannot build as much pressure, so the AoP peak is lower and the pulse looks blunted versus Normal."),
  h("2. Reading it on the PV loop"),
  p("PV LOOP panel (below the waveforms): the loop is pressure (height) against volume (width). The Normal loop is tall and wide. The HFrEF loop sits shifted to the RIGHT (the ventricle is operating at larger volumes) and is SHORTER and NARROWER — less peak pressure and less width means less stroke volume. That narrower width is the reduced ejection fraction, made visible."),
  li("Shorter loop = weaker contraction (lower peak pressure)."),
  li("Narrower loop = smaller stroke volume."),
  li("Shifted right = the heart holds more blood it cannot clear."),
  h("3. Blood backs up: rising filling pressure"),
  p("Because the failing ventricle does not empty well, blood pools behind it. WAVEFORMS panel: compare left atrial pressure (LAP) between the two hearts — in HFrEF the LAP trace rides higher. That elevated filling pressure is what, in a real patient, transmits back to the lungs and causes the breathlessness of heart failure."),
  p("METRICS panel (below): you should see it numerically — HFrEF has a lower SV and CO, a lower arterial pressure (ABP), and a higher filling pressure (CVP) than Normal. The directions are what matter here, not the exact figures."),
  h("4. Try it yourself"),
  p("CONTROLS panel (at the bottom): the failing heart is built from a few clinical knobs. Use the Low / Normal / High buttons to feel each lever."),
  li("Contractility -> Low: this is the heart of HFrEF. Watch the PV loop shrink and SV fall."),
  li("Afterload -> High: a stiffer, higher-resistance arterial load makes a weak ventricle eject even less. Set it High and the HFrEF loop narrows further."),
  li("Heart rate -> High: mild tachycardia is the body trying to defend cardiac output when SV is low (CO = HR x SV). Note it helps only a little."),
  { type: "controller_ref", props: { paramKey: "contractility", label: "Contractility control" } },
  quiz("In HFrEF, compared with normal, the LV pressure-volume loop is typically:", "Taller and wider|Shorter and narrower, shifted right|Unchanged", "1"),
  h("Takeaway"),
  p("HFrEF = a weak left ventricle. Reduced contractility lowers stroke volume and cardiac output, the PV loop becomes short and narrow and shifts to larger volumes, and pressure backs up as a raised filling pressure (LAP/CVP). The numbers in this 0D model are illustrative — trust the DIRECTION of each change, which you can read straight off the waveforms and the loop."),
];

const DIASTOLIC_HF_NOTE: NoteContent = [
  h("Diastolic heart failure (HFpEF): when filling, not pumping, is the problem"),
  p("In most heart failure you picture a weak pump. HFpEF is the opposite kind of trouble: the left ventricle still SQUEEZES well — ejection fraction looks normal — but it has become STIFF and slow to relax, so it cannot fill at a normal pressure. To pack in enough blood, the heart has to push filling pressures up, and that backed-up pressure is what makes patients breathless."),
  p("In the panels below you'll compare a Normal heart with an HFpEF heart on the same graphs (both traces are overlaid on every panel). We made the HFpEF ventricle stiffer (higher diastolic stiffness) and slower to relax, with a mild rise in afterload to reflect the high blood pressure that so often accompanies HFpEF — but we left contractility untouched. Watch how filling pressure climbs even though the pump itself is intact."),
  h("What the pressure tracings show (waveform panel below)"),
  p("On the waveform panel, look at LAP (left atrial pressure, a stand-in for filling pressure). In the Normal heart it sits low through diastole. In the HFpEF heart the whole LAP trace is shifted UP — the atrium has to generate more pressure to drive blood into the stiff ventricle. Meanwhile LVP still rises to a healthy systolic peak and AoP looks broadly preserved: the squeeze is fine. The story of HFpEF lives in diastole, not systole."),
  li("Normal: low, gentle filling pressure (LAP)."),
  li("HFpEF: elevated LAP — the diastolic 'tax' the stiff ventricle charges to fill."),
  li("Systolic LVP / AoP: similar in both — ejection is preserved."),
  h("The PV loop: a tall, leftward-stiff filling limb (PV loop panel below)"),
  p("The pressure-volume loop is the clearest fingerprint of HFpEF. The bottom edge of the loop is the diastolic filling line (EDPVR). In the stiff ventricle this line is STEEPER, so for the same volume the filling pressure is much higher — the loop's lower-right corner is pushed UP. Stroke volume (the loop's width) is roughly preserved, and the systolic end of the loop is largely unchanged, which is why ejection fraction stays normal."),
  eq("EF = \\frac{SV}{EDV} = \\frac{EDV - ESV}{EDV}"),
  p("In HFpEF, EF stays near normal because both EDV and ESV are roughly preserved — the abnormality is the PRESSURE needed to reach that EDV, not the volume ejected. Don't let a 'normal EF' reassure you: a normal-looking number can hide a dangerously stiff ventricle."),
  h("What the numbers do (and don't) reveal (metrics panel below)"),
  p("On the metrics panel, compare the two hearts. CO and SV stay close to normal in HFpEF and EF is preserved — exactly the trap. The tell-tale is the FILLING side: the central venous / filling pressures rise. This is why HFpEF is diagnosed by signs of congestion and high filling pressures, not by a low ejection fraction. (Absolute numbers in this model are indicative, not calibrated — read the DIRECTION of change.)"),
  quiz("In HFpEF, which finding is the key abnormality?", "Low ejection fraction|Elevated filling pressure with preserved EF|Reduced stroke volume from weak contraction", "1"),
  h("Try it yourself (controls panel below)"),
  p("Use the controls at the bottom of the page to feel the mechanism — each is a Low / Normal / High button. Push Diastolic stiffness toward High and Relaxation toward Low (slower) and watch the PV loop's filling line tilt up and the LAP trace climb — that's HFpEF getting worse. Now press Heart rate High: less time to fill a stiff ventricle often makes filling pressures worse, which is why HFpEF patients tolerate tachycardia (and atrial fibrillation) so poorly."),
  li("Diastolic stiffness High -> filling line steepens, LAP rises."),
  li("Relaxation slower (Low) -> early filling impaired, pressures rise."),
  li("Heart rate High -> shorter diastole, less fill time, congestion worsens."),
  h("Takeaway"),
  p("HFpEF is heart failure with a normal ejection fraction. The pump is fine; the FILLING is broken. A stiff, slow-relaxing ventricle drives up filling pressures to maintain output, and that high pressure backs up into the lungs as breathlessness. On the PV loop, look for a steep, elevated diastolic filling limb with a near-normal systolic end — preserved EF, high filling pressure. That single picture is the essence of HFpEF."),
];

const AORTIC_STENOSIS_NOTE: NoteContent = [
  h("Aortic Stenosis: a stiff door on the way out"),
  p("The aortic valve is the door the left ventricle pushes blood through on every beat. In aortic stenosis that door is stiff and narrowed, so the ventricle has to shove much harder to get the same amount of blood out. In this lesson you will compare a Normal heart with a severely stenotic one and read its compensation off three panels below: the pressure WAVEFORMS, the PV LOOP, and the METRICS."),
  h("1. A pressure gradient across the valve"),
  p("In a healthy heart, when the aortic valve is open the pressure inside the ventricle (LVP) and in the aorta (AoP) are almost equal — blood flows freely. Narrow the valve and the ventricle must build a much higher pressure than the aorta to force blood through. That difference is the pressure gradient, and it is the signature of aortic stenosis."),
  eq("\\text{Gradient} = LVP_{peak} - AoP_{peak}"),
  p("In the WAVEFORM panel below, find systole — the moment LVP rises. For the Normal heart, the LVP and AoP curves hug each other at the top. For aortic stenosis, LVP climbs far above AoP: the gap between those two peaks IS the gradient. Notice the aortic pressure also rises more slowly and peaks later (a delayed, blunted upstroke)."),
  h("2. The ventricle answers with pressure"),
  p("To keep pumping against the stiff valve, the ventricle generates very high pressures during ejection. Over time this is why a stenotic ventricle becomes thick (hypertrophied) — but even in this snapshot you can see the immediate response: a tall, high-pressure squeeze. The PV LOOP panel below tells the same story in one picture: the Normal loop is a familiar rounded box, while the aortic-stenosis loop is much TALLER — its top edge sits at a far higher pressure because the ventricle has to overcome the narrowed valve before it can eject. The loop may also narrow somewhat, hinting that stroke volume suffers when the obstruction is severe."),
  h("3. What it costs: output"),
  p("Now look at the METRICS panel below. Despite the heroic pressures, stroke volume (SV) and cardiac output (CO) in severe stenosis are at best maintained, often reduced — the ventricle is working much harder for the same or less forward flow. Compare SV and CO between Normal and Aortic stenosis to see the price of pushing through a narrow valve."),
  quiz("What is the hallmark of aortic stenosis on the pressure waveforms?", "AoP rises higher than LVP|A large gap where LVP rises far above AoP during ejection|LVP and AoP stay equal", "1"),
  h("Try it with the controls"),
  p("At the bottom of the column is the CONTROLS panel. In reading mode each control is a simple Low / Normal / High button. Try raising Afterload or Arterial stiffness to feel how added load stacks on top of the valve obstruction, or nudge Contractility to see how a stronger squeeze partly defends output."),
  h("Takeaway"),
  p("Aortic stenosis = a stiff exit door. The ventricle compensates with very high pressure, which you read as (1) a wide LVP-minus-AoP gradient on the waveforms, (2) a much taller PV loop, and (3) hard-won, often reduced output on the metrics. The pressure is the compensation; the cost is the work."),
];

const HYPOVOLEMIC_SHOCK_NOTE: NoteContent = [
  h("Hypovolemic shock: when the tank runs low"),
  p("Shock means the body's tissues aren't getting enough blood flow. In hypovolemic shock the cause is simple — there isn't enough blood in the circulation, usually from bleeding or severe fluid loss. Here we compare a Normal heart with one that has lost circulating volume, and watch what happens to filling, output, and pressure."),
  h("Less volume means less preload"),
  p("The heart can only pump out what flows into it. When circulating volume drops, less blood returns to the heart between beats, so the ventricle fills less. That reduced end-diastolic volume is called low preload."),
  eq("SV = EDV - ESV"),
  p("With a smaller end-diastolic volume (EDV) and roughly the same end-systolic volume (ESV), the stroke volume (SV) shrinks. On the PV Loop below, the hypovolemic loop sits to the LEFT and is NARROWER than the normal loop — the ventricle starts each beat with less volume and ejects less. The loop's width is stroke volume, so you can literally see SV fall."),
  h("Lower output, lower blood pressure"),
  p("Cardiac output is heart rate times stroke volume. With heart rate unchanged in this uncompensated model, the falling stroke volume drags cardiac output down — and with it, arterial blood pressure."),
  eq("CO = HR \\times SV"),
  p("On the Waveforms below, the aortic pressure (AoP) trace for the hypovolemic case rides LOWER than normal, and the left atrial pressure (LAP) — a marker of filling pressure — is also reduced. Low filling pressure plus low arterial pressure is the hallmark of hypovolemia."),
  p("Check the Metrics panel below: arterial blood pressure (ABP), cardiac output (CO), and stroke volume (SV) are all lower for the hypovolemic instance, and central venous pressure (CVP) — the filling pressure on the right side — is low too. Low CVP alongside low blood pressure points toward a volume problem rather than a pump or vascular-tone problem."),
  h("Try it yourself"),
  p("Use the Controls below to explore. The fluids / volume control lets you move circulating volume Low / Normal / High. Drop it toward Low to deepen the shock; raise it back toward Normal to mimic giving fluids and watch the PV loop widen and pressures recover."),
  quiz("In hypovolemic shock, why does stroke volume fall?", "The ventricle contracts more weakly|Less blood returns, so the ventricle fills less (low preload)|The aortic valve is narrowed", "1"),
  h("Takeaway"),
  p("Hypovolemic shock is a preload problem. Less circulating volume means less filling, a smaller and left-shifted PV loop, lower stroke volume and cardiac output, and low filling pressures (low CVP/LAP) together with low blood pressure. The first-line fix mirrors the cause: restore volume."),
];

const AFTERLOAD_CONTROL_VIEW_ID = "v_afterload_demo_controls";
const AFTERLOAD_METRICS_VIEW_ID = "v_afterload_pressure_output";
const AFTERLOAD_PV_LOOP_VIEW_ID = "p2";
const AFTERLOAD_WAVEFORMS_VIEW_ID = "p1";
const AFTERLOAD_NOTE_ID = "p_note";
const AFTERLOAD_NORMAL_INSTANCE_ID = "1";
const AFTERLOAD_HYPERTENSIVE_INSTANCE_ID = "2";
const AFTERLOAD_SCENARIO_IDS = [AFTERLOAD_NORMAL_INSTANCE_ID, AFTERLOAD_HYPERTENSIVE_INSTANCE_ID];
const AFTERLOAD_PV_MEMBERSHIP = Object.fromEntries(AFTERLOAD_SCENARIO_IDS.map((id) => [id, ["LV"]]));
const AFTERLOAD_WAVEFORM_MEMBERSHIP = Object.fromEntries(AFTERLOAD_SCENARIO_IDS.map((id) => [id, ["LVP", "AoP", "LAP"]]));
const AFTERLOAD_METRIC_MEMBERSHIP = Object.fromEntries(AFTERLOAD_SCENARIO_IDS.map((id) => [id, ["ABP", "CO", "SV", "PCWP"]]));

const AFTERLOAD_CASE_VIEWS: ViewSpec[] = [
  {
    id: AFTERLOAD_CONTROL_VIEW_ID,
    title: "Afterload demo",
    kind: "controller",
    binding: { kind: "active" },
    items: [
      buttonGroupItem("afterload"),
      buttonGroupItem("contractility"),
    ],
  },
  {
    id: AFTERLOAD_METRICS_VIEW_ID,
    title: "Pressure & output",
    kind: "metrics",
    metrics: ["ABP", "CO", "SV", "PCWP"],
    membership: AFTERLOAD_METRIC_MEMBERSHIP,
  },
  {
    id: AFTERLOAD_PV_LOOP_VIEW_ID,
    title: "PV Loop",
    kind: "graph",
    graphType: "pvloop",
    membership: AFTERLOAD_PV_MEMBERSHIP,
    aspect: { ratio: 1, fit: "lock" },
    presentation: { showGuides: true },
  },
  {
    id: AFTERLOAD_WAVEFORMS_VIEW_ID,
    title: "Waveforms",
    kind: "graph",
    graphType: "waveform",
    membership: AFTERLOAD_WAVEFORM_MEMBERSHIP,
    presentation: { timeWindow: 5000 },
  },
];

const AFTERLOAD_GRAPH_BOARD_LAYOUT: GraphBoardLayout = {
  type: "split",
  direction: "row",
  children: [
    { type: "leaf", graphViewId: AFTERLOAD_PV_LOOP_VIEW_ID },
    { type: "leaf", graphViewId: AFTERLOAD_WAVEFORMS_VIEW_ID },
  ],
  sizes: [1, 1],
};

const AFTERLOAD_READING: CaseReadingManifest = {
  schemaVersion: 1,
  column: [
    { kind: "noteRef", noteId: AFTERLOAD_NOTE_ID },
    { kind: "viewRef", viewId: AFTERLOAD_CONTROL_VIEW_ID },
    { kind: "paneRef", panelId: AFTERLOAD_PV_LOOP_VIEW_ID },
  ],
};

const AFTERLOAD_ACUTE_HYPERTENSION_NOTE: NoteContent = [
  h("Afterload: normal vs acute hypertension"),
  p("Afterload is the pressure load the left ventricle must overcome to eject blood. In acute hypertension, systemic resistance is higher, so the ventricle has to generate more pressure before and during ejection."),
  p("Compare the Normal and Hypertensive scenarios on the PV loop. The hypertensive loop becomes taller and narrower: pressure rises, end-systolic volume tends to increase, and stroke volume falls because ejection is harder."),
  p("Use the curated control below to change one lever at a time. Raise Afterload to reproduce the hypertensive shape; raise Contractility to see how a stronger ventricle can partly defend stroke volume against the higher load."),
  viewRef(AFTERLOAD_CONTROL_VIEW_ID),
  p("Then return to the PV loop and read the loop width as stroke volume. A narrower loop at a higher pressure is the visual signature of acute afterload stress in this teaching model."),
];

export const OFFICIAL_CASES: CaseDocument[] = [
  makeCase({
    id: "afterload-acute-hypertension",
    title: "Afterload — normal vs acute hypertension",
    description: "A PV-loop-first teaching case comparing normal afterload with acute hypertension. Higher afterload makes ejection harder, raising pressure while narrowing the loop and reducing stroke volume.",
    modelLimitations: [LIMIT_GENERAL, LIMIT_NOREFLEX, LIMIT_CALIB],
    instances: [
      { name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 },
      { name: "Hypertensive", knobs: { afterload: 1.6 }, interventions: [], targetVolume: 5600 },
    ],
    views: AFTERLOAD_CASE_VIEWS,
    graphBoardLayout: AFTERLOAD_GRAPH_BOARD_LAYOUT,
    initialActiveScenarioId: AFTERLOAD_NORMAL_INSTANCE_ID,
    reading: AFTERLOAD_READING,
    notes: { [AFTERLOAD_NOTE_ID]: AFTERLOAD_ACUTE_HYPERTENSION_NOTE },
  }),
  makeCase({
    id: "normal-sinus",
    title: "Normal physiology",
    description: "A roughly-physiological resting adult — the reference operating point all other cases deviate from.",
    modelLimitations: [LIMIT_GENERAL, LIMIT_CALIB],
    expectedFindings: [
      metricRange("normal-co-range", "CO_L", "1", { min: 4.5, max: 6.5 }, "Normal resting cardiac output remains in the teaching reference range."),
      metricRange("normal-map-range", "AoPMean", "1", { min: 70, max: 100 }, "Normal mean aortic pressure remains in the teaching reference range."),
      metricRange("normal-lap-range", "LAPMean", "1", { min: 3, max: 12 }, "Normal left atrial pressure remains in the teaching reference range."),
    ],
    instances: [{ name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 }],
    notes: { p_note: NORMAL_REFERENCE_NOTE },
  }),
  makeCase({
    id: "acute-anterior-mi",
    title: "Acute Anterior MI: when the pump stalls",
    description: "A normal heart vs an acute anterior MI heart: an isolated loss of anterior-wall contractility narrows the LV PV loop, drops stroke volume and cardiac output, and raises left atrial filling pressure.",
    modelLimitations: [
      LIMIT_GENERAL,
      "LV failure is modelled as GLOBAL contractility depression — the 0D model cannot represent a regional wall-motion abnormality (e.g. a territorial anterior infarct).",
      LIMIT_NOREFLEX,
      LIMIT_CALIB,
    ],
    instances: [
      { name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 },
      { name: "Acute Anterior MI", knobs: { contractility: 0.45 }, interventions: [], targetVolume: 5600 },
    ],
    expectedFindings: [
      metricDirection("ami-co-down", "CO_L", "2", "1", "down", "Acute anterior MI lowers cardiac output versus normal.", 0.5),
      metricDirection("ami-lap-up", "LAPMean", "2", "1", "up", "Acute anterior MI raises left atrial filling pressure versus normal.", 2),
      metricDirection("ami-ef-down", "EF_LApprox", "2", "1", "down", "Acute anterior MI lowers approximate LV ejection fraction versus normal.", 0.1),
    ],
    notes: { p_note: ACUTE_ANTERIOR_MI_NOTE },
  }),
  makeCase({
    id: "systolic-heart-failure",
    title: "Systolic Heart Failure (HFrEF)",
    description: "A normal left ventricle compared with a failing one (HFrEF). Reduced contractility plus higher afterload drops stroke volume and cardiac output while raising filling pressure — read it on the waveforms, the PV loop, and the metrics.",
    modelLimitations: [
      LIMIT_GENERAL,
      "HFrEF is modelled as GLOBAL contractility depression — the 0D model cannot represent a regional wall-motion abnormality (e.g. a prior territorial infarct) or remodelling/dilatation over time.",
      LIMIT_NOREFLEX,
      LIMIT_CALIB,
    ],
    instances: [
      { name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 },
      { name: "HFrEF", knobs: { contractility: 0.45, afterload: 1.25, HR: 95 }, interventions: [], targetVolume: 5600 },
    ],
    expectedFindings: [
      metricDirection("hfrEF-co-down", "CO_L", "2", "1", "down", "HFrEF lowers cardiac output versus normal.", 0.5),
      metricDirection("hfrEF-lap-up", "LAPMean", "2", "1", "up", "HFrEF raises left atrial filling pressure versus normal.", 2),
      metricDirection("hfrEF-ef-down", "EF_LApprox", "2", "1", "down", "HFrEF lowers approximate LV ejection fraction versus normal.", 0.1),
    ],
    notes: { p_note: SYSTOLIC_HF_NOTE },
  }),
  makeCase({
    id: "diastolic-heart-failure",
    title: "Diastolic Heart Failure (HFpEF)",
    description: "A stiff, slow-relaxing left ventricle with preserved ejection fraction, compared with the normal reference. Filling pressures rise even though the pump is intact.",
    modelLimitations: [LIMIT_GENERAL, LIMIT_NOREFLEX, LIMIT_CALIB],
    instances: [
      { name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 },
      { name: "HFpEF (stiff LV)", knobs: { diastolicStiffness: 1.8, relaxation: 0.6, afterload: 1.2 }, interventions: [], targetVolume: 5600 },
    ],
    expectedFindings: [
      metricDirection("hfpEF-lap-up", "LAPMean", "2", "1", "up", "HFpEF raises left atrial filling pressure versus normal.", 1),
      metricDirection("hfpEF-co-preserved", "CO_L", "2", "1", "unchanged", "HFpEF keeps cardiac output roughly preserved versus normal in this teaching case.", 0.5),
      metricRange("hfpEF-ef-preserved", "EF_LApprox", "2", { min: 0.5, max: 0.85 }, "HFpEF keeps approximate LV ejection fraction in the preserved range."),
    ],
    notes: { p_note: DIASTOLIC_HF_NOTE },
  }),
  makeCase({
    id: "aortic-stenosis",
    title: "Aortic Stenosis: a stiff door on the way out",
    description: "A severely stenotic aortic valve compared with the normal reference: the ventricle builds a large pressure gradient and a tall PV loop to maintain output.",
    modelLimitations: [LIMIT_GENERAL, LIMIT_NOREFLEX, LIMIT_CALIB],
    instances: [
      { name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 },
      { name: "Aortic stenosis", knobs: {}, interventions: [{ uid: "as", id: "aorticStenosis", args: { severity: "severe" } }], targetVolume: 5600 },
    ],
    expectedFindings: [
      metricDirection("as-gradient-up", "AoVMeanGradient", "2", "1", "up", "Aortic stenosis raises the mean LV-aortic valve gradient versus normal.", 5),
      metricDirection("as-lap-up", "LAPMean", "2", "1", "up", "Aortic stenosis raises left atrial filling pressure versus normal.", 2),
    ],
    notes: { p_note: AORTIC_STENOSIS_NOTE },
  }),
  makeCase({
    id: "hypovolemic-shock",
    title: "Hypovolemic Shock",
    description: "A normal heart compared with one that has lost circulating volume: reduced preload narrows and left-shifts the PV loop, dropping stroke volume, cardiac output, and pressure.",
    modelLimitations: [LIMIT_GENERAL, LIMIT_NOREFLEX, LIMIT_CALIB],
    instances: [
      { name: "Normal", knobs: {}, interventions: [], targetVolume: 5600 },
      { name: "Hypovolemic shock", knobs: {}, interventions: [], targetVolume: 4800 },
    ],
    expectedFindings: [
      metricDirection("hypovolemic-shock-co-down", "CO_L", "2", "1", "down", "Hypovolemic shock lowers cardiac output versus normal.", 0.5),
      metricDirection("hypovolemic-shock-lap-down", "LAPMean", "2", "1", "down", "Hypovolemic shock lowers left atrial filling pressure versus normal.", 1),
      metricDirection("hypovolemic-shock-rap-down", "RAPMean", "2", "1", "down", "Hypovolemic shock lowers right atrial filling pressure versus normal.", 0.5),
    ],
    notes: { p_note: HYPOVOLEMIC_SHOCK_NOTE },
  }),
  makeCase({
    id: "lv-failure-dobutamine",
    title: "Cardiogenic shock: LV failure ± dobutamine",
    description: "Severe global LV pump failure, and the response to a β1 inotrope (dobutamine). Compare the two side by side: CO and arterial pressure recover, filling pressure falls.",
    modelLimitations: [
      LIMIT_GENERAL,
      "LV failure is modelled as GLOBAL contractility depression — the 0D model cannot represent a regional wall-motion abnormality (e.g. a territorial infarct).",
      LIMIT_NOREFLEX,
      LIMIT_CALIB,
    ],
    instances: [
      { name: "LV failure", knobs: {}, interventions: [{ uid: "f1", id: "lvPumpFailure", args: { severity: 0.8 } }], targetVolume: 5600 },
      { name: "+ Dobutamine", knobs: {}, interventions: [{ uid: "f2", id: "lvPumpFailure", args: { severity: 0.8 } }, { uid: "d", id: "dobutamine", args: { dose: 7 } }], targetVolume: 5600 },
    ],
    expectedFindings: [
      metricDirection("dobutamine-co-up", "CO_L", "2", "1", "up", "Dobutamine raises cardiac output versus the LV failure state.", 0.5),
      metricDirection("dobutamine-aop-up", "AoPMean", "2", "1", "up", "Dobutamine raises mean aortic pressure versus the LV failure state.", 5),
      metricDirection("dobutamine-lap-down", "LAPMean", "2", "1", "down", "Dobutamine lowers left atrial filling pressure versus the LV failure state.", 5),
    ],
  }),
  makeCase({
    id: "valve-lesions",
    title: "Valvular lesions: aortic stenosis & mitral regurgitation",
    description: "Two classic left-heart valve lesions. AS imposes a systolic LV–aortic pressure gradient; MR sends a regurgitant jet into the LA, raising LAP and cutting forward output.",
    modelLimitations: [
      LIMIT_GENERAL,
      "Valve lesions are modelled by lumped orifice area / leak area / resistance changes — no real geometry, jet, or turbulence. The AS systolic gradient is carried mainly by the valve resistance term and is under-scaled vs a clinically-severe gradient (the orifice-area change is largely normalised out of the flow law — an M12 calibration item); read the gradient's DIRECTION, not its magnitude.",
      LIMIT_CALIB,
    ],
    instances: [
      // Severity coefficients recalibrated (docs/research/valve-lesions.md) so the MR
      // leak (severity 1.0 → ~0.5 cm² EROA) maps to a real EROA off the LV 3 mL floor.
      // M12-proper #1 Phase-1: at the new (lower-afterload) operating point the LV
      // unloads harder into the LA, so 'severe' (EROA 0.5) over-empties past the EF
      // degeneracy guard (EF>0.92). Retuned to 'moderate' (0.66 → EROA 0.33,
      // moderate-to-severe) — non-degenerate (EF ~0.80), v-wave ~11 mmHg, forward SV
      // reduced: still clinically-meaningful MR teaching (claude1's clinical floor;
      // docs/research/m12-la-preload-design.md).
      { name: "Aortic stenosis", knobs: {}, interventions: [{ uid: "as", id: "aorticStenosis", args: { severity: "severe" } }], targetVolume: 5600 },
      { name: "Mitral regurgitation", knobs: {}, interventions: [{ uid: "mr", id: "mitralRegurgitation", args: { severity: "moderate" } }], targetVolume: 5600 },
    ],
    expectedFindings: [
      metricRange("valve-lesions-as-gradient-high", "AoVMeanGradient", "1", { min: 25 }, "The aortic stenosis branch has an elevated mean LV-aortic valve gradient."),
      metricRange("valve-lesions-mr-lap-elevated", "LAPMean", "2", { min: 7.5 }, "The mitral regurgitation branch has elevated left atrial pressure."),
    ],
  }),
  makeCase({
    id: "hypovolemia",
    title: "Hypovolemia",
    description: "Reduced circulating volume (e.g. haemorrhage): preload falls, so stroke volume and cardiac output drop while the heart itself is normal — a preload, not a pump, problem.",
    modelLimitations: [
      LIMIT_GENERAL,
      "Volume status is set via the target total blood volume; there is no dynamic bleeding/transfusion in this static case (see the Fluids & Hemorrhage controls for that).",
      LIMIT_NOREFLEX,
      LIMIT_CALIB,
    ],
    // M12-lite: 4600 -> 4800 mL. The M12-lite Klotz EDPVR recalibration lowered baseline
    // filling pressures, so 4600 floored the RA (1792 clamps); 4800 is the clean floor (0
    // clamps) that still teaches low preload/output (CO 3.2<4.4, EDV 83<97, RAP lower).
    // Representing Class III-IV hemorrhage without flooring is an M12-proper item.
    expectedFindings: [
      metricRange("hypovolemia-co-low", "CO_L", "1", { max: 5 }, "Hypovolemia has low cardiac output in this teaching operating point."),
      metricRange("hypovolemia-lap-low", "LAPMean", "1", { max: 4 }, "Hypovolemia has low left atrial filling pressure."),
      metricRange("hypovolemia-rap-low", "RAPMean", "1", { max: 2 }, "Hypovolemia has low right atrial filling pressure."),
    ],
    instances: [{ name: "Hypovolemia", knobs: {}, interventions: [], targetVolume: 4800 }],
  }),
];

export function officialCaseById(id: string): CaseDocument | undefined {
  return OFFICIAL_CASES.find((c) => c.meta.id === id);
}
