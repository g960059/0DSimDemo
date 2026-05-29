import { defaultParams } from './engine/ModelCore';
import { SimulationParams } from './types';
import { experimentalActiveStressCandidate } from './engine/presets';

export const DEFAULT_PARAMS: SimulationParams = {
    ...defaultParams(),
    ...experimentalActiveStressCandidate
} as SimulationParams;
