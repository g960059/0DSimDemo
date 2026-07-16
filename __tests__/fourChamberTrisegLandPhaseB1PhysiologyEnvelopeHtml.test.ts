import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  buildPhaseB1PhysiologyEnvelopeReviewFragmentV1,
  buildPhaseB1PhysiologyEnvelopeStandaloneHtmlV1,
} from "@/tools/myocardium/renderPhaseB1PhysiologyEnvelopeHtmlV1";
import {
  buildPhaseB1AtrialPvReservoirConduitReadbackV1,
} from "@/tools/myocardium/phaseB1AtrialPvReservoirConduitReadbackV1";

const chamberPressure = Object.freeze({
  LA: 1_000,
  LV: 1_100,
  SA: 12_000,
  SV: 500,
  RA: 600,
  RV: 1_050,
  PA: 2_000,
  PV: 900,
});

const chamberVolume = Object.freeze({
  LA: 50e-6,
  LV: 120e-6,
  SA: 700e-6,
  SV: 3_500e-6,
  RA: 60e-6,
  RV: 130e-6,
  PA: 300e-6,
  PV: 740e-6,
});

const flows = Object.freeze({
  Q_MV: 80e-6,
  Q_AoV: 70e-6,
  Q_TV: 85e-6,
  Q_PuV: 72e-6,
  Q_VC: 75e-6,
  Q_PV: 78e-6,
  Q_sys: 76e-6,
  Q_pul: 74e-6,
});

const reviewClaimBoundary = Object.freeze({
  stageOneGlobalHemodynamicsScreenIsProspectiveOnly: true,
  physiologyBandClassificationRequiresFormalPeriodOne: true,
  stageOneGlobalHemodynamicsScreenEligibilityPass: false,
  completePhysiologyEnvelopeGateImplemented: false,
  physiologicalValidationPass: false,
  atrialPvLoopHeldOutFromSelection: true,
  exploratoryTimeStep: true,
});

const samplePhasesSec = Object.freeze(
  Array.from({ length: 11 }, (_, index) => index * 0.08),
);
const atrialVolumesMl = Object.freeze([
  50, 55, 60, 65, 70, 71, 60, 50, 58, 54, 50,
]);
const avFlowsM3PerSec = Object.freeze([
  -80e-6, -80e-6, -80e-6, 0, 80e-6, 160e-6,
  160e-6, 80e-6, 0, -80e-6, -80e-6,
]);
const waveformSamples = Object.freeze(samplePhasesSec.map(
  (phaseSec, index) => {
    const laVolumeM3 = atrialVolumesMl[index] * 1e-6;
    const raVolumeM3 = laVolumeM3 + 10e-6;
    return Object.freeze({
      absoluteTimeSec: 7.2 + phaseSec,
      phaseSec,
      bloodVolumesM3: Object.freeze(Object.fromEntries(
        Object.entries(chamberVolume).map(([key, value]) => [
          key,
          key === "LA" ? laVolumeM3 : key === "RA" ? raVolumeM3 : value,
        ]),
      )),
      compartmentAbsolutePressurePa: Object.freeze(Object.fromEntries(
        Object.entries(chamberPressure).map(([key, value]) => [
          key,
          value,
        ]),
      )),
      allFlowsM3PerSec: Object.freeze({
        ...flows,
        Q_MV: avFlowsM3PerSec[index],
        Q_TV: avFlowsM3PerSec[index],
      }),
    });
  },
));

const atrialPvReservoirConduitReadback =
  buildPhaseB1AtrialPvReservoirConduitReadbackV1({
    trace: {
      cycleLengthSec: 0.8,
      samples: waveformSamples.map((sample) => ({
        phaseSec: sample.phaseSec,
        bloodVolumesM3: {
          LA: sample.bloodVolumesM3.LA,
          RA: sample.bloodVolumesM3.RA,
        },
        pressuresPa: {
          LA: sample.compartmentAbsolutePressurePa.LA,
          RA: sample.compartmentAbsolutePressurePa.RA,
        },
        allFlowsM3PerSec: {
          Q_MV: sample.allFlowsM3PerSec.Q_MV,
          Q_TV: sample.allFlowsM3PerSec.Q_TV,
        },
      })),
    },
    formalPeriodOneConvergencePass: false,
    sha256Hex: sha256,
  });

const report = withCanonicalContentHash({
  config: Object.freeze({ formalPeriodicProtocol: false }),
  terminal: Object.freeze({
    formalPeriodicConvergencePass: false,
    stageOneGlobalHemodynamicsScreenEligibilityPass: false,
    stageOneGlobalHemodynamicsScreenPass: false,
    completePhysiologyEnvelopeGateImplemented: false,
    physiologicalValidationPass: false,
  }),
  claimBoundary: reviewClaimBoundary,
  metrics: Object.freeze({
    pressureByCompartment: Object.freeze(Object.fromEntries(
      Object.entries(chamberPressure).map(([key, value]) => [key, Object.freeze({
        timeWeightedMeanPa: value,
      })]),
    )),
    circulation: Object.freeze({
      left: Object.freeze({ signedOutflowCardiacOutputLPerMin: 5.2 }),
      right: Object.freeze({ signedOutflowCardiacOutputLPerMin: 5.1 }),
    }),
    volumeByChamber: Object.freeze({
      LV: Object.freeze({ ejectionFractionFromExtrema: 0.6 }),
      RV: Object.freeze({ ejectionFractionFromExtrema: 0.58 }),
    }),
    normalTargetGate: Object.freeze({
      inputEligibilityPass: false,
      physiologyBandComparisonsAreProvisional: true,
      scalarScoreComputed: false,
      candidateRankingPerformed: false,
    }),
    atrialPvLoopMorphology: Object.freeze({
      status: "held-out-not-evaluated-by-operating-point-metrics",
      selectable: false,
      contributesToNormalTargetGate: false,
      contributesToScalarScore: false,
    }),
    claimBoundary: Object.freeze({
      physiologicalValidationClaimed: false,
      atrialPvShapeFittingPerformed: false,
      atrialPvMorphologyCanSelectCandidate: false,
      stageOneHardCardiacOutputUsesSignedValveFlowIntegral: true,
      chamberVolumeAndEjectionFractionAreStageTwoSupportiveReadback: true,
      fixedFillingWindowReadbackIsSecondary: true,
      fixedFillingWindowClinicalDopplerMappingValidated: false,
      fixedFillingWindowReadbackContributesToGate: false,
    }),
  }),
  atrialPvReservoirConduitReadback,
  sourceCodeEvidence: Object.freeze({
    evidenceId: "phase-b1-physiology-envelope-source-code-evidence-v1",
    canonicalObjectHashAlgorithm: "sha256-canonical-json-v1",
    sourceFileHashAlgorithm: "sha256-file-bytes-v1",
    targetPackCanonicalContentSha256: "1".repeat(64),
    protocolCanonicalContentSha256: "2".repeat(64),
    sourceFileSha256: Object.freeze({
      caseBuilder: "3".repeat(64),
      protocol: "4".repeat(64),
      targetPack: "5".repeat(64),
      metrics: "6".repeat(64),
      atrialPvReadback: "8".repeat(64),
      runner: "7".repeat(64),
    }),
    repositoryCommitIdentityClaimed: false,
    evidenceScope: "test",
  }),
});

const waveform = withCanonicalContentHash({
  waveformId: "test",
  cycleIndex: 9,
  cycleStartTimeSec: 7.2,
  cycleLengthSec: 0.8,
  nominalDtSec: 0.004,
  claimBoundary: reviewClaimBoundary,
  samples: waveformSamples,
  sourceReportContentSha256: report.contentSha256,
});

describe("Phase B1 physiology-envelope HTML review", () => {
  it("builds a self-contained fragment with all requested PV, pressure, and flow panels", () => {
    const fragment = buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
      waveform,
      report,
    );
    expect(fragment).toContain('id="pe-review-v1"');
    expect(fragment).toContain('data-fragment-contract="single-root-inline-self-contained-v1"');
    for (const title of [
      "Left-heart pressures",
      "Right-heart pressures",
      "Left valve flows",
      "Right valve flows",
      "Venous inflow",
      "Peripheral flows",
    ]) expect(fragment).toContain(title);
    expect(fragment).toContain("data.formalPeriodicConvergencePass?'PV loop':'PV trajectory'");
    expect(fragment).toContain("title:'Left atrium '+pvTopology");
    expect(fragment).toContain("title:'Left ventricle '+pvTopology");
    expect(fragment).toContain("title:'Right atrium '+pvTopology");
    expect(fragment).toContain("title:'Right ventricle '+pvTopology");
    for (const series of [
      "['p','LA']",
      "['p','LV']",
      "['p','SA']",
      "['p','PV']",
      "['p','RA']",
      "['p','RV']",
      "['p','PA']",
      "['p','SV']",
      "['q','Q_MV']",
      "['q','Q_AoV']",
      "['q','Q_TV']",
      "['q','Q_PuV']",
    ]) expect(fragment).toContain(series);
    expect(fragment).toContain("Volume (mL)");
    expect(fragment).toContain("Pressure (mmHg)");
    expect(fragment).toContain("Flow (mL/s)");
    expect(fragment).toContain("held-out readback");
    expect(fragment).toContain("Atrial PV reservoir / early-conduit readback");
    expect(fragment).toContain("After early-conduit minimum → functional AV closure");
    expect(fragment).toContain("nonperiodic exploratory readback");
    expect(fragment).toContain("never enter fitting, ranking, or the Stage-1 screen");
    expect(fragment).toContain("become loops only after period-1 closure");
    expect(fragment).toContain("does not claim physiological validation");
    expect(fragment).toContain("exploratory timestep");
    expect(fragment).toContain('"v":{"LA":50');
    expect(fragment).toContain('"p":{"LA":7.5006158');
    expect(fragment).toContain('"q":{"Q_MV":-80');
    expect(fragment).toContain("maximum interim refill / rightward");
    expect(fragment).toContain("refill / preceding opening→minimum net emptying");
    expect(atrialPvReservoirConduitReadback.byAtrium.LA.status)
      .toBe("ambiguous");
    expect(fragment).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket/);
    expect(fragment).not.toContain("<!doctype");
    expect(fragment).not.toContain("\\\"");
    expect(fragment.trimStart().startsWith("<div ")).toBe(true);
    expect(fragment.trimEnd().endsWith("</div>")).toBe(true);
  });

  it("wraps the same fragment as a portable standalone document", () => {
    const html = buildPhaseB1PhysiologyEnvelopeStandaloneHtmlV1(
      waveform,
      report,
    );
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<title>Four-chamber physiology envelope review</title>");
    expect(html).toContain('id="pe-review-v1"');
  });

  it("normalizes a machine-epsilon terminal phase before authenticating the readback", () => {
    const roundedTerminalPhaseSec = 0.8 - 3e-15;
    const roundedWaveform = withCanonicalContentHash({
      ...waveform,
      contentSha256: undefined,
      samples: waveform.samples.map((sample, index) =>
        index === waveform.samples.length - 1
          ? {
            ...sample,
            phaseSec: roundedTerminalPhaseSec,
            absoluteTimeSec: waveform.cycleStartTimeSec
              + roundedTerminalPhaseSec,
          }
          : sample),
    });

    expect(buildPhaseB1PhysiologyEnvelopeStandaloneHtmlV1(
      roundedWaveform,
      report,
    )).toContain("maximum interim refill / rightward");
  });

  it("accepts authenticated mechanistic source files beyond the base evidence set", () => {
    const mechanisticReport = withCanonicalContentHash({
      ...report,
      contentSha256: undefined,
      sourceCodeEvidence: {
        ...report.sourceCodeEvidence,
        sourceFileSha256: {
          ...report.sourceCodeEvidence.sourceFileSha256,
          activeTissueClassPrior: "8".repeat(64),
          wallMaterialBinding: "9".repeat(64),
          periodicContinuation: "a".repeat(64),
        },
      },
    });
    const mechanisticWaveform = withCanonicalContentHash({
      ...waveform,
      contentSha256: undefined,
      sourceReportContentSha256: mechanisticReport.contentSha256,
    });

    expect(buildPhaseB1PhysiologyEnvelopeStandaloneHtmlV1(
      mechanisticWaveform,
      mechanisticReport,
    )).toContain('id="pe-review-v1"');
  });

  it("escapes script-closing payloads and fails closed on malformed units or claims", () => {
    const hostileWaveform = withCanonicalContentHash({
      ...waveform,
      waveformId: "</script><script>globalThis.pwned=true</script>",
      contentSha256: undefined,
    });
    const fragment = buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
      hostileWaveform,
      report,
    );
    expect(fragment).not.toContain("</script><script>globalThis.pwned");
    expect(fragment).toContain("\\u003c/script\\u003e");

    const malformedWaveform = withCanonicalContentHash({
      ...waveform,
      contentSha256: undefined,
      samples: waveform.samples.map((sample, index) => index === 1
        ? {
          ...sample,
          allFlowsM3PerSec: { ...sample.allFlowsM3PerSec, Q_MV: "not-a-number" },
        }
        : sample),
    });
    expect(() => buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
      malformedWaveform,
      report,
    )).toThrow(/Q_MV must be finite/);

    expect(() => buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
      waveform,
      withCanonicalContentHash({
        ...report,
        contentSha256: undefined,
        claimBoundary: {
          ...reviewClaimBoundary,
          stageOneGlobalHemodynamicsScreenIsProspectiveOnly: false,
        },
      }),
    )).toThrow(/review-only claim boundary/);

    expect(() => buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
      { ...waveform, cycleIndex: waveform.cycleIndex + 1 },
      report,
    )).toThrow(/contentSha256/);

    const independentlyRehashedReport = withCanonicalContentHash({
      ...report,
      contentSha256: undefined,
      generatedAt: "later-postprocessing-pass",
    });
    expect(() => buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
      waveform,
      independentlyRehashedReport,
    )).toThrow(/does not bind the supplied report/);

    const traceDriftedWaveform = withCanonicalContentHash({
      ...waveform,
      contentSha256: undefined,
      samples: waveform.samples.map((sample, index) => index === 1
        ? {
          ...sample,
          bloodVolumesM3: {
            ...sample.bloodVolumesM3,
            LA: sample.bloodVolumesM3.LA + 1e-9,
          },
        }
        : sample),
    });
    expect(() => buildPhaseB1PhysiologyEnvelopeReviewFragmentV1(
      traceDriftedWaveform,
      withCanonicalContentHash({
        ...report,
        contentSha256: undefined,
      }),
    )).toThrow(/atrial PV readback does not bind/);
  });
});

function withCanonicalContentHash<T extends Record<string, unknown>>(
  value: T,
): Readonly<Omit<T, "contentSha256"> & { contentSha256: string }> {
  const { contentSha256: _omitted, ...payload } = value;
  return Object.freeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, sha256),
  });
}

function sha256(canonicalJsonUtf8: string): string {
  return createHash("sha256").update(canonicalJsonUtf8).digest("hex");
}
