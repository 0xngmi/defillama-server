const normalizedChainReplacements = {
  "binance":"bsc",
  "wanchain": "wan",
  "kucoin": "kcc",
} as {
  [chain:string]:string
}

export function normalizeChain(chain: string) {
  let normalizedChain = chain.toLowerCase();
  return normalizedChainReplacements[normalizedChain] ?? normalizedChain;
}

export const nonChains = ['PK', 'SK', 'tvl', 'tvlPrev1Hour', 'tvlPrev1Day', 'tvlPrev1Week']

export function addToChains(chains:string[], chainDisplayName:string){
  if (chainCoingeckoIds[chainDisplayName] !== undefined && !chains.includes(chainDisplayName)) {
    chains.push(chainDisplayName);
  } else if(chainDisplayName.includes('-')){
    const chainName = chainDisplayName.split('-')[0]
    addToChains(chains, chainName)
  }
}

export const chainCoingeckoIds = {
  "Ethereum": {
    geckoId: "ethereum",
    symbol: "ETH",
    cmcId: "1027",
    categories: ["EVM"],
  },
  "Arbitrum": {
    geckoId: null,
    symbol: null,
    cmcId: null,
    categories: ["EVM", "Rollup"],
    parent: "Ethereum",
  },
  "Palm": {
    geckoId: null,
    symbol: null,
    cmcId: null,
    categories: ["EVM"],
  },
  "Optimism": {
    geckoId: null,
    symbol: null,
    cmcId: null,
    categories: ["EVM", "Rollup"],
    parent: "Ethereum",
  },
  "Stacks": {
    geckoId: "blockstack",
    symbol: "STX",
    cmcId: "4847",
  },
  "PolyNetwork": {
    geckoId: null,
    symbol: null,
    cmcId: null,
  },
  "Conflux": {
    geckoId: "conflux-token",
    symbol: "CFX",
    cmcId: "7334",
  },
  "Nuls": {
    geckoId: "nuls",
    symbol: "NULS",
    cmcId: "2092",
  },
  "Witnet": {
    geckoId: null,
    symbol: null,
    cmcId: null,
  },
  "BSC": {
    geckoId: "binancecoin",
    symbol: "BNB",
    cmcId: "1839",
    categories: ["EVM"],
  },
  "Avalanche": {
    geckoId: "avalanche-2",
    symbol: "AVAX",
    cmcId: "5805",
    categories: ["EVM"],
  },
  "Solana": {
    geckoId: "solana",
    symbol: "SOL",
    cmcId: "5426",
  },
  "Polygon": {
    geckoId: "matic-network",
    symbol: "MATIC",
    cmcId: "3890",
    categories: ["EVM"],
  },
  "Terra": {
    geckoId: "terra-luna",
    symbol: "LUNA",
    cmcId: "4172",
    categories: ["Cosmos"],
  },
  "Fantom": {
    geckoId: "fantom",
    symbol: "FTM",
    cmcId: "3513",
    categories: ["EVM"],
  },
  "Gnosis": {
    geckoId: "gnosis",
    symbol: "GNO",
    cmcId: "1659",
    categories: ["EVM"],
  },
  "Heco": {
    geckoId: "huobi-token",
    symbol: "HT",
    cmcId: "2502",
    categories: ["EVM"],
  },
  "Kava": {
    geckoId: "kava",
    symbol: "KAVA",
    cmcId: "4846",
    categories: ["Cosmos"],
  },
  "OKExChain": {
    geckoId: "oec-token",
    symbol: "OKT",
    cmcId: "8267",
    categories: ["EVM"],
  },
  "Wanchain": {
    geckoId: "wanchain",
    symbol: "WAN",
    cmcId: "2606",
    categories: ["EVM"],
  },
  "DefiChain": {
    geckoId: "defichain",
    symbol: "DFI",
    cmcId: "5804",
  },
  "Ontology": {
    geckoId: "ontology",
    symbol: "ONT",
    cmcId: "2566",
  },
  "Bitcoin": {
    geckoId: "bitcoin",
    symbol: "BTC",
    cmcId: "1",
  },
  "Energi": {
    geckoId: "energi",
    symbol: "NRG",
    cmcId: "3218",
  },
  "Secret": {
    geckoId: "secret",
    symbol: "SCRT",
    cmcId: "5604",
  },
  "Zilliqa": {
    geckoId: "zilliqa",
    symbol: "ZIL",
    cmcId: "2469",
  },
  "NEO": {
    geckoId: "neo",
    symbol: "NEO",
    cmcId: "1376",
  },
  "Harmony": {
    geckoId: "harmony",
    symbol: "ONE",
    cmcId: "3945",
    categories: ["EVM"],
  },
  "RSK": {
    geckoId: "rootstock",
    symbol: "RBTC",
    cmcId: "3626",
    categories: ["EVM"],
  },
  "Sifchain": {
    geckoId: "sifchain",
    symbol: "EROWAN",
    cmcId: "8541",
    categories: ["Cosmos"],
  },
  "Algorand": {
    geckoId: "algorand",
    symbol: "ALGO",
    cmcId: "4030",
  },
  "Osmosis": {
    geckoId: "osmosis",
    symbol: "OSMO",
    cmcId: "12220",
    categories: ["Cosmos"],
  },
  "Thorchain": {
    geckoId: "thorchain",
    symbol: "RUNE",
    cmcId: "4157",
    categories: ["Cosmos"],
  },
  "Tron": {
    geckoId: "tron",
    symbol: "TRON",
    cmcId: "1958",
  },
  "Icon": {
    geckoId: "icon",
    symbol: "ICX",
    cmcId: "2099",
  },
  "Tezos": {
    geckoId: "tezos",
    symbol: "XTZ",
    cmcId: "2011",
  },
  "Celo": {
    geckoId: "celo",
    symbol: "CELO",
    cmcId: "5567",
    categories: ["EVM"],
  },
  "KCC": {
    geckoId: "kucoin-shares",
    symbol: "KCS",
    cmcId: "2087",
    categories: ["EVM"],
  },
  "Karura": {
    geckoId: "karura",
    symbol: "KAR",
    cmcId: "10042",
    categories: ["Parachain"],
    parent: "Kusama",
  },
  "Moonriver": {
    geckoId: "moonriver",
    symbol: "MOVR",
    cmcId: "9285",
    categories: ["EVM", "Parachain"],
    parent: "Kusama",
  },
  "Waves": {
    geckoId: "waves",
    symbol: "WAVES",
    cmcId: "1274",
  },
  "Klaytn": {
    geckoId: "klay-token",
    symbol: "KLAY",
    cmcId: "4256",
    categories: ["EVM"],
  },
  "IoTeX": {
    geckoId: "iotex",
    symbol: "IOTX",
    cmcId: "2777",
    categories: ["EVM"],
  },
  "Ultra": {
    geckoId: "ultra",
    symbol: "UOS",
    cmcId: "4189",
  },
  "Kusama": {
    geckoId: "kusama",
    symbol: "KSM",
    cmcId: "5034",
  },
  "Shiden": {
    geckoId: 'shiden',
    symbol: 'SDN',
    cmcId: '11451',
    categories: ["EVM", "Parachain"],
    parent: "Kusama",
  },
  "Telos": {
    geckoId: "telos",
    symbol: "TLOS",
    cmcId: "4660",
    categories: ["EVM"],
  },
  "ThunderCore": {
    geckoId: "thunder-token",
    symbol: "TT",
    cmcId: "3930",
    categories: ["EVM"],
  },
  "Lamden": {
    geckoId: "lamden",
    symbol: "TAU",
    cmcId: "2337",
  },
  "Near": {
    geckoId: "near",
    symbol: "NEAR",
    cmcId: "6535",
  },
  "EOS": {
    geckoId: "eos",
    symbol: "EOS",
    cmcId: "1765",
  },
  "Songbird": {
      geckoId: "songbird",
      symbol: "SGB",
      cmcId: "12186",
      categories: ["EVM"],
  },
  "EnergyWeb": {
      geckoId: "energy-web-token",
      symbol: "EWT",
      cmcId: "5268",
      categories: ["EVM", "Parachain"],
      parent: ["Polkadot"],
  },
  "HPB": {
      geckoId: "high-performance-blockchain",
      symbol: "HPB",
      cmcId: "2345",
      categories: ["EVM"],
  },
  "GoChain": {
      geckoId: "gochain",
      symbol: "GO",
      cmcId: "2861",
      categories: ["EVM"],
  },
  "TomoChain": {
      geckoId: "tomochain",
      symbol: "TOMO",
      cmcId: "2570",
      categories: ["EVM"],
  },
  "Fusion": {
    geckoId: "fsn",
    symbol: "FSN",
    cmcId: "2530",
    categories: ["EVM"],
  },
  "Kardia": {
    geckoId: "kardiachain",
    symbol: "KAI",
    cmcId: "5453",
    categories: ["EVM"],
  },
  "Fuse": {
    geckoId: "fuse-network-token",
    symbol: "FUSE",
    cmcId: "5634",
    categories: ["EVM"],
  },
  "SORA": {
    geckoId: "sora",
    symbol: "XOR",
    cmcId: "5802",
  },
  "smartBCH": {
    geckoId: "bitcoin-cash",
    symbol: "BCH",
    cmcId: "1831",
    categories: ["EVM"],
  },
  "Elastos": {
    geckoId: "elastos",
    symbol: "ELA",
    cmcId: "2492",
    categories: ["EVM"],
  },
  "Hoo": {
    geckoId: "hoo-token",
    symbol: "HOO",
    cmcId: "7543",
    categories: ["EVM"],
  },
  "Cronos": {
    geckoId: "crypto-com-chain",
    symbol: "CRO",
    cmcId: "3635",
    categories: ["EVM"],
  },
  "Polis": {
    geckoId: "polis",
    symbol: "POLIS",
    cmcId: "2359",
    categories: ["EVM"],
  },
  "ZYX": {
    geckoId: "zyx",
    symbol: "ZYX",
    cmcId: "6131",
    categories: ["EVM"],
  },
  "Elrond": {
    geckoId: "elrond-erd-2",
    symbol: "EGLD",
    cmcId: "6892",
  },
  "Stellar": {
    geckoId: "stellar",
    symbol: "XLM",
    cmcId: "512",
  },
  "Boba": {
    geckoId: "boba-network",
    symbol: "BOBA",
    cmcId: "14556",
    categories: ["EVM", "Rollup"],
  },
  "Metis": {
    geckoId: "metis-token",
    symbol: "METIS",
    cmcId: "9640",
    categories: ["EVM", "Rollup"],
  },
  "Ubiq": {
    geckoId: "ubiq",
    symbol: "UBQ",
    cmcId: "588",
    categories: ["EVM"],
  },
  "Mixin": {
    geckoId: "mixin",
    symbol: "XIN",
    cmcId: "2349",
    categories: ["EVM"],
  },
  "Everscale": {
    geckoId: "ton-crystal",
    symbol: "EVER",
    cmcId: "7505",
  },
  "VeChain": {
    geckoId: "vechain",
    symbol: "VET",
    cmcId: "3077",
  },
  "XDC": {
    geckoId: "xdce-crowd-sale",
    symbol: "XDC",
    cmcId: "2634",
    categories: ["EVM"],
  },
  "Velas": {
    geckoId: "velas",
    symbol: "VLX",
    cmcId: "4747",
    categories: ["EVM"],
  },
  "Polkadot": {
    geckoId: "polkadot",
    symbol: "DOT",
    cmcId: "6636",
  },
  "CosmosHub": {
    geckoId: "cosmos",
    symbol: "ATOM",
    cmcId: "3794",
  },
  "EthereumClassic": {
    geckoId: "ethereum-classic",
    symbol: "ETC",
    cmcId: "1321",
    categories: ["EVM"],
  },
  "Sora": {
    geckoId: "sora",
    symbol: "XOR",
    cmcId: "5802",
  },
  "Aurora": {
    geckoId: null,
    symbol: null,
    cmcId: null,
    categories: ["EVM"],
    parent: "Near",
  },
  "Ronin": {
    geckoId: null,
    symbol: "RON",
    cmcId: null,
    categories: ["EVM"],
  },
  "zkSync": {
    geckoId: null,
    symbol: null,
    cmcId: null,
    categories: ["Rollup"],
  },
  "SmartBCH": {
    geckoId: "bitcoin-cash",
    symbol: "BCH",
    cmcId: "1831",
    categories: ["EVM"],
  },
  "Godwoken": {
    geckoId: null,
    symbol: null,
    cmcId: null,
    categories: ["EVM"],
    parent: "Nervos",
  },
  "Callisto": {
    geckoId: "callisto",
    symbol: "CLO",
    cmcId: "2757",
    categories: ["EVM"],
  },
  "CSC": {
    geckoId: "coinex-token",
    symbol: "CET",
    cmcId: "2941",
    categories: ["EVM"],
  },
  "Ergo": {
    geckoId: "ergo",
    symbol: "ERG",
    cmcId: "1555",
  },
  "Cardano": {
    geckoId: "cardano",
    symbol: "ADA",
    cmcId: "2010",
  },
  "Liquidchain": {
    geckoId: "liquidchain",
    symbol: "XLC",
    cmcId: null,
    categories: ["EVM"],
  },
  "Nahmii": {
    geckoId: "nahmii",
    symbol: "NII",
    cmcId: "4865",
    categories: ["EVM", "Rollup"],
  },
  "Parallel": {
    geckoId: null,
    symbol: "PARA",
    cmcId: null,
    categories: ["Parachain"],
    parent: "Polkadot",
  },
  "Meter": {
    geckoId: "meter",
    symbol: "MTRG",
    cmcId: "5919",
    categories: ["EVM"],
  },
  "Oasis": {
    geckoId: "oasis-network",
    symbol: "ROSE",
    cmcId: "7653",
    categories: ["EVM"],
  },
  "Theta": {
    geckoId: "theta-token",
    symbol: "THETA",
    cmcId: "2416",
    categories: ["EVM"],
  },
  "Syscoin": {
    geckoId: "syscoin",
    symbol: "SYS",
    cmcId: "541",
    categories: ["EVM"],
  },
  "Moonbeam": {
    geckoId: "moonbeam",
    symbol: "GLMR",
    cmcId: "6836",
    categories: ["EVM", "Parachain"],
    parent: "Polkadot",
  },
} as {
  [chain: string]: {
    geckoId: string | null,
    symbol: string | null,
    cmcId: string | null,
  }
}
chainCoingeckoIds["xDai"] = chainCoingeckoIds["Gnosis"]
chainCoingeckoIds["Binance"] = chainCoingeckoIds["BSC"]
chainCoingeckoIds["Kucoin"] = chainCoingeckoIds["KCC"]
chainCoingeckoIds["Cosmos"] = chainCoingeckoIds["CosmosHub"]

export const extraSections = ["staking", "pool2", "offers", "borrowed", "masterchef"]

export function transformNewChainName(chain:string){
  switch (chain) {
    case "Binance":
      return "BSC"
    case "Kucoin":
      return "KCC"
    case "xDai":
      return "Gnosis"
    case "Cosmos":
      return "CosmosHub"
    default:
      return chain
  }
}

export function getChainDisplayName(normalizedChain: string, useNewChainNames: boolean):string {
  if(extraSections.includes(normalizedChain)){
    return normalizedChain
  }
  if(normalizedChain.includes('-')){
    return normalizedChain.split('-').map(chain=>getChainDisplayName(chain, useNewChainNames)).join('-')
  }
  switch (normalizedChain) {
    case "bsc":
      return useNewChainNames?"BSC":"Binance"
    case "wan":
      return "Wanchain"
    case "kcc":
      return useNewChainNames?"KCC":"Kucoin"
    case "xdai":
      return useNewChainNames?"Gnosis":"xDai"
    case "cosmos":
      return useNewChainNames?"CosmosHub":"Cosmos"
    case "avax":
      return "Avalanche"
    case "okexchain":
      return "OKExChain"
    case "defichain":
      return "DefiChain"
    case "stacks":
      return "Stacks"
    case "polynetwork":
      return "PolyNetwork"
    case "eos":
      return "EOS"
    case "neo":
      return "NEO"
    case "rsk":
      return "RSK"
    case "iotex":
      return "IoTeX"
    case "thundercore":
      return "ThunderCore"
    case "telos":
      return "Telos"
    case "hpb":
      return "HPB"
    case "energyweb":
      return "EnergyWeb"
    case "gochain":
      return "GoChain"
    case "tomochain":
      return "TomoChain"
    case "fusion":
      return "Fusion"
    case "kardia":
      return "Kardia"
    case "fuse":
      return "Fuse"
    case "sora":
      return "SORA"
    case "smartbch":
      return "smartBCH"
    case "elastos":
      return "Elastos"
    case "hoo":
      return "Hoo"
    case "cronos":
      return "Cronos"
    case "polis":
      return "Polis"
    case "zyx":
      return "ZYX"
    case "elrond":
      return "Elrond"
    case "stellar":
      return "Stellar"
    case "shiden":
      return "Shiden"
    case "metis":
      return "Metis"
    case "ubiq":
      return "Ubiq"
    case "mixin":
      return "Mixin"
    case "everscale":
      return "Everscale"
    case "vechain":
      return "VeChain"
    case "xdc":
      return "XDC"
    case "velas":
      return "Velas"
    case "ethereumclassic":
      return "EthereumClassic"
    case "zksync":
      return "zkSync"
    case "godwoken":
      return "Godwoken"
    case "callisto":
      return "Callisto"
    case "csc":
      return "CSC"
    case "ergo":
      return "Ergo"
    case "parallel":
      return "Parallel"
    case "oasis":
      return "Oasis"
    case "theta":
      return "Theta"
    case "meter":
      return "Meter"
    case "syscoin":
      return "Syscoin"
    case "moonbeam":
      return "Moonbeam"
      
    default:
      return normalizedChain.slice(0, 1).toUpperCase() + normalizedChain.slice(1) // Capitalize first letter
  }
}

export function getDisplayChain(chains: string[]) {
  if (chains.length > 1) {
    return "Multi-Chain";
  } else {
    return chains[0];
  }
}
