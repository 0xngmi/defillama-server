import { AdaptorsConfig } from "../types";

export default {
  "logx": {
    enabled: false,
    id: "3396",
    protocolsData: {
      "logx-aggregator": {
        enabled: false,
        id: "3396",
      }
    }
  },
  "mux-protocol": {
      "enabled": true,
      "id": "2254",
      "protocolsData": {
          "mux-protocol-agge": {
              "id": "5054",
              "enabled": true,
          }
      },
  },
  "rage-trade": {
    "id":"4447",
    enabled: true,
  },
  "unidex-agg-perp": {
    "enabled": true,
    "id": "5012"
  },
  "vooi": {
    "enabled": true,
    "id": "4655"
  },
  "perpie": {
    "enabled": true,
    "id": "4817",
    protocolsData: {
        "derivatives": {
            "enabled": true,
            "id": "4817"
        }
    }
  },
  "bitoro": {
    "enabled": true,
    "id": "4841",
    cleanRecordsConfig: {
      genuineSpikes: {
          "1724198400": true,
          "1724284800": true,
          "1724371200": true,
          "1724457600": true,
          "1724544000": true,
          "1724630400": true,
      }
    }
  },
  "kwenta": {
    "enabled": true,
    "id": "2981"
  }
} as AdaptorsConfig;
