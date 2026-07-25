/**
 * Main-thread trust anchor for the integrated-preview Worker.
 *
 * Keep this module literal-only. Importing the release assembly here would
 * pull the numerical model into the browser bundle and would let Worker-owned
 * data become its own expected identity. Node tests bind these literals back
 * to the checked-in release, seed, and live session construction.
 */
export const MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1 =
  Object.freeze({
    id: "circleheart/adult-five-wall-integrated-preview",
    version: "0.1.0",
    sha256:
      "32d4f2c936eabd6b19fcb18386ba540174de6627110b1c2febb0140938f0fa5d",
  } as const);

const SOURCE_SEED_IDENTITY_V1 = Object.freeze({
  payloadSha256:
    "a990889b4c31218b55998da12371cf34bd5d88effeb237acc4547b45dd566b10",
  startCheckpointSha256:
    "9fc15d39328e3ef1e3c4f17d22b99c224fd44efebbf4b1fe5cbdb5cec3036aef",
  terminalCheckpointSha256:
    "f4024a1570f791315211a0d88b767fb4b0e846ac80dba3f57079ca7924accad0",
} as const);

export const MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1 =
  Object.freeze({
    releaseRef: MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
    sourceSeed: SOURCE_SEED_IDENTITY_V1,
    checkpointClaimSha256: Object.freeze({
      integratedV3:
        "9da6f4b7b469a0ab066282d8540622f4dcb207d63369d3e8e172abd731b43600",
      coronaryV3:
        "8f2ada5247467b1e86d8a465e244be383d887bd2410044354af37447481b5998",
      coronaryV2:
        "091a5d036c621883531069cf4289d096daa10d6ee76bd9ca032677ba2d8693ab",
      composedRhythmV2:
        "f7a7dfcfd5e84a253dd4be6af2174e64081c0f294799ae5e7b244c1674ca1c30",
    }),
    byMcsPresetId: Object.freeze({
      "all-off": Object.freeze({
        simulationInputSpecSha256:
          "d1e175e8288501c36303ef46c97187dd3f5de15fc664b9ab28060614b3a02ac4",
        createStartCheckpointSha256:
          SOURCE_SEED_IDENTITY_V1.startCheckpointSha256,
      }),
      "lvad-hmii-9000-one-beat-transient": Object.freeze({
        simulationInputSpecSha256:
          "9ba2475531139c5235c6cd6b075970676abc8193b3beb948439332752578545f",
        createStartCheckpointSha256:
          "2202d829789d38649aa936995623afd59cb47e3e64f0d4292ad35693389b61c1",
      }),
    }),
  } as const);
