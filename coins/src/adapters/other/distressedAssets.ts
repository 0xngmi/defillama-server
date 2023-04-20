import getBlock from "../utils/block";
import { getTokenInfo } from "../utils/erc20";
import { Write } from "../utils/dbInterfaces";
import { addToDBWritesList } from "../utils/database";

export const contracts: { [chain: string]: { [token: string]: string } } = {
  ethereum: {
    GVR: "0x84FA8f52E437Ac04107EC1768764B2b39287CB3e",
    GVR_OLD: "0xF33893DE6eB6aE9A67442E066aE9aBd228f5290c",
    XRPC: "0xd4ca5c2aff1eefb0bea9e9eab16f88db2990c183",
    LUFFY: "0x54012cdf4119de84218f7eb90eeb87e25ae6ebd7",
    LUFFY_NEW: "0x7121d00b4fa18f13da6c2e30d19c04844e6afdc8",
    FEG: "0x389999216860ab8e0175387a0c90e5c52522c945",
    yUSDT: "0x83f798e925bcd4017eb265844fddabb448f1707d",
    yUSDT_v1: "0xe6354ed5bc4b393a5aad09f21c46e101e692d447",
    ycUSDT_v1: "0x1be5d71f2da660bfdee8012ddc58d024448a0a59",
    yUSDT_yDAI_yUSDT_BUSD: "0x2994529c0652d127b7842094103715ec5299bbed",
    crv_yUSDT_yDAI_yUSDT_BUSD: "0x3b3ac5386837dc563660fb6a0937dfaa5924333b",
    ypaxCrv: "0xd905e2eaebe188fc92179b6350807d8bd91db0d8",
    "yDAI+yUSDC+yUSDT+yTUSD": "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8",
    "yyDAI+yUSDC+yUSDT+yTUSD": "0x5dbcf33d8c2e976c6b560249878e6f1491bca25c",
    yUSD: "0x4b5bfd52124784745c1071dcb244c6688d2533d3",
    YAM: "0x0e2298e3b3390e3b945a5456fbf59ecc3f55da16",
  },
  harmony: {
    Frax: "0xeB6C08ccB4421b6088e581ce04fcFBed15893aC3",
    WrappedEther: "0xF720b7910C6b2FF5bd167171aDa211E226740bfe",
    Aave: "0xcF323Aad9E522B93F11c352CaA519Ad0E14eB40F",
    Sushi: "0xBEC775Cb42AbFa4288dE81F387a9b1A3c4Bc552A",
    FXS: "0x775d7816afbEf935ea9c21a3aC9972F269A39004",
    AAG: "0xAE0609A062a4eAED49dE28C5f6A193261E0150eA",
    BUSD: "0xE176EBE47d621b984a73036B9DA5d834411ef734",
    DAI: "0xEf977d2f931C1978Db5F6747666fa1eACB0d0339",
    Tether: "0x3C2B8Be99c50593081EAA2A724F0B8285F5aba8f",
    WBTC: "0x3095c7557bCb296ccc6e363DE01b760bA031F2d9",
    USDC: "0x985458E523dB3d53125813eD68c274899e9DfAb4",
    ETH: "0x6983D1E6DEf3690C4d616b13597A09e6193EA013",
    bscBNB: "0xb1f6E61E1e113625593a22fa6aa94F8052bc39E0",
    bscBUSD: "0x0aB43550A6915F9f67d0c454C2E90385E6497EaA",
  },
  klaytn: {
    USDK: "0xd2137fdf10bd9e4e850c17539eb24cfe28777753",
  },
  arbitrum: {
    GOLD: "0xc4be0798e5b5b1C15edA36d9B2D8c1A60717fA92",
  },
  bsc: {
    aBNBb: "0xbb1aa6e59e5163d8722a122cd66eba614b59df0d",
    aBNBc: "0xe85afccdafbe7f2b096f268e31cce3da8da2990a",
    DOGECOLA: "0xe320df552e78d57e95cf1182b6960746d5016561", // OLD dogecola contract
    GVR: "0xaFb64E73dEf6fAa8B6Ef9a6fb7312d5C4C15ebDB", // GVR
    GVR2: "0xF33893DE6eB6aE9A67442E066aE9aBd228f5290c",
    PANCAKE_LP_ABNB_BNB: "0x272c2CF847A49215A3A1D4bFf8760E503A06f880",
    BTCBR: "0x0cf8e180350253271f4b917ccfb0accc4862f262",
    RB: "0x441bb79f2da0daf457bad3d401edb68535fb3faa", // bad pricing
    MOR: "0x87bade473ea0513d4aa7085484aeaa6cb6ebe7e3", //MOR
    $CINO: "0xdfe6891ce8e5a5c7cf54ffde406a6c2c54145f71", //$cino . Problem with dodo adapter on 13/03/2023 (mispriced)
    VBSWAP: "0x4f0ed527e8a95ecaa132af214dfd41f30b361600",
    ZEDXION: "0xfbc4f3f645c4003a2e4f4e9b51077d2daa9a9341", // price manipulated?
    FEG: "0xacfc95585d80ab62f67a14c566c1b7a49fe91167",
    MFI: "0xeb5bb9d14d27f75c787cf7475e7ed00d21dc7279",
  },
  cronos: {
    CRK: "0x065de42e28e42d90c2052a1b49e7f83806af0e1f",
  },
  solana: {
    YAKU: "NGK3iHqqQkyRZUj4uhJDQqEyKKcZ7mdawWpqwMffM3s",
  },
  avax: {
    DUEL: "0xc1a49c0B9C10F35850bd8E15EaeF0346BE63E002",
  },
  oasis: {
    // https://www.chainabuse.com/report/3ac26ddd-6ea5-438d-b0ff-dbe4508c641c?d=https%3A%2F%2Fbridge.evodefi.com%2F
    USDT: "0x6Cb9750a92643382e020eA9a170AbB83Df05F30B",
    USDC: "0x94fbffe5698db6f54d6ca524dbe673a7729014be",
  },
  fantom: {
    CoUSD: "0x0DeF844ED26409C5C46dda124ec28fb064D90D27",
  },
};

const eulerTokens = [
  "0x1b808f49add4b8c6b5117d9681cf7312fcf0dc1d",
  "0xe025e3ca2be02316033184551d4d3aa22024d9dc",
  "0xeb91861f8a4e1c12333f42dce8fb0ecdc28da716",
  "0x4d19f33948b99800b6113ff3e83bec9b537c85d2",
  "0x5484451a88a35cd0878a1be177435ca8a0e4054e",
  // 4626 wrapped eTokens
  "0x60897720aa966452e8706e74296b018990aec527",
  "0x3c66B18F67CA6C1A71F829E2F6a0c987f97462d0",
  "0x4169Df1B7820702f566cc10938DA51F6F597d264",
  "0xbd1bd5c956684f7eb79da40f582cbe1373a1d593",
];

export default async function getTokenPrices(chain: string, timestamp: number) {
  const block: number | undefined = await getBlock(chain, timestamp);
  const writes: Write[] = [];
  const tokens = Object.values(contracts[chain]);

  if (chain === "ethereum") tokens.push(...eulerTokens);

  const tokenInfos = await getTokenInfo(chain, tokens, block);

  tokens.map((a: string, i: number) => {
    addToDBWritesList(
      writes,
      chain,
      a,
      0,
      tokenInfos.decimals[i].output,
      tokenInfos.symbols[i].output,
      timestamp,
      "distressed",
      1.01,
    );
  });

  return writes;
}
