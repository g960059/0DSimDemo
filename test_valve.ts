import { ModelCore, defaultParams } from './engine/ModelCore';
import { experimentalActiveStressCandidate } from './engine/presets';

const core = new ModelCore({
    ...defaultParams(),
    ...experimentalActiveStressCandidate
});
core.initializeVenousPressuresForTargetTBV(5000);
const s0 = core.runFor(15, 0.002, 60);

const s = core.runFor(1.2, 0.01, 120);

for(const row of s) {
   if (row.QAo > -0.1 && row.QMV < 0) {
      console.log(`t: ${row.t.toFixed(3)}, LVP: ${row.LVP.toFixed(0)}, LAP: ${row.LAP.toFixed(0)}, QAo: ${row.QAo.toFixed(0)}, QMV: ${row.QMV.toFixed(0)}`);
   }
}
