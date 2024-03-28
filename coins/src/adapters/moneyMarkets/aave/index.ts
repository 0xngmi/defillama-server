import getTokenPrices from "./aave";

export function aave(timestamp: number = 0) {
  console.log("starting aave");
  return Promise.all([
    getTokenPrices(
      "base",
      "0x2f6571d3Eb9a4e350C68C36bCD2afe39530078E2",
      "v3",
      timestamp
    ),
    getTokenPrices(
      "optimism",
      "0x770ef9f4fe897e59daCc474EF11238303F9552b6",
      "v3",
      timestamp
    ),
    getTokenPrices(
      "arbitrum",
      "0x770ef9f4fe897e59daCc474EF11238303F9552b6",
      "v3",
      timestamp
    ),
    getTokenPrices(
      "ethereum",
      "0x52D306e36E3B6B02c153d0266ff0f85d18BCD413",
      "v2",
      timestamp
    ),
    // AMM market has no registry
    //getTokenPrices("ethereum", "0x7937d4799803fbbe595ed57278bc4ca21f3bffcb");
    getTokenPrices(
      "polygon",
      "0x3ac4e9aa29940770aeC38fe853a4bbabb2dA9C19",
      "v2",
      timestamp
    ),
    //polygon V3
    getTokenPrices(
      "polygon",
      "0x770ef9f4fe897e59daCc474EF11238303F9552b6",
      "v3",
      timestamp
    ),
    getTokenPrices(
      "avax",
      "0x4235E22d9C3f28DCDA82b58276cb6370B01265C2",
      "v2",
      timestamp
    ),
    //avax V3
    getTokenPrices(
      "avax",
      "0x770ef9f4fe897e59daCc474EF11238303F9552b6",
      "v3",
      timestamp
    ),
    getTokenPrices(
      "scroll",
      "0xFBedc64AeE24921cb43004312B9eF367a4162b57",
      "v3",
      timestamp
    ),
    getTokenPrices(
      "metis",
      "0x9E7B73ffD9D2026F3ff4212c29E209E09C8A91F5",
      "v3",
      timestamp
    ),
    getTokenPrices(
      "bsc",
      "0x117684358D990E42Eb1649E7e8C4691951dc1E71",
      "v3",
      timestamp
    ),
  ]);
}
export function geist(timestamp: number = 0) {
  console.log("starting geist");
  return Promise.all([
    getTokenPrices(
      "fantom",
      "0x4CF8E50A5ac16731FA2D8D9591E195A285eCaA82",
      "v2",
      timestamp
    )
  ]);
}
export function radiant(timestamp: number = 0) {
  console.log("starting radiant");
  return Promise.all([
    getTokenPrices(
      "arbitrum",
      "0x7BB843f889e3a0B307299c3B65e089bFfe9c0bE0",
      "v2",
      timestamp
    ),
    getTokenPrices(
      "arbitrum",
      "0x9D36DCe6c66E3c206526f5D7B3308fFF16c1aa5E",
      "v2",
      timestamp
    )
  ]);
}
export function klap(timestamp: number = 0) {
  console.log("starting klap");
  return Promise.all([
    getTokenPrices(
      "klaytn",
      "0x969E4A05c2F3F3029048e7943274eC2E762497AB",
      "v2",
      timestamp
    )
  ]);
}
export function valas(timestamp: number = 0) {
  console.log("starting valas");
  return getTokenPrices(
    "bsc",
    "0x99E41A7F2Dd197187C8637D1D151Dc396261Bc14",
    "v2",
    timestamp
  );
}
export function uwulend(timestamp: number = 0) {
  console.log("starting UwULend");
  return getTokenPrices(
    "ethereum",
    "0xaC538416BA7438c773F29cF58afdc542fDcABEd4",
    "v2",
    timestamp
  );
}
