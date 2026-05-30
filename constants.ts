import { defaultParams } from './engine/ModelCore';
import { SimulationParams } from './types';

// LV/RV active-stress is now the engine default (see defaultParams()).
export const DEFAULT_PARAMS: SimulationParams = {
    ...defaultParams()
} as SimulationParams;
