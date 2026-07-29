/**
 * Product capacity for simultaneously open scientific scenarios.
 *
 * This is a product interaction limit, not a hardware-performance estimate.
 * Every runtime admission policy imports this value so the UI and Worker lane
 * scheduler cannot drift to different caps.
 */
export const SCIENTIFIC_PRODUCT_SCENARIO_CAP_V1 = 4;
