/**
 * Development surfaces are excluded from ordinary production discovery.
 * A controlled deployment may opt in explicitly for research use.
 */
export function studioDevSurfacesEnabledV1(
  environment: Pick<ImportMetaEnv, "PROD" | "VITE_MODEL_LAB_ENABLED"> =
    import.meta.env,
): boolean {
  return !environment.PROD || environment.VITE_MODEL_LAB_ENABLED === "1";
}
