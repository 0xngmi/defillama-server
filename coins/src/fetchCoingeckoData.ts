import fetch from "node-fetch";
import { wrapScheduledLambda } from "./utils/shared/wrap";
import { getCoingeckoLock, setTimer } from "./utils/shared/coingeckoLocks";
import ddb, { batchWrite, batchGet } from "./utils/shared/dynamodb";
import { cgPK } from "./utils/keys";
import { decimals, symbol } from "@defillama/sdk/build/erc20";
import invokeLambda from "./utils/shared/invokeLambda";
import sleep from "./utils/shared/sleep";
import { Coin, iterateOverPlatforms } from "./utils/coingeckoPlatforms";
import { getCurrentUnixTimestamp, toUNIXTimestamp } from "./utils/date";

async function retryCoingeckoRequest(
  url: string,
  retries: number
): Promise<CoingeckoResponse> {
  for (let i = 0; i < retries; i++) {
    await getCoingeckoLock();
    try {
      const coinData = await fetch(url).then((r) => r.json());
      return coinData;
    } catch (e) {
      if ((i + 1) % 3 === 0 && retries > 3) {
        await sleep(10e3); // 10s
      }
      continue;
    }
  }
  return {};
}

interface CoingeckoResponse {
  [cgId: string]: {
    usd: number;
    usd_market_cap: number;
    last_updated_at: number;
  };
}

interface IdToSymbol {
  [id: string]: string;
}

function storeCoinData(
  timestamp: number,
  coinData: CoingeckoResponse,
  idToSymbol: IdToSymbol
) {
  return batchWrite(
    Object.entries(coinData)
      .filter((c) => c[1]?.usd !== undefined)
      .map(([cgId, data]) => ({
        PK: cgPK(cgId),
        SK: 0,
        price: data.usd,
        mcap: data.usd_market_cap,
        timestamp,
        symbol: idToSymbol[cgId].toUpperCase(),
        confidence: 0.99
      })),
    false
  );
}

function storeHistoricalCoinData(
  coinData: CoingeckoResponse,
) {
  return batchWrite(
    Object.entries(coinData)
      .filter((c) => c[1]?.usd !== undefined)
      .map(([cgId, data]) => ({
        SK: data.last_updated_at,
        PK: cgPK(cgId),
        price: data.usd,
        confidence: 0.99
      })),
    false
  );
}

let solanaTokens: Promise<any>;
async function getSymbolAndDecimals(tokenAddress: string, chain: string) {
  if (chain === "solana") {
    if (solanaTokens === undefined) {
      solanaTokens = fetch(
        "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json"
      ).then((r) => r.json());
    }
    const token = ((await solanaTokens).tokens as any[]).find(
      (t) => t.address === tokenAddress
    );
    if (token === undefined) {
      throw new Error(
        `Token ${chain}:${tokenAddress} not found in solana token list`
      );
    }
    return {
      symbol: token.symbol,
      decimals: Number(token.decimals)
    };
  } else if (!tokenAddress.startsWith(`0x`)) {
    throw new Error(
      `Token ${chain}:${tokenAddress} is not on solana or EVM so we cant get token data yet`
    );
  } else {
    try {
      return {
        symbol: (await symbol(tokenAddress, chain as any)).output,
        decimals: Number((await decimals(tokenAddress, chain as any)).output)
      };
    } catch (e) {
      throw new Error(
        `ERC20 methods aren't working for token ${chain}:${tokenAddress}`
      );
    }
  }
}

async function getAndStoreCoins(coins: Coin[], rejected: Coin[]) {
  const coinIds = coins.map((c) => c.id);
  const coinData = await retryCoingeckoRequest(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(
      ","
    )}&vs_currencies=usd&include_market_cap=true&include_last_updated_at=true`,
    10
  );
  const idToSymbol = {} as IdToSymbol;
  const returnedCoins = new Set(Object.keys(coinData));
  coins.forEach((coin) => {
    if (!returnedCoins.has(coin.id)) {
      console.error(`Couldn't get data for ${coin.id}`);
      rejected.push(coin);
    }
    idToSymbol[coin.id] = coin.symbol;
  });
  const timestamp = getCurrentUnixTimestamp();
  await storeCoinData(timestamp, coinData, idToSymbol);
  await storeHistoricalCoinData(coinData);
  await Promise.all(
    coins.map((coin) =>
      iterateOverPlatforms(coin, async (PK, tokenAddress, chain) => {
        if (coinData[coin.id]?.usd === undefined) {
          return;
        }
        const { decimals, symbol } = await getSymbolAndDecimals(
          tokenAddress,
          chain
        );
        await ddb.put({
          PK,
          SK: 0,
          created: timestamp,
          decimals: decimals,
          symbol: symbol,
          redirect: cgPK(coin.id),
          confidence: 0.99
        });
      })
    )
  );
}

const HOUR = 3600;
async function getAndStoreHourly(coin: Coin, rejected: Coin[]) {
  const toTimestamp = getCurrentUnixTimestamp();
  const fromTimestamp = toTimestamp - 6 * HOUR;
  const coinData = await retryCoingeckoRequest(
    `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart/range?vs_currency=usd&from=${fromTimestamp}&to=${toTimestamp}`,
    3
  );
  if (!Array.isArray(coinData.prices)) {
    console.error(`Couldn't get data for ${coin.id}`);
    rejected.push(coin);
    return;
  }
  const PK = cgPK(coin.id);
  const prevWritenItems = await batchGet(
    coinData.prices.map((price) => ({
      SK: toUNIXTimestamp(price[0]),
      PK
    }))
  );
  const writtenTimestamps = prevWritenItems.reduce((all, item) => {
    all[item.SK] = true;
    return all;
  }, {});
  await batchWrite(
    coinData.prices
      .filter((price) => {
        const ts = toUNIXTimestamp(price[0]);
        return !writtenTimestamps[ts];
      })
      .map((price) => ({
        SK: toUNIXTimestamp(price[0]),
        PK,
        price: price[1],
        confidence: 0.99
      })),
    false
  );
}

const step = 50;
const handler = (hourly: boolean) => async (
  event: any,
  _context: AWSLambda.Context
) => {
  const coins = event.coins as Coin[];
  const depth = event.depth as number;
  const rejected = [] as Coin[];
  const timer = setTimer();
  const requests = [];
  if (hourly) {
    for (let i = 0; i < coins.length; i += step) {
      await Promise.all(
        coins
          .slice(i, i + step)
          .map((coin) => getAndStoreHourly(coin, rejected))
      );
    }
  } else {
    for (let i = 0; i < coins.length; i += step) {
      requests.push(getAndStoreCoins(coins.slice(i, i + step), rejected));
    }
    await Promise.all(requests);
  }
  clearInterval(timer);
  if (rejected.length > 0) {
    if (depth >= 2) {
      console.error("Unprocessed coins", rejected);
      return;
    } else {
      await sleep(10e3); // 10 seconds
      await invokeLambda(
        hourly
          ? `coins-prod-fetchHourlyCoingeckoData`
          : `coins-prod-fetchCoingeckoData`,
        {
          coins: rejected,
          depth: depth + 1
        }
      );
    }
  }
};

export const fetchCoingeckoData = wrapScheduledLambda(handler(false));
export const fetchHourlyCoingeckoData = wrapScheduledLambda(handler(true));
