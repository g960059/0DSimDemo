import { selectHotPathIntegrityTierV1 } from '@/engine/hotPathIntegrityTierV1';
import { MainWireIntegratedModelStandard71TypedAuthoritySessionV1 as Session } from '@/engine/vnext/MainWireIntegratedModelStandard71TypedAuthoritySessionV1';
import { writeFile } from 'node:fs/promises';

const tier = process.env.AUDIT_TIER === 'full-invariant' ? 'full-invariant' : 'hot-path-lean';
const coldSeedControl = process.env.AUDIT_SEED === 'full-invariant';
selectHotPathIntegrityTierV1(coldSeedControl ? 'full-invariant' : tier);
function differences(left: unknown, right: unknown, path = ''): { path: string; left: unknown; right: unknown; absoluteDifference?: number }[] {
  if (Object.is(left, right)) return [];
  if (left !== null && right !== null && typeof left === 'object' && typeof right === 'object') {
    const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(k => differences(a[k], b[k], path + '.' + k));
  }
  return [{ path, left, right, ...(typeof left === 'number' && typeof right === 'number' ? { absoluteDifference: Math.abs(left - right) } : {}) }];
}
const source = await Session.create();
source.advanceStructuralAnalysisToPresentationTimeV1(.01);
selectHotPathIntegrityTierV1(tier);
const saved = await source.checkpointStandard71Exact();
const restored = await Session.restoreStandard71ExactCheckpoint(saved);
const initial = differences(source.currentAcceptedState(), restored.currentAcceptedState());
const predictorAtRestore = { source: source.coupledPredictorReport(), restored: restored.coupledPredictorReport() };
const steps = [];
for (let tick = 6; tick <= 10; tick++) {
  const time = tick * .002;
  const a = source.advanceStructuralAnalysisToPresentationTimeV1(time);
  const b = restored.advanceStructuralAnalysisToPresentationTimeV1(time);
  steps.push({ time, sourceStatus: a.status, restoredStatus: b.status,
    differences: differences(source.currentAcceptedState(), restored.currentAcceptedState()) });
}
const report = { tier, coldSeedControl, initial, predictorAtRestore, steps, adopted: false };
await writeFile(`artifacts/physiology-evaluation-2026-09-07/checkpoint-predictor-${tier}${coldSeedControl ? '-cold-seed' : ''}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ tier, coldSeedControl, predictorAtRestore, initial: initial.length, steps: steps.map(x => ({ time: x.time, differences: x.differences.length,
  largest: [...x.differences].sort((a,b)=>(b.absoluteDifference ?? 0)-(a.absoluteDifference ?? 0)).slice(0,3) })) }));
