import { AdaptorsConfig } from "../types";

export default {
  "jupiter-aggregator": {
    enabled: true,
    id: "2141",
  },
  "dexible": {
    enabled: true,
    disabled: true,
    startFrom: 1630022400,
    id: "2249",
    parentId: "2249",
    protocolsData: {
      Dexible_v2: {
        disabled: true,
        id: "2249",
        enabled: true,
        displayName: "Dexible V2",
      },
    },
  },
  "deflex": {
    enabled: true,
    id: "2420",
  },
  "dforce": {
    enabled: true,
    id: "123",
  },
  "plexus": {
    enabled: true,
    id: "2740",
  },
  "avnu": {
    enabled: true,
    id: "3154",
  },
  "bitkeep": {
    enabled: true,
    id: "3207",
  },
  "logx": {
    enabled: false,
    id: "3396",
  },
  "jumper-exchange": {
    enabled: true,
    id: "3524",
    cleanRecordsConfig: {
      genuineSpikes: {
        "1698883200": true,
      },
    },
  },
  "slingshot": {
    enabled: true,
    id: "3681",
  },
  "caviarnine": {
    parentId: "CaviarNine",
    enabled: true,
    id: "3645",
    protocolsData: {
      aggregator: {
        id: "3645",
        enabled: true,
      },
    },
  },
  "aggre": {
    enabled: true,
    id: "3809",
  },
  "llamaswap": {
    enabled: false,
    id: "3847",
  },
  "openocean": {
    enabled: true,
    id: "533",
  },
  "arcane-dex": {
    enabled: true,
    id: "3885",
  },
  "1inch": {
    enabled: true,
    id: "189",
  },
  "0x": {
    enabled: true,
    id: "2116",
  },
} as AdaptorsConfig;
