import { ModelCore, defaultParams } from '../engine/ModelCore';
import { experimentalActiveStressCandidate } from '../engine/presets';

console.log('--- Active Stress Calibration Harness ---');

import { stableElastanceBaseline } from '../engine/presets';
const baselineCore = new ModelCore();
const baselineParams = { ...defaultParams(), ...stableElastanceBaseline };
baselineCore.p = baselineParams;
baselineCore.initializeVenousPressuresForTargetTBV(5000);
baselineCore.runFor(15, 0.002, 60);
let baseEsvL = Infinity, baseEdvL = 0;
for (let i = 0; i < 400; i++) {
    baselineCore.step(0.002);
    const s = baselineCore.sample();
    baselineCore.history.push(s);
    if (s.VLV > baseEdvL) baseEdvL = s.VLV;
    if (s.VLV < baseEsvL) baseEsvL = s.VLV;
}
const baseM = baselineCore.metrics();
console.log(`BASELINE -> CO: ${baseM.CO_L.toFixed(1)} / ${baseM.CO_R.toFixed(1)}, LV: ${baseEsvL.toFixed(0)}-${baseEdvL.toFixed(0)}`);
let baseVolLog = "";
for(let i=0; i<baselineCore.nodes.length; i++) {
    const n = baselineCore.nodes[i];
    const ix = baselineCore.idx.node[n.name];
    let v = 0;
    if (n.kind === "venousPressure") {
        v = baselineCore.effectiveVu(n) + baselineCore.venousStressedVolume(n, baselineCore.x[ix]);
    } else {
        v = baselineCore.x[ix];
    }
    baseVolLog += `${n.name}:${v.toFixed(0)} `;
}
console.log(`Baseline Volumes: ${baseVolLog}`);

// Grid search params
const lvTmaxScales = [ 4.0, 5.0, 6.0, 8.0 ];
const rvTmaxScales = [ 4.0, 6.0, 8.0, 10.0 ];

for (const lvTmax of lvTmaxScales) {
    for (const rvTmax of rvTmaxScales) {
        const ca = 2.0;
        const p = { 
            ...defaultParams(),
            ...experimentalActiveStressCandidate,
            lvTmaxScale: lvTmax,
            rvTmaxScale: rvTmax,
            caReleaseScale: ca,
            rvCaReleaseScale: ca,
            HR: 75,
        };

        const core = new ModelCore(p);
        core.initializeVenousPressuresForTargetTBV(5000); 

        // Initial transient run
        core.runFor(2.0, 0.002, 60);
        core.clampHitCount = 0; // reset hit count

        // Run for 3 seconds to measure
        core.runFor(3.0, 0.002, 60);
        
        const m = core.metrics();
        const health = core.health();
        
        if (health.clampHitCount === 0 || health.clampHitCount < 10) {
            let esvL = Infinity, edvL = 0;
            let esvR = Infinity, edvR = 0;
            
            for (let i = 0; i < 400; i++) {
                core.step(0.002);
                const s = core.sample();
                if (s.VLV > edvL) edvL = s.VLV;
                if (s.VLV < esvL) esvL = s.VLV;
                if (s.VRV > edvR) edvR = s.VRV;
                if (s.VRV < esvR) esvR = s.VRV;
            }

            console.log(`[lvT=${lvTmax.toFixed(1)}, rvT=${rvTmax.toFixed(1)}] CO: ${m.CO_L.toFixed(1)}, LV: ${esvL.toFixed(0)}-${edvL.toFixed(0)}, RV: ${esvR.toFixed(0)}-${edvR.toFixed(0)}`);
        }
    }
}










