import * as compound from "./moneyMarkets/compound";
import * as aave from "./moneyMarkets/aave";
import * as uniswap from "./markets/uniswap";
import * as curve from "./markets/curve";
import * as balancer from "./markets/balancer";
import * as others from "./other/index";

export default {
  ...compound.adapters,
  ...aave.adapters,
  ...uniswap.adapters,
  ...curve.adapters,
  ...balancer.adapters,
  ...others.adapters,
  stobox: require("./rwa/stobox"),
  seamless: require("./other/seamless"),
  pyth: require("./oracles/pyth"),
  unknownTokensV3: require("./other/unknownTokensV3"),
  dinari: require("./rwa/dinari"),
  few: require("./other/few"),
  nstSTRK: require("./other/nstSTRK"),
  ociswap: require("./markets/ociswap"),
  optimBonds: require("./other/optimBonds"),
  tangleswap: require("./markets/tangleswap"),
  xexchange: require("./markets/xexchange"),
  balanced: require("./markets/balanced"),
  tinyman: require("./markets/tinyman"),
  silo: require("./moneyMarkets/silo"),
  hlp: require("./yield/hlp"),
  digift: require("./rwa/digift"),
  gmxV2: require("./other/gmxV2"),
  timeswap: require("./yield/timeswap"),
  dforce: require("./moneyMarkets/dforce"),
  minswap: require("./markets/minswap2"),
  ergopad: require("./markets/ergopad"),
  sundaeswap: require("./markets/sundaeswap"),
  wingriders: require("./markets/wingriders"),
  // ondo: require("./yield/ondo"),
  yearn: require("./yield/yearn"),
  convex: require("./yield/convex"),
  alchemix: require("./yield/alchemix"),
  balmy: require("./yield/balmy"),
  misc4626: require("./yield/misc4626"),
  vesper: require("./yield/vesper"),
  yieldProtocol: require("./yield/yield-protocol"),
  levelFinance: require("./yield/level-finance"),
  quickperps: require("./yield/quickperps"),
  timeless: require("./yield/timeless"),
  beefy: require("./yield/beefy"),
  platypus: require("./markets/platypus"),
  hop: require("./markets/hop"),
  ankr: require("./liquidStaking/ankr"),
  stargate: require("./markets/stargate"),
  jarvis: require("./markets/jarvis"),
  chainlinkNFT: require("./nft/chainlink"),
  arrakis: require("./markets/arrakis"),
  aktionariat: require("./markets/aktionariat"),
  yieldYak: require("./yield/yield-yak"),
  tezos: require("./tezos"),
  aaveDebt: require("./moneyMarkets/aave-debt"),
  saber: require("./solana/saber"),
  reservoir: require("./nft/reservoir"),
  jpegd: require("./yield/jpegd"),
  glpDerivs: require("./yield/glpDerivs"),
  pendle: require("./yield/pendle"),
  phux: require("./markets/phux"),
  wombat: require("./markets/wombat"),
  backed: require("./rwa/backed"),
  vela: require("./yield/vela"),
  chai: require("./yield/chai"),
  kuma: require("./rwa/kuma"),
  ondo: require("./rwa/ondo"),
  hashnote: require("./rwa/hashnote"),
  hiyield: require("./rwa/hiyield"),
  mux: require("./yield/mux"),
  maverick: require("./markets/maverick"),
  steer: require("./markets/steer"),
  derivs: require("./yield/derivs"),
  pxeth: require("./liquidStaking/pxeth"),
  // sthApt: require("./liquidStaking/sthapt"),
  mod: require("./markets/thala"),
  ambitFinance: require("./yield/ambit-finance"),
  eigenpie: require("./yield/eigenpie"),
};
