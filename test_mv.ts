import { ModelCore } from "./engine/ModelCore";
import { stableElastanceBaseline } from "./engine/presets";

const core = new ModelCore(stableElastanceBaseline);
const samples = core.runFor(1.2, 0.001, 120);
for (const s of samples) {
    if (s.t > 0.3 && s.t < 0.6) {
        console.log(`t: ${s.t.toFixed(3)}, LVP: ${s.LVP.toFixed(2)}, LAP: ${s.LAP.toFixed(2)}, QMV: ${s.QMV.toFixed(2)}`);
    }
}
