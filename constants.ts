import { defaultParams } from './engine/ModelCore';
import type { CoreRuntimeParams } from './engine/protocol';

// LV/RV active-stress is now the engine default (see defaultParams()).
export const DEFAULT_PARAMS: CoreRuntimeParams = {
    ...defaultParams()
};
