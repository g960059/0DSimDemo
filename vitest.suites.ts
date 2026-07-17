/**
 * Vitest suite ownership registry.
 *
 * Fast, regression, heavy, and rules tests are fail-closed: a new file must be
 * registered explicitly. Research families are fail-safe by prefix so a new
 * long-running bench cannot leak into the fast suite. The manifest test checks
 * that every *.test.ts file belongs to exactly one suite.
 */

export const FAST_SUITE_FILE_BUDGET = 120;

export const fastTests = [
  "__tests__/caseCloud.test.ts",
  "__tests__/casePublish.test.ts",
  "__tests__/caseValidation.test.ts",
  "__tests__/caseWorkspace.test.ts",
  "__tests__/chartsPhaseReplacement.test.ts",
  "__tests__/commonPericardiumV1.test.ts",
  "__tests__/contentI18n.test.ts",
  "__tests__/controllerBinding.test.ts",
  "__tests__/controllerItemControl.test.ts",
  "__tests__/controllerItems.test.ts",
  "__tests__/controls.test.ts",
  "__tests__/energyConjugateTriSegV1.test.ts",
  "__tests__/equilibriumOneFiberPassiveV1.test.ts",
  "__tests__/fiveWallNormalCalciumDriveV1.test.ts",
  "__tests__/homeLinks.test.ts",
  "__tests__/instanceColors.test.ts",
  "__tests__/knobMetadata.test.ts",
  "__tests__/laPvReservoirConduitOrderV1.test.ts",
  "__tests__/land2017AtrialLewalleForceScaleV1.test.ts",
  "__tests__/land2017AtrialPrior.test.ts",
  "__tests__/land2017WholeOrganPriorV1.test.ts",
  "__tests__/landSlsWallMaterialV1.test.ts",
  "__tests__/layoutOps.test.ts",
  "__tests__/legendPosition.test.ts",
  "__tests__/lessonCloud.test.ts",
  "__tests__/lessonDoc.steps.test.ts",
  "__tests__/lessonKnobs.test.ts",
  "__tests__/lessonPersist.test.ts",
  "__tests__/localCirculationTangentsV1.test.ts",
  "__tests__/locales.test.ts",
  "__tests__/mainWireFiveWallLandTriSegProviderV1.test.ts",
  "__tests__/mainWireFiveWallNonCoronaryTransactionV1.test.ts",
  "__tests__/mainWireFiveWallPeriodicClosureV1.test.ts",
  "__tests__/mainWireFourValveDiseasePresetV1.test.ts",
  "__tests__/mainWireHealthyCycleAcceptanceV1.test.ts",
  "__tests__/mainWireNormalAdultBloodVolumeOperatingPointV1.test.ts",
  "__tests__/mainWireNormalAdultFiveWallCycleDiagnosticsV1.test.ts",
  "__tests__/mainWireNormalAdultFiveWallDiagnosticSampleV2.test.ts",
  "__tests__/mainWireNormalAdultFiveWallDtHalvingV1.test.ts",
  "__tests__/mainWireNormalAdultFiveWallPeriodicOrbitComparisonV1.test.ts",
  "__tests__/mainWireNormalAdultFiveWallPeriodicReviewV1.test.ts",
  "__tests__/mainWireNormalAdultFiveWallProviderV1.test.ts",
  "__tests__/mainWireOfficialHealthyPeriodicCheckpointPresetV1.test.ts",
  "__tests__/officialHealthyPeriodicDocumentChainV1.test.ts",
  "__tests__/mainWireScientificResolvedSessionInputV1.test.ts",
  "__tests__/mainWireScientificExactCheckpointV3.test.ts",
  "__tests__/mainWireScientificDocumentsV1.test.ts",
  "__tests__/mainWireScientificDocumentChainV1.test.ts",
  "__tests__/mainWireScientificWorkspaceDocumentV1.test.ts",
  "__tests__/mainWireScientificWorkspaceRendererV1.test.ts",
  "__tests__/mainWireScientificResolvedWorkerProtocolV1.test.ts",
  "__tests__/mainWireScientificResearchPresetCatalogV1.test.ts",
  "__tests__/mainWireScientificResearchPresetWorkerV1.test.ts",
  "__tests__/mainWireQuasiSteadyOrificeValveV1.test.ts",
  "__tests__/mainWireQuasiSteadyOrificeValveV2.test.ts",
  "__tests__/mainWireRestingCycleMorphologyV1.test.ts",
  "__tests__/mainWireValveDiseaseCycleMetricsV1.test.ts",
  "__tests__/moyer2015AtrialEquibiaxialPassiveV1.test.ts",
  "__tests__/nonCoronaryCirculationBackwardEulerV1.test.ts",
  "__tests__/normalAdultFiveWallPriorV1.test.ts",
  "__tests__/notePanel.test.ts",
  "__tests__/noteViewRefs.test.ts",
  "__tests__/notes.roundtrip.test.ts",
  "__tests__/officialAfterloadCase.test.ts",
  "__tests__/panelGrid.test.ts",
  "__tests__/panelView.test.ts",
  "__tests__/parallelOneStateSlsV1.test.ts",
  "__tests__/publishDialogState.test.ts",
  "__tests__/publishReviewOverlay.test.ts",
  "__tests__/publishStatusBadge.test.ts",
  "__tests__/pvLoopDebugOverlay.test.ts",
  "__tests__/pvLoopPoints.test.ts",
  "__tests__/pvLoopTransition.test.ts",
  "__tests__/rawParameterCatalog.test.ts",
  "__tests__/readExplore.test.ts",
  "__tests__/readingConversion.test.ts",
  "__tests__/readingPresenter.realNotePanel.test.ts",
  "__tests__/readingPresenter.test.ts",
  "__tests__/scientificWorkbenchOfficialCycleV1.test.ts",
  "__tests__/scientificWorkbenchPageV1.test.ts",
  "__tests__/scientificWorkbenchTerminalCycleV1.test.ts",
  "__tests__/simulationReleaseV1.test.ts",
  "__tests__/testSuiteManifest.test.ts",
  "__tests__/usePreviewRuntime.test.ts",
  "__tests__/waveformPhaseWipe.test.ts",
  "__tests__/wholeHeartMechanicsContractV1.test.ts",
  "__tests__/workbenchAuthoredViews.test.ts",
  "__tests__/workbenchDefaults.test.ts",
  "__tests__/workbenchGraphBoardLayout.test.ts",
  "__tests__/workbenchLoadDebugOverlay.test.ts",
  "__tests__/workbenchP1aStructuralHosts.test.ts",
  "__tests__/workbenchPanelModel.test.ts",
  "__tests__/workbenchPersistence.test.ts",
  "__tests__/workbenchViewSpec.test.ts",
  "components/__tests__/guytonPaneChrome.test.ts",
  "components/__tests__/guytonStarlingWorkerClient.test.ts",
  "components/__tests__/guytonSteadyMapTransition.test.ts",
  "components/__tests__/pvLoopPoints.test.ts",
  "engine/__tests__/activeStressSourcePressureAdapter.test.ts",
  "engine/__tests__/caseDoc.test.ts",
  "engine/__tests__/casePersist.test.ts",
  "engine/__tests__/caseResolve.test.ts",
  "engine/__tests__/chambers.test.ts",
  "engine/__tests__/circulationGraphKernelV1.test.ts",
  "engine/__tests__/flowIntegrals.test.ts",
  "engine/__tests__/guytonStarlingWorkerQueue.test.ts",
  "engine/__tests__/headroomReview.test.ts",
  "engine/__tests__/instanceKnobs.test.ts",
  "engine/__tests__/leftFillingReview.test.ts",
  "engine/__tests__/lessonDoc.test.ts",
  "engine/__tests__/modelCoreExperimentalActiveProviderState.test.ts",
  "engine/__tests__/modelCoreRuntimeActiveSource.test.ts",
  "engine/__tests__/officialCaseBridge.test.ts",
  "engine/__tests__/starlingFit.test.ts",
  "engine/__tests__/transitionSteadyProtocol.test.ts",
  "engine/__tests__/valveTiming.test.ts",
] as const;

export const regressionTests = [
  "engine/__tests__/atrialPhysiologyBridgeV2.test.ts",
  "engine/__tests__/baseline.test.ts",
  "engine/__tests__/caseContract.test.ts",
  "engine/__tests__/chambersElastanceShape.test.ts",
  "engine/__tests__/chambersOperatingPoint.test.ts",
  "engine/__tests__/chambersReservoirBehavior.test.ts",
  "engine/__tests__/chambersReservoirGates.test.ts",
  "engine/__tests__/coronary.test.ts",
  "engine/__tests__/guytonStarling.test.ts",
  "engine/__tests__/guytonVascular.test.ts",
  "engine/__tests__/health.test.ts",
  "engine/__tests__/hemorrhage.test.ts",
  "engine/__tests__/interactionMechanics.test.ts",
  "engine/__tests__/knobs.test.ts",
  "engine/__tests__/modelCoreAtrialPressureDecomposition.test.ts",
  "engine/__tests__/objective.test.ts",
  "engine/__tests__/observables.test.ts",
  "engine/__tests__/officialCases.test.ts",
  "engine/__tests__/previewController.test.ts",
  "engine/__tests__/settling.test.ts",
  "engine/__tests__/stateContract.test.ts",
  "engine/__tests__/steadyCrossCheck.test.ts",
  "engine/__tests__/steadyJob.test.ts",
  "engine/__tests__/transitionSteadyWorker.test.ts",
  "engine/__tests__/valveFlowMetrics.test.ts",
  "engine/__tests__/verification.test.ts",
  "engine/__tests__/verifyGuytonStarling.test.ts",
] as const;

export const heavyTests = [
  "engine/__tests__/guytonStarlingWorkerCore.test.ts",
  "engine/__tests__/starlingLowPreloadDebug.test.ts",
] as const;

export const rulesTests = [
  "__tests__/firestoreRules.emulator.test.ts",
] as const;

/** Current main-wire scientific lane. Exact unit tests may opt into fastTests. */
export const canonicalScientificTestGlobs = [
  "__tests__/mainWire*.test.ts",
] as const;

/**
 * Historical research lanes. These files may rerun long parameter searches or
 * compare committed artifacts and therefore stay manual-only by default.
 */
export const archivedResearchTestGlobs = [
  "__tests__/atrialAVPlane*.test.ts",
  "__tests__/mechanics2*.test.ts",
  "__tests__/mechanistic*.test.ts",
  "__tests__/morphologyPhysiology*.test.ts",
  "__tests__/myocardium*.test.ts",
  "__tests__/workConjugate*.test.ts",
  "__tests__/pvLoopArterialLoadZcReflectionDiagnosticComparator.test.ts",
  "__tests__/pvLoopCurrentMainBaselineSnapshot.test.ts",
  "__tests__/pvLoopFillingLimbCorrelationReadiness.test.ts",
  "__tests__/pvLoopFillingLimbDiagnosticComparator.test.ts",
  "__tests__/pvLoopMorphologyQualityRunner.test.ts",
  "__tests__/pvLoopZcReflectionComparatorReadiness.test.ts",
] as const;

export type TestSuiteName =
  | "fast"
  | "regression"
  | "canonical-scientific"
  | "archived-research"
  | "heavy"
  | "rules";

const fastSet = new Set<string>(fastTests);
const regressionSet = new Set<string>(regressionTests);
const heavySet = new Set<string>(heavyTests);
const rulesSet = new Set<string>(rulesTests);

const archivedResearchPrefixes = [
  "__tests__/atrialAVPlane",
  "__tests__/mechanics2",
  "__tests__/mechanistic",
  "__tests__/morphologyPhysiology",
  "__tests__/myocardium",
  "__tests__/workConjugate",
] as const;

const archivedResearchExact = new Set<string>([
  "__tests__/pvLoopArterialLoadZcReflectionDiagnosticComparator.test.ts",
  "__tests__/pvLoopCurrentMainBaselineSnapshot.test.ts",
  "__tests__/pvLoopFillingLimbCorrelationReadiness.test.ts",
  "__tests__/pvLoopFillingLimbDiagnosticComparator.test.ts",
  "__tests__/pvLoopMorphologyQualityRunner.test.ts",
  "__tests__/pvLoopZcReflectionComparatorReadiness.test.ts",
]);

export function isCanonicalScientificTest(file: string): boolean {
  return !fastSet.has(file)
    && file.startsWith("__tests__/mainWire")
    && file.endsWith(".test.ts");
}

export function isArchivedResearchTest(file: string): boolean {
  return !fastSet.has(file)
    && (archivedResearchExact.has(file)
      || (file.endsWith(".test.ts")
        && archivedResearchPrefixes.some((prefix) => file.startsWith(prefix))));
}

export function classifyTestFile(file: string): TestSuiteName | null {
  if (fastSet.has(file)) return "fast";
  if (regressionSet.has(file)) return "regression";
  if (heavySet.has(file)) return "heavy";
  if (rulesSet.has(file)) return "rules";
  if (isCanonicalScientificTest(file)) return "canonical-scientific";
  if (isArchivedResearchTest(file)) return "archived-research";
  return null;
}
