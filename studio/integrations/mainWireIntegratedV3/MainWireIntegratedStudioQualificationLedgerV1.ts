import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";

export const MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_LEDGER_V1_ID =
  "circleheart.main-wire.standard-63-public-mechanism-qualification-ledger-v1" as const;

export type MainWireIntegratedStudioComponentDirectionStatusV1 =
  | "verified"
  | "partial"
  | "not-run";

export type MainWireIntegratedStudioQualificationFamilyV1 = Readonly<{
  familyId: string;
  controlIds: readonly string[];
  representativeOutputIds: readonly string[];
  evidence: Readonly<{
    definitionOwnership: "verified";
    componentDirection: MainWireIntegratedStudioComponentDirectionStatusV1;
    closedLoopDirection: "not-qualified";
    clinicalValidation: "not-established";
    officialDirectionalClaimEligible: false;
  }>;
  literatureAnchorIds: readonly string[];
}>;

export type MainWireIntegratedStudioLiteratureAnchorV1 = Readonly<{
  anchorId: string;
  doi: string;
  role: "model-source" | "physiology-context" | "measurement-context";
  implementationTranscribedFromSource: boolean;
  magnitudeValidationEstablished: boolean;
}>;

export const MAIN_WIRE_INTEGRATED_STUDIO_LITERATURE_ANCHORS_V1 = Object.freeze([
  literatureAnchor({
    anchorId: "guyton-venous-return-1955",
    doi: "10.1152/physrev.1955.35.1.123",
    role: "physiology-context",
  }),
  literatureAnchor({
    anchorId: "land-human-cardiomyocyte-2017",
    doi: "10.1016/j.yjmcc.2017.03.008",
    role: "model-source",
    implementationTranscribedFromSource: true,
  }),
  literatureAnchor({
    anchorId: "klotz-edpvr-2006",
    doi: "10.1152/ajpheart.01240.2005",
    role: "measurement-context",
  }),
  literatureAnchor({
    anchorId: "gorlin-generalized-valve-area-1990",
    doi: "10.1016/0735-1097(90)90210-G",
    role: "measurement-context",
  }),
  literatureAnchor({
    anchorId: "fenn-rahn-otis-alveolar-gas-1946",
    doi: "10.1152/ajplegacy.1946.146.5.637",
    role: "physiology-context",
  }),
  literatureAnchor({
    anchorId: "young-tsai-steady-stenosis-1973",
    doi: "10.1016/0021-9290(73)90099-7",
    role: "model-source",
    implementationTranscribedFromSource: true,
  }),
  literatureAnchor({
    anchorId: "algranati-myocardium-coronary-interaction-2010",
    doi: "10.1152/ajpheart.00925.2009",
    role: "physiology-context",
  }),
]);

const CONTROL = MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1;

/**
 * Evidence ledger for every public Standard-63 control family.
 *
 * A direct fixture/kernel binding is not promoted to a closed-loop
 * physiological direction. Those directions remain intentionally unavailable
 * until a versioned observation window and eligibility policy are executed.
 */
export const MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1 =
  Object.freeze([
    family({
      familyId: "regular-sinus-heart-rate",
      controlIds: [CONTROL.heartRateBpm],
      representativeOutputIds: ["rhythm.heart-rate.instantaneous"],
      componentDirection: "verified",
      literatureAnchorIds: [],
    }),
    family({
      familyId: "fixed-total-blood-volume",
      controlIds: [CONTROL.totalBloodVolumeMl],
      representativeOutputIds: [
        "hemodynamics.volume.end-diastolic.LV-at-MV-closure",
        "hemodynamics.pressure.mean.RA",
      ],
      componentDirection: "partial",
      literatureAnchorIds: ["guyton-venous-return-1955"],
    }),
    family({
      familyId: "systemic-and-pulmonary-resistive-loss",
      controlIds: [CONTROL.systemicResistance, CONTROL.pulmonaryResistance],
      representativeOutputIds: [
        "hemodynamics.resistance.systemic-effective",
        "hemodynamics.resistance.pulmonary-effective",
        "hemodynamics.pressure.mean.Ao",
        "hemodynamics.pressure.mean.PA",
      ],
      componentDirection: "partial",
      literatureAnchorIds: [],
    }),
    family({
      familyId: "vascular-capacitance-and-stiffness",
      controlIds: [CONTROL.venousTone, CONTROL.arterialStiffness],
      representativeOutputIds: [
        "hemodynamics.return.systemic-venous",
        "hemodynamics.pressure.pulse.Ao",
      ],
      componentDirection: "partial",
      literatureAnchorIds: ["guyton-venous-return-1955"],
    }),
    family({
      familyId: "constant-respiratory-external-pressure",
      controlIds: [CONTROL.peepCmH2O],
      representativeOutputIds: [
        "respiration.pressure.alveolar",
        "respiration.pressure.pleural",
      ],
      componentDirection: "verified",
      literatureAnchorIds: [],
    }),
    family({
      familyId: "five-wall-active-tension",
      controlIds: [
        CONTROL.ventricularContractilityScale,
        CONTROL.activeTensionLA,
        CONTROL.activeTensionLVFW,
        CONTROL.activeTensionSEP,
        CONTROL.activeTensionRVFW,
        CONTROL.activeTensionRA,
      ],
      representativeOutputIds: [
        "hemodynamics.pressure.systolic.LV",
        "hemodynamics.pressure.systolic.RV",
        "myocardium.work.external.LV-transmural-pressure-volume-path",
      ],
      componentDirection: "partial",
      literatureAnchorIds: ["land-human-cardiomyocyte-2017"],
    }),
    family({
      familyId: "five-wall-passive-stiffness",
      controlIds: [
        CONTROL.passiveStiffnessLA,
        CONTROL.passiveStiffnessLVFW,
        CONTROL.passiveStiffnessSEP,
        CONTROL.passiveStiffnessRVFW,
        CONTROL.passiveStiffnessRA,
      ],
      representativeOutputIds: [
        "hemodynamics.pressure.transmural.end-diastolic.LV-at-MV-closure",
        "hemodynamics.volume.end-diastolic.LV-at-MV-closure",
      ],
      componentDirection: "verified",
      literatureAnchorIds: ["klotz-edpvr-2006"],
    }),
    family({
      familyId: "five-wall-prescribed-calcium-decay",
      controlIds: [
        CONTROL.calciumDecayTimeLA,
        CONTROL.calciumDecayTimeLVFW,
        CONTROL.calciumDecayTimeSEP,
        CONTROL.calciumDecayTimeRVFW,
        CONTROL.calciumDecayTimeRA,
      ],
      representativeOutputIds: [
        "hemodynamics.pressure-rate.minimum-accepted-step.absolute.LV",
      ],
      componentDirection: "partial",
      literatureAnchorIds: [],
    }),
    family({
      familyId: "four-valve-forward-effective-area",
      controlIds: [
        CONTROL.mvMaximumForwardEoaCm2,
        CONTROL.aovMaximumForwardEoaCm2,
        CONTROL.tvMaximumForwardEoaCm2,
        CONTROL.pvMaximumForwardEoaCm2,
      ],
      representativeOutputIds: [
        "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.AoV",
        "hemodynamics.valve-volume.net.AoV",
      ],
      componentDirection: "verified",
      literatureAnchorIds: ["gorlin-generalized-valve-area-1990"],
    }),
    family({
      familyId: "four-valve-closed-reverse-effective-area",
      controlIds: [
        CONTROL.mvClosedReverseEroaCm2,
        CONTROL.aovClosedReverseEroaCm2,
        CONTROL.tvClosedReverseEroaCm2,
        CONTROL.pvClosedReverseEroaCm2,
      ],
      representativeOutputIds: [
        "hemodynamics.valve-volume.reverse.MV",
        "hemodynamics.valve-regurgitant-fraction.same-valve.MV",
        "hemodynamics.output.effective-native-left",
      ],
      componentDirection: "verified",
      literatureAnchorIds: ["gorlin-generalized-valve-area-1990"],
    }),
    family({
      familyId: "whole-body-beat-mean-oxygen-boundary",
      controlIds: [
        CONTROL.oxygenHemoglobinGPerDl,
        CONTROL.oxygenInspiredOxygenFraction01,
        CONTROL.oxygenArterialCarbonDioxidePressureMmHg,
        CONTROL.oxygenRespiratoryExchangeRatio,
        CONTROL.oxygenBarometricPressureMmHg,
        CONTROL.oxygenTrueShuntFraction01,
        CONTROL.oxygenTargetConsumptionMlPerMin,
      ],
      representativeOutputIds: [
        "oxygen.content.arterial",
        "oxygen.delivery.systemic",
        "oxygen.extraction-ratio.required",
      ],
      componentDirection: "verified",
      literatureAnchorIds: ["fenn-rahn-otis-alveolar-gas-1946"],
    }),
    family({
      familyId: "common-pericardium",
      controlIds: [
        CONTROL.pericardiumReferenceCapacityScale,
        CONTROL.pericardiumPressureScale,
        CONTROL.pericardiumExponentialStiffnessScale,
        CONTROL.pericardiumPrescribedFluidVolumeMl,
      ],
      representativeOutputIds: [
        "pericardium.pressure.excess",
        "pericardium.energy.stored",
        "pericardium.volume.fluid",
      ],
      componentDirection: "partial",
      literatureAnchorIds: [],
    }),
    family({
      familyId: "coronary-focal-diameter-loss",
      controlIds: [
        CONTROL.coronaryFocalDiameterLossLAD,
        CONTROL.coronaryFocalDiameterLossLCx,
        CONTROL.coronaryFocalDiameterLossRCA,
      ],
      representativeOutputIds: [
        "coronary.pressure-loss.focal.LAD",
        "coronary.pressure.post-focal.LAD",
        "coronary.flow.inlet.LAD",
      ],
      componentDirection: "verified",
      literatureAnchorIds: [
        "young-tsai-steady-stenosis-1973",
        "algranati-myocardium-coronary-interaction-2010",
      ],
    }),
    family({
      familyId: "coronary-structural-r1-resistance",
      controlIds: [
        CONTROL.coronaryStructuralR1LADSubepicardial,
        CONTROL.coronaryStructuralR1LADSubendocardial,
        CONTROL.coronaryStructuralR1LCxSubepicardial,
        CONTROL.coronaryStructuralR1LCxSubendocardial,
        CONTROL.coronaryStructuralR1RCASubepicardial,
        CONTROL.coronaryStructuralR1RCASubendocardial,
      ],
      representativeOutputIds: [
        "coronary.flow.layer-r1.LAD.subendocardial",
        "coronary.tone-resistance-scale.LAD.subendocardial",
      ],
      componentDirection: "verified",
      literatureAnchorIds: ["algranati-myocardium-coronary-interaction-2010"],
    }),
    family({
      familyId: "coronary-structural-rm-resistance",
      controlIds: [
        CONTROL.coronaryStructuralRmLADSubepicardial,
        CONTROL.coronaryStructuralRmLADSubendocardial,
        CONTROL.coronaryStructuralRmLCxSubepicardial,
        CONTROL.coronaryStructuralRmLCxSubendocardial,
        CONTROL.coronaryStructuralRmRCASubepicardial,
        CONTROL.coronaryStructuralRmRCASubendocardial,
      ],
      representativeOutputIds: [
        "coronary.flow.layer-qm-internal.LAD.subendocardial",
        "coronary.flow.layer-r2.LAD.subendocardial",
      ],
      componentDirection: "verified",
      literatureAnchorIds: ["algranati-myocardium-coronary-interaction-2010"],
    }),
  ]);

export type MainWireIntegratedStudioQualificationAuditV1 = Readonly<{
  ledgerId: typeof MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_LEDGER_V1_ID;
  status: "pass" | "fail";
  registeredControlCount: number;
  coveredControlCount: number;
  missingControlIds: readonly string[];
  duplicateControlIds: readonly string[];
  unknownControlIds: readonly string[];
  unknownRepresentativeOutputIds: readonly string[];
  unknownLiteratureAnchorIds: readonly string[];
  closedLoopDirectionalClaimsQualified: false;
  clinicalValidationClaimed: false;
}>;

export function auditMainWireIntegratedStudioQualificationLedgerV1(
  registeredControlIds: readonly string[],
  registeredOutputIds: readonly string[],
): MainWireIntegratedStudioQualificationAuditV1 {
  const registeredControls = new Set(registeredControlIds);
  const registeredOutputs = new Set(registeredOutputIds);
  const literatureAnchors = new Set(
    MAIN_WIRE_INTEGRATED_STUDIO_LITERATURE_ANCHORS_V1.map(
      ({ anchorId }) => anchorId,
    ),
  );
  const controlCounts = new Map<string, number>();
  const unknownRepresentativeOutputIds = new Set<string>();
  const unknownLiteratureAnchorIds = new Set<string>();

  for (const familyDefinition of MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1) {
    for (const controlId of familyDefinition.controlIds) {
      controlCounts.set(controlId, (controlCounts.get(controlId) ?? 0) + 1);
    }
    for (const outputId of familyDefinition.representativeOutputIds) {
      if (!registeredOutputs.has(outputId)) {
        unknownRepresentativeOutputIds.add(outputId);
      }
    }
    for (const anchorId of familyDefinition.literatureAnchorIds) {
      if (!literatureAnchors.has(anchorId)) {
        unknownLiteratureAnchorIds.add(anchorId);
      }
    }
  }

  const coveredControlIds = [...controlCounts.keys()];
  const missingControlIds = registeredControlIds.filter(
    (controlId) => !controlCounts.has(controlId),
  );
  const duplicateControlIds = coveredControlIds.filter(
    (controlId) => (controlCounts.get(controlId) ?? 0) > 1,
  );
  const unknownControlIds = coveredControlIds.filter(
    (controlId) => !registeredControls.has(controlId),
  );
  const problems = [
    missingControlIds,
    duplicateControlIds,
    unknownControlIds,
    [...unknownRepresentativeOutputIds],
    [...unknownLiteratureAnchorIds],
  ];

  return Object.freeze({
    ledgerId: MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_LEDGER_V1_ID,
    status: problems.every((problem) => problem.length === 0) ? "pass" : "fail",
    registeredControlCount: registeredControlIds.length,
    coveredControlCount: coveredControlIds.length,
    missingControlIds: sorted(missingControlIds),
    duplicateControlIds: sorted(duplicateControlIds),
    unknownControlIds: sorted(unknownControlIds),
    unknownRepresentativeOutputIds: sorted([
      ...unknownRepresentativeOutputIds,
    ]),
    unknownLiteratureAnchorIds: sorted([...unknownLiteratureAnchorIds]),
    closedLoopDirectionalClaimsQualified: false,
    clinicalValidationClaimed: false,
  });
}

function family(
  input: Omit<
    MainWireIntegratedStudioQualificationFamilyV1,
    "evidence"
  > &
    Readonly<{
      componentDirection: MainWireIntegratedStudioComponentDirectionStatusV1;
    }>,
): MainWireIntegratedStudioQualificationFamilyV1 {
  return Object.freeze({
    familyId: input.familyId,
    controlIds: Object.freeze([...input.controlIds]),
    representativeOutputIds: Object.freeze([
      ...input.representativeOutputIds,
    ]),
    evidence: Object.freeze({
      definitionOwnership: "verified" as const,
      componentDirection: input.componentDirection,
      closedLoopDirection: "not-qualified" as const,
      clinicalValidation: "not-established" as const,
      officialDirectionalClaimEligible: false as const,
    }),
    literatureAnchorIds: Object.freeze([...input.literatureAnchorIds]),
  });
}

function literatureAnchor(
  input: Omit<
    MainWireIntegratedStudioLiteratureAnchorV1,
    "implementationTranscribedFromSource" | "magnitudeValidationEstablished"
  > &
    Readonly<{ implementationTranscribedFromSource?: boolean }>,
): MainWireIntegratedStudioLiteratureAnchorV1 {
  return Object.freeze({
    ...input,
    implementationTranscribedFromSource:
      input.implementationTranscribedFromSource ?? false,
    magnitudeValidationEstablished: false,
  });
}

function sorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...values].sort());
}
