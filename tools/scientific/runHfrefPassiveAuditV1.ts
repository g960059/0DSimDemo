import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { createHfrefRemodelingResearchFixtureV1 as create } from "./runHfrefRemodelingAblationV1";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";
import { MAIN_WIRE_NORMAL_ADULT_MECHANICS_FIXTURE_VOLUMES_ML_V1 as fixedVolumes,
  createMaterialKernelsWithMechanicsResearchInputsV1 as kernels,
  type MainWireNormalAdultWallMaterialReadbackV1 as WallReadback } from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import { createMainWireFiveWallLandTriSegProviderV1 as provider,
  type MainWireFiveWallLandTriSegReadbackV1 as Readback } from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import { MAIN_WIRE_STANDARD71_WALL_MATERIAL_V1 as material } from "@/engine/myocardium/experiments/MainWireIntegratedModelStandard71FixtureV1";
import { MAIN_WIRE_VENTRICULAR_ROUNDED_EJECTION_COLD_MAXIMUM_ITERATIONS_V1 as coldIterations } from "@/engine/myocardium/mechanics/MainWireVentricularRoundedEjectionProfileV1";
import { evaluateTriSegGeometryV1 } from "@/engine/myocardium/mechanics/energyConjugateTriSegV1";
import { evaluateMainWireCommonPericardiumBindingV1 as bag } from "@/engine/myocardium/mechanics/mainWireCommonPericardiumBindingV1";

const protocol = "hfref-zero-calcium-relaxed-static-conditional-pv-v1";
const zeroDrive = { freeCalciumUMByWall: { LA: 0, LVFW: 0, SEP: 0, RVFW: 0, RA: 0 } };
type Construction = Awaited<ReturnType<typeof create>>;

export async function createHfrefPassiveConstructionV1(point: Parameters<typeof create>[0]) {
  const original = await create(point);
  // At zero Ca the iterative Land cold solve can retain tiny active stress.
  // Remove the active branch explicitly for this static constitutive audit,
  // not by subtracting pressure or changing the candidate's runtime material.
  const passiveMaterial = { ...material, parameterSetId: `${protocol}-active-off`, viableActiveFraction01: 0 };
  const passiveProvider = provider({ ...original.providerParameters, parameterSetId: protocol,
    materialByWall: kernels(original.candidate.mechanismResearchInputs.chamberMechanics, passiveMaterial, coldIterations) });
  return { ...original, fixture: { ...original.fixture, provider: passiveProvider } };
}

/** Existing cold material/shape solver at zero Ca. No cycle, fitted EDPVR,
 * externally overwritten pressure, or checkpoint exchange is involved. */
export function observeHfrefPassivePointV1(source: Construction, lvMl: number, rvMl: number) {
  const volumes = { ...fixedVolumes, LV: lvMl, RV: rvMl };
  const result = source.fixture.provider.initializeCold({ timeSec: 0, volumesMl: volumes, drivingInputs: zeroDrive });
  const r = result.diagnostics.readback as unknown as Readback;
  if (!result.diagnostics.converged || !r.strictLocalStableEquilibrium || !r.jacobianSymmetricWithinTolerance) {
    throw new Error(`Passive cold equilibrium unavailable: ${result.diagnostics.errors.join("; ")}`);
  }
  // Atrial cavity volumes are prescribed controls; atrial pressure does not
  // enter this transmural ventricular solve. Check the three ventricular walls.
  const material = [r.wallMaterialReadbackByWall.LVFW, r.wallMaterialReadbackByWall.SEP,
    r.wallMaterialReadbackByWall.RVFW] as unknown as WallReadback[];
  const maximumActivePa = Math.max(...material.map(w => Math.abs(w.landActiveKirchhoffStressPa)));
  const maximumSlsPa = Math.max(...material.map(w => Math.abs(w.slsOverstressPa)));
  if (maximumActivePa > 1e-7 || maximumSlsPa > 1e-7) throw new Error(`Cold state is not a relaxed passive control: active=${maximumActivePa} Pa; SLS=${maximumSlsPa} Pa`);
  const geometry = evaluateTriSegGeometryV1({ leftVentricularCavityVolumeM3: lvMl * 1e-6,
    rightVentricularCavityVolumeM3: rvMl * 1e-6, coordinates: r.internalCoordinates, walls: source.construction.trisegWalls });
  const pericardium = bag(source.fixture.pericardium, volumes);
  return { volumes, pressuresMmHg: { LV: result.transmuralPressuresMmHg.LV, RV: result.transmuralPressuresMmHg.RV }, pericardium,
    // Membrane pressure is transmural; the common bag is recorded separately.
    cavityPressureWithoutPleuralOffsetMmHg: {
      LV: result.transmuralPressuresMmHg.LV + pericardium.excessPressureMmHg,
      RV: result.transmuralPressuresMmHg.RV + pericardium.excessPressureMmHg },
    residualNorm: result.diagnostics.residualNorm,
    generalizedForces: r.rawAlgorithmicGeneralizedForce,
    scaledGeneralizedForces: r.scaledAlgorithmicGeneralizedForceByOneJ,
    internalMinimumEigenvalue: r.symmetricJacobianMinimumEigenvalueByOneJ,
    maximumActivePa, maximumSlsPa, geometry,
    passiveParameterHashes: material.map(w => ({ wall: w.wallId, hash: w.passiveParameterIdentityHash })),
    formalDynamicEdpvrClaimed: false };
}

export function matchHfrefPassivePressureV1(source: Construction, rvMl: number, targetMmHg: number,
  lowerMl: number, upperMl: number) {
  const observe = (v: number) => observeHfrefPassivePointV1(source, v, rvMl);
  let lo = observe(lowerMl), hi = observe(upperMl), current = lo;
  if (!(lo.pressuresMmHg.LV <= targetMmHg && hi.pressuresMmHg.LV >= targetMmHg)) throw new Error("Passive target is not bracketed");
  for (let i = 0; i < 40; i++) {
    current = observe((lo.volumes.LV + hi.volumes.LV) / 2);
    if (Math.abs(current.pressuresMmHg.LV - targetMmHg) < 1e-7) return current;
    if (current.pressuresMmHg.LV < targetMmHg) lo = current; else hi = current;
  }
  throw new Error("Passive pressure matching did not converge");
}

function cavityTangent(source: Construction, point: ReturnType<typeof observeHfrefPassivePointV1>) {
  const { LV: lv, RV: rv } = point.volumes, h = .05;
  const lp = observeHfrefPassivePointV1(source, lv + h, rv), lm = observeHfrefPassivePointV1(source, lv - h, rv);
  const rp = observeHfrefPassivePointV1(source, lv, rv + h), rm = observeHfrefPassivePointV1(source, lv, rv - h);
  const a = (lp.pressuresMmHg.LV - lm.pressuresMmHg.LV) / (2 * h);
  const b = (rp.pressuresMmHg.LV - rm.pressuresMmHg.LV) / (2 * h);
  const c = (lp.pressuresMmHg.RV - lm.pressuresMmHg.RV) / (2 * h);
  const d = (rp.pressuresMmHg.RV - rm.pressuresMmHg.RV) / (2 * h);
  return { method: "central-difference-relaxed-cold-equilibria", volumeStepMl: h,
    matrixMmHgPerMl: [[a, b], [c, d]], crossDerivativeMismatch: Math.abs(b - c),
    symmetricMinimumEigenvalue: (a + d - Math.hypot(a - d, b + c)) / 2 };
}

async function main() {
  const { values } = parseArgs({ options: { output: { type: "string" }, smoke: { type: "boolean" } } });
  if (values.smoke) {
    for (const referenceArea of [1, 1.15]) {
      const source = await createHfrefPassiveConstructionV1({ active: .35, referenceArea, wallVolume: 1.25 });
      for (const lv of [120, 180, 240]) {
        const p = observeHfrefPassivePointV1(source, lv, 140);
        process.stdout.write(JSON.stringify({ referenceArea, lv, pressures: p.pressuresMmHg,
          active: p.maximumActivePa, sls: p.maximumSlsPa, residual: p.residualNorm }) + "\n");
      }
    }
    return;
  }
  if (!values.output) throw new Error("Require --output NEW_DIRECTORY");
  const output = resolve(values.output); await mkdir(output);
  const snapshot = await beginFittingSourceSnapshotV1(join(output, "execution"));
  const points = [1, 1.15].flatMap(referenceArea => [1, 1.25].map(wallVolume => ({ active: .35, referenceArea, wallVolume })));
  const plan = { protocol, points, rvVolumesMl: [110, 140, 170], lvVolumesMl: Array.from({ length: 23 }, (_, i) => 80 + i * 10),
    targetLvTransmuralPressuresMmHg: [5, 10, 15, 20, 25], fixedAtrialVolumesMl: { LA: fixedVolumes.LA, RA: fixedVolumes.RA },
    calciumUM: 0, ventricularActiveFraction01: 0, sls: "cold-relaxed-zero-overstress", sourceSha256: snapshot.sourceSha256,
    interpretation: "Conditional static relation at fixed RV volume, not matched RV pressure or patient dynamic EDPVR. Actual tissue occupancy and fixed pericardial capacity retained; bag pressure reported separately.",
    scientificSources: ["https://doi.org/10.1007/s10439-009-9774-2", "https://doi.org/10.1016/0735-1097(89)90102-2"],
    newPhysiologicalGate: false, geometryDomainAdmitted: false };
  const planPath = join(output, "plan.json"); await writeFile(planPath, JSON.stringify(plan, null, 2) + "\n", { flag: "wx" });
  const cases = [];
  for (const point of points) {
    const source = await createHfrefPassiveConstructionV1(point), curves = [];
    for (const rv of plan.rvVolumesMl) {
      const grid = plan.lvVolumesMl.map(lv => {
        try { return { status: "observed" as const, observation: observeHfrefPassivePointV1(source, lv, rv) }; }
        catch (error) { return { status: "unresolved" as const, lv, rv, issue: String(error) }; }
      });
      const matched = plan.targetLvTransmuralPressuresMmHg.map(target => {
        const i = grid.findIndex((g, j) => g.status === "observed" && g.observation.pressuresMmHg.LV <= target
          && grid[j + 1]?.status === "observed" && grid[j + 1]!.observation!.pressuresMmHg.LV >= target);
        if (i < 0) return { target, status: "unresolved" as const, issue: "no-adjacent-valid-bracket" };
        try {
          const observation = matchHfrefPassivePressureV1(source, rv, target, grid[i]!.observation!.volumes.LV, grid[i + 1]!.observation!.volumes.LV);
          return { target, status: "observed" as const, observation, tangent: cavityTangent(source, observation) };
        } catch (error) { return { target, status: "unresolved" as const, issue: String(error) }; }
      });
      curves.push({ rvVolumeMl: rv, grid, matched });
    }
    cases.push({ point, constructionSha256: source.constructionSha256, curves });
  }
  const body = { plan, cases, publicPromotionAuthorized: false };
  const resultPath = join(output, "report.json");
  await writeFile(resultPath, JSON.stringify({ ...body, reportSha256: await sha256CanonicalJsonHex(body) }, null, 2) + "\n", { flag: "wx" });
  await snapshot.finish([planPath, resultPath]);
  for (const c of cases) process.stdout.write(canonicalJsonStringify({ point: c.point,
    curves: c.curves.map(v => ({ rv: v.rvVolumeMl, targets: v.matched.map(p => p.status === "observed"
      ? { pressure: p.target, lv: p.observation.volumes.LV, rvPressure: p.observation.pressuresMmHg.RV,
        pericardialPressure: p.observation.pericardium.excessPressureMmHg, tangent: p.tangent }
      : p) })) }) + "\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
}
