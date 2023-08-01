import chainToCoingeckoId from "../../../common/chainToCoingeckoId";
import ddb from "./shared/dynamodb";

interface StringObject {
  [id: string]: string | undefined;
}
export const platformMap = Object.entries(chainToCoingeckoId).reduce(
  (o: any, i) => {
    o[i[1]] = i[0];
    return o;
  },
  {}
) as StringObject;

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    [network: string]: string;
  };
}

function lowercase(address: string, chain: string) {
  return chain === "solana" ? address : address.toLowerCase()
}

export async function iterateOverPlatforms(
  coin: Coin,
  iterator: (PK: string, tokenAddress: string, chain: string) => Promise<void>,
  coinPlatformData: any
) {
  const platforms = coin.platforms as StringObject;
  for (const platform in platforms) {
    if (platform !== "" && platforms[platform] !== "") {
      try {
        const chain = platformMap[platform.toLowerCase()];
        if (chain === undefined) {
          continue;
        }
        const address = chain + ":" + lowercase(platforms[platform]!, chain).trim();
        const PK = `asset#${address}`;
        if (!coinPlatformData[PK]) {
          await iterator(PK, platforms[platform]!, chain);
        }
      } catch (e) {
        console.error(coin, platform, e);
      }
    }
  }
}


export async function getCoinPlatformData(
  coins: Coin[],
) {
  const coinPlatformData: any = {}
  const pks = []
  try {
    for (const coin of coins) {
      const platforms = coin.platforms as StringObject;
      for (const platform in platforms) {
        if (platform !== "" && platforms[platform] !== "") {
          const chain = platformMap[platform.toLowerCase()];
          if (chain === undefined) {
            continue;
          }
          const address = chain + ":" + lowercase(platforms[platform]!, chain).trim();
          const PK = `asset#${address}`;
          pks.push(PK)
        }
      }
    }

    const storedItems: any= await ddb.batchGet(pks.map((PK) => ({ PK, SK: 0, })))
    storedItems.forEach((item: any) => {
      coinPlatformData[item.PK] = item.Item
    })
  } catch (e) {
    console.error(e);
  }
  return coinPlatformData
}
