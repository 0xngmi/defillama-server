import {
  addToDBWritesList,
  getTokenAndRedirectData
} from "./database";
import { getTokenInfo } from "./erc20";
import { Write, CoinData } from "./dbInterfaces";

export default async function getWrites(params: { chain: string, timestamp: number, pricesObject: Object, writes?: Write[], projectName: string, underlyingChain?: string}) {
  let { chain, timestamp, pricesObject, writes = [], underlyingChain } = params
  const entries = Object.entries(pricesObject).map(([token, obj]) => {
    return {
      token: token.toLowerCase(),
      price: obj.price,
      underlying: obj.underlying?.toLowerCase(),
      symbol: obj.symbol ?? undefined,
      decimals: obj.decimals ?? undefined,
    }
  })

  const [
    tokenInfos,
    coinsData
  ] = await Promise.all([
    getTokenInfo(underlyingChain ?? chain, entries.map(i => i.token), undefined),
    getTokenAndRedirectData(entries.map(i => i.underlying).filter(i => i), underlyingChain ?? chain, timestamp)
  ])

  entries.map(({token, price, underlying, symbol, decimals }, i) => {
    const finalSymbol = symbol ?? tokenInfos.symbols[i].output
    const finalDecimals = decimals ?? tokenInfos.decimals[i].output
    let coinData: (CoinData | undefined) = coinsData.find(
      (c: CoinData) => c.address.toLowerCase() === underlying
    );
    if (!underlying) coinData = {
      price: 1,
      confidence: 0.98,
    } as CoinData;
    if (!coinData) return;

    addToDBWritesList(writes, chain, token, coinData.price * price, finalDecimals, finalSymbol, timestamp, params.projectName, Math.min(0.98, coinData.confidence as number))
  })

  const writesObject: any = {}
  writes.forEach((i: any) => writesObject[i.symbol] = i.price)
  // sdk.log(chain, writesObject)
  return writes
}