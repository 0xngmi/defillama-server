import BigNumber from "bignumber.js";
import { Address } from "@defillama/sdk/build/types";
import { Chain } from "@defillama/sdk/build/general";

export type DollarValues = { [asset: string]: BigNumber };
export type TokenInsert = {
  token: Address;
  chain: Chain;
};
export type TokenTvlData = {
  [chain: Chain]: DollarValues;
};
export type CoinsApiData = {
  decimals: number;
  price: number;
  symbol: string;
  timestamp: number;
  PK?: string;
};
export type ChainData = {
  canonical: TokenTvlData;
  incoming: TokenTvlData;
  outgoing: TokenTvlData;
  native: TokenTvlData;
  ownTokens: TokenTvlData;
  // metadata: any;
};
export type FinalData = {
  [chain: Chain]: {
    canonical: any;
    thirdParty: any;
    native: any;
    ownTokens: any;
    total: any;
    // metadata: any;
  };
};
export type McapData = {
  [chain: Chain]: {
    [symbol: string]: {
      native: BigNumber;
      outgoing?: BigNumber;
      total: BigNumber;
    };
  };
};
export type McapsApiData = {
  mcap: number;
  timestamp: number;
};
