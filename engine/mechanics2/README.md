# mechanics2

The MechanicsCore2 / CircAdapt-lite sidecar lane that this directory was created
for is retired. Its AV-plane, atrial reservoir/conduit, and left-heart subsystem
research — components, benches, reports, and lane documents — was removed from
the working tree and remains in git history.

What stays here is the part of the lane that graduated into the shipped model:

- `valve/MainWireQuasiSteadyOrificeValveV1.ts` and `…V2.ts`: the quasi-steady
  orifice valve used by the main-wire five-wall model. V2 is the one the browser
  session resolves through its release valve preset.
- `valve/MainWireFourValveDiseasePresetV1.ts`: the four-valve disease preset
  built on that valve.
- `diagnostics/LaPvReservoirConduitOrderV1.ts` and
  `diagnostics/LaPvLobeMeasurementV2.ts`: LA PV-loop ordering and lobe
  measurements, still exercised by the fast suite.

These files are production code despite the directory name. Moving them under a
name that reflects that — `engine/valves` for the valve pair, for example — is a
follow-up that touches the runtime and about twenty test imports, so it is left
as a separate change rather than folded into the retirement.

Do not add new sidecar research here. The four-chamber mechanics documentation
is in [`docs/myocardium/README.md`](../../docs/myocardium/README.md).
