import BigNumber from "bignumber.js";
import { CoinsApiData, McapsApiData, TokenTvlData } from "./types";
import { excludedTvlKeys, zero } from "./constants";
import fetch from "node-fetch";
import sleep from "../src/utils/shared/sleep";
import { call, multiCall } from "@defillama/sdk/build/abi/abi2";
import { Address } from "@defillama/sdk/build/types";
import * as incomingAssets from "./adapters";
import { additional, excluded } from "./adapters/manual";
import { Chain } from "@defillama/sdk/build/general";
import PromisePool from "@supercharge/promise-pool";
import { fetchNotTokens, storeNotTokens } from "./layer2pg";

export function aggregateChainTokenBalances(usdTokenBalances: TokenTvlData[][]): TokenTvlData {
  const chainUsdTokenTvls: TokenTvlData = {};

  usdTokenBalances.map((type: TokenTvlData[]) =>
    type.map((bridge: any) => {
      Object.keys(bridge).map((chain: string) => {
        if (excludedTvlKeys.includes(chain)) return;
        if (!(chain in chainUsdTokenTvls)) chainUsdTokenTvls[chain] = {};
        Object.keys(bridge[chain]).map((asset: string) => {
          if (!(asset in chainUsdTokenTvls[chain])) chainUsdTokenTvls[chain][asset] = zero;
          chainUsdTokenTvls[chain][asset] = BigNumber(bridge[chain][asset]).plus(chainUsdTokenTvls[chain][asset]);
        });
      });
    })
  );

  return chainUsdTokenTvls;
}
async function restCallWrapper(request: () => Promise<any>, retries: number = 4, name: string = "-") {
  while (retries > 0) {
    try {
      const res = await request();
      return res;
    } catch {
      await sleep(10000 + 4e4 * Math.random());
      restCallWrapper(request, retries--);
    }
  }
  throw new Error(`couldnt work ${name} call after retries!`);
}
export async function getPrices(
  readKeys: string[],
  timestamp: number | "now"
): Promise<{ [address: string]: CoinsApiData }> {
  if (!readKeys.length) return {};
  const readRequests: any[] = [];
  for (let i = 0; i < readKeys.length; i += 100) {
    const body = {
      coins: readKeys.slice(i, i + 100),
    } as any;
    if (timestamp !== "now") {
      body.timestamp = timestamp;
    }
    readRequests.push(
      restCallWrapper(
        () =>
          fetch(
            `https://coins.llama.fi/prices?source=internal${
              process.env.COINS_KEY ? `?apikey=${process.env.COINS_KEY}` : ""
            }`,
            {
              method: "POST",
              body: JSON.stringify(body),
              headers: { "Content-Type": "application/json" },
            }
          )
            .then((r) => r.json())
            .then((r) =>
              Object.entries(r.coins).map(([PK, value]) => ({
                ...(value as any),
                PK,
              }))
            ),
        3,
        "coin prices"
      )
    );
  }

  const tokenData = await Promise.all(readRequests);

  const aggregatedRes: { [address: string]: CoinsApiData } = {};
  tokenData.map((batch: CoinsApiData[]) => {
    batch.map((a: CoinsApiData) => {
      if (a.PK) aggregatedRes[a.PK] = a;
    });
  });

  const notPricedTokens = filterForNotTokens(readKeys, Object.keys(aggregatedRes));
  await storeNotTokens(notPricedTokens);

  return aggregatedRes;
}
export async function getMcaps(
  readKeys: string[],
  timestamp: number | "now"
): Promise<{ [address: string]: McapsApiData }> {
  if (!readKeys.length) return {};
  const readRequests: any[] = [];
  for (let i = 0; i < readKeys.length; i += 100) {
    const body = {
      coins: readKeys.slice(i, i + 100),
    } as any;
    if (timestamp !== "now") {
      body.timestamp = timestamp;
    }
    readRequests.push(
      restCallWrapper(
        () =>
          fetch(`https://coins.llama.fi/mcaps${process.env.COINS_KEY ? `?apikey=${process.env.COINS_KEY}` : ""}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
          }).then((r) => r.json()),
        undefined,
        "mcaps"
      )
    );
  }

  const tokenData = await Promise.all(readRequests);

  const aggregatedRes: { [address: string]: any } = {};
  tokenData.map((batch: { [address: string]: McapsApiData }[]) => {
    Object.keys(batch).map((a: any) => {
      if (batch[a].mcap) aggregatedRes[a] = batch[a];
    });
  });
  return aggregatedRes;
}

async function getSolanaTokenSupply(tokens: string[]): Promise<{ [token: string]: number }> {
  const supplies: { [token: string]: number } = {};
  let i = 0;
  let j = 0;
  const notTokens: string[] = [];
  if (!process.env.SOLANA_RPC) throw new Error(`no Solana RPC supplied`);
  await PromisePool.withConcurrency(50)
    .for(tokens.slice(0, Math.min(tokens.length, 5000)))
    .process(async (token) => {
      tokens;
      i;
      try {
        const res = await fetch(process.env.SOLANA_RPC ?? "", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenSupply",
            params: [token],
          }),
        }).then((r) => r.json());
        i++;

        if (res.error) {
          notTokens.push(`solana:${token}`);
          res.error;
        } else supplies[token] = res.result.value.amount;
      } catch (e) {
        j++;
      }
    });

  let a = Object.keys(supplies).length;
  await storeNotTokens(notTokens);
  return supplies;
}
async function getEVMSupplies(chain: Chain, contracts: Address[]): Promise<{ [token: string]: number }> {
  const step: number = 200;
  const supplies: { [token: string]: number } = {};

  for (let i = 0; i < contracts.length; i += step) {
    try {
      const res = await multiCall({
        chain,
        calls: contracts.slice(i, i + step).map((target: string) => ({
          target,
        })),
        abi: "erc20:totalSupply",
        permitFailure: true,
      });
      contracts.slice(i, i + step).map((c: Address, i: number) => {
        if (res[i]) supplies[c] = res[i];
      });
    } catch {
      await PromisePool.withConcurrency(20)
        .for(contracts.slice(i, i + step))
        .process(async (target) => {
          const res = await call({
            chain,
            target,
            abi: "erc20:totalSupply",
          });
          if (res) supplies[target] = res;
        });
    }
  }
  return supplies;
}
export function filterForNotTokens(tokens: Address[], notTokens: Address[]): Address[] {
  const map: any = new Map();
  for (let item of notTokens) {
    map.set(item, true);
  }
  return tokens.filter((item) => !map[item]);
}
export async function fetchSupplies(chain: Chain, contracts: Address[]): Promise<{ [token: string]: number }> {
  try {
    const notTokens = chain == "solana" ? await fetchNotTokens(chain) : [];
    const tokens = filterForNotTokens(contracts, notTokens);
    if (chain == "solana") return await getSolanaTokenSupply(tokens);
    return await getEVMSupplies(chain, tokens);
  } catch (e) {
    throw new Error(`multicalling token supplies failed for chain ${chain}`);
  }
}
export async function fetchBridgeTokenList(chain: Chain): Promise<Address[]> {
  const j = Object.keys(incomingAssets).indexOf(chain);
  if (j == -1) return [];
  try {
    const tokens: Address[] = await Object.values(incomingAssets)[j]();
    const filteredTokens: Address[] =
      chain in excluded ? tokens.filter((t: string) => !excluded[chain].includes(t)) : tokens;
    if (chain == "solana") return filteredTokens;
    const normalizedTokens: Address[] = filteredTokens.map((t: string) => t.toLowerCase());
    if (!(chain in additional)) return normalizedTokens;
    const additionalTokens = additional[chain].map((t: string) => t.toLowerCase());
    return [...normalizedTokens, ...additionalTokens];
  } catch {
    throw new Error(`${chain} bridge adapter failed`);
  }
}
export function sortBySize() {
  const coins: { [value: string]: string } = {};
  const res = Object.entries(coins).sort(([_A, valueA], [_B, valueB]) => {
    [_A, _B];
    return Number(valueB) - Number(valueA);
  });
  console.log(res.slice(0, 10));
}
