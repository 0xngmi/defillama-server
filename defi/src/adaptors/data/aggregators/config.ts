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
  // "dforce": {
  //   enabled: true,
  //   id: "123",
  // },
  "plexus": {
    enabled: true,
    id: "2740",
    cleanRecordsConfig: {
        genuineSpikes: {
          1706313600: false
        }
    }
  },
  "avnu": {
    enabled: true,
    id: "3154",
  },
  "bitkeep": {
    enabled: false,
    id: "3207",
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
        id: "5064",
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
  // "openocean": {
  //   enabled: false,
  //   id: "533",
  // },
  "arcane-dex": {
    enabled: true,
    id: "3885",
  },
  "1inch-agg": {
    enabled: true,
    id: "189",
  },
  "zrx": {
    enabled: true,
    id: "4628",
    cleanRecordsConfig: {
      genuineSpikes: {
        1674172800: true,
        1680739200: true
      }
  }
  },
  "cowswap": {
    enabled: true,
    id: "2643",
  },
  "kyberswap": {
    enabled: true,
    id: "3982",
    cleanRecordsConfig: {
      genuineSpikes: {
        "1704153600": true,
        "1704067200": true,
      },
    },
  },
  "yield-yak": {
    enabled: true,
    id: "475",
  },
  "bebop": {
    enabled: true,
    id: "3927",
  },
  "dodo": {
    enabled: true,
    id: "146",
    protocolsData: {
      "dodo-agg": {
        enabled: true,
        id: "5062",
      }
    },
    cleanRecordsConfig: {
        genuineSpikes: {
          1719360000: false
        }
    }
  },
  "paraswap": {
    enabled: true,
    id: "894",
  },
  "tokenlon": {
    enabled: true,
    id: "405",
    "protocolsData": {
      "tokenlon-agg": {
        id: "5063",
        enabled: true,
      }
    }
  },
  "aftermath-aggregator": {
    parentId: "Aftermath Finance",
    enabled: true,
    id: "3981",
  },
  "dexhunter": {
    enabled: true,
    id: "3979",
  },
  "conveyor": {
    enabled: true,
    id: "3980",
    cleanRecordsConfig: {
        genuineSpikes: {
          1722729600: false
        }
    }
  },
  // "unidex": {
  //   "enabled": true,
  //   "id": "1833",
  //   protocolsData: {
  //       "unidex-dexs-agg": {
  //           "enabled": true,
  //           "id": "1833"
  //       }
  //   }
  // },
  "swapgpt": {
    enabled: true,
    id: "4008",
  },
  "kanalabs": {
    enabled: true,
    id: "4016",
  },
  "odos": {
    "enabled": true,
    "id": "3951",
    "cleanRecordsConfig": {
      "genuineSpikes": {
        "1708128000": true,
        "1708214400": true,
        "1708300800": true,
        "1708387200": true
      }
    }
  },
  "wowmax": {
    "enabled": true,
    "id": "4192"
  },
  "opt-agg": {
    "enabled": true,
    "id": "4277"
  },
  "fibrous-finance": {
    "enabled": true,
    "id": "4278"
  },
  "aperture-swap": {
    parentId: "Aperture Finance",
    "enabled": false,
    "id": "3554"
  },
  "magpie": {
    "enabled": true,
    "id": "4457"
  },
  "etaswap": {
    "enabled": true,
    "id": "4475"
  },
  "bountive": {
    "enabled": true,
    "id": "4516"
  },
  "rubic": {
    "enabled": true,
    "id": "1282"
  },
  "eisen": {
    "enabled": true,
    "id": "4691"
  },
  "udex-agg": {
    "enabled": true,
    "id": "4704"
  },
  "injex": {
    "enabled": true,
    "id": "4762"
  },
  "hop-aggregator": {
    enabled: true,
    id: "4791",
  },
  "hallswap": {
    enabled: true,
    id: "4824",
    cleanRecordsConfig: {
        genuineSpikes: {
          1724457600: true
        }
    }
  },
  "flowx-aggregator": {
    parentId: "FlowX Finance",
    enabled: true,
    id: "4825",
  },
  "sushiswap": {
    "enabled": true,
    "id": "119",
    parentId: "Sushi",
    protocolsData: {
        "agg-dex": {
            enabled: true,
            id: "5061"
        }
    }
  },
  "7k-aggregator": {
    enabled: true,
    id: "4868",
  },
  "akka": {
    enabled: true,
    id: "4926",
  },
  "cetus-aggregator": {
      parentId: "Cetus",
      "enabled": true,
      "id": "4958",
      cleanRecordsConfig: {
          genuineSpikes: {
            1724803200: true
          }
      }
  },
  "chainspot": {
    enabled: true,
    id: "5028",
  },
  "scallop": {
    parentId: "Scallop",
    enabled: true,
    id: "5087",
  },
  "lumia": {
    enabled: true,
    id: "5098",
  },
  "rainbow-swap": {
    enabled: true,
    id: "5110",
  },
  "wolfswap": {
    enabled: true,
    id: "5138",
  }
} as AdaptorsConfig;
