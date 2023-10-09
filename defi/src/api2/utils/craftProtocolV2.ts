import type { Protocol } from "../../protocols/types";
import protocols from "../../protocols/data";
import { nonChains, getChainDisplayName, transformNewChainName, addToChains } from "../../utils/normalizeChain";
import type { IProtocolResponse, } from "../../types";
import parentProtocols from "../../protocols/parentProtocols";
import { getAvailableMetricsById } from "../../adaptors/data/configs";
import { getRaises, getCachedMCap } from "../cache";
import { TABLES, getAllProtocolItems, getLatestProtocolItem } from "../db/index";
import { normalizeEthereum, selectChainFromItem, } from "../../utils/craftProtocol";
import {
  dailyTvl, dailyTokensTvl, dailyUsdTokensTvl, hourlyTvl, hourlyTokensTvl, hourlyUsdTokensTvl,
} from "../../utils/getLastRecord"


export default async function craftProtocolV2({
  protocolData,
  useNewChainNames,
  useHourlyData,
  skipAggregatedTvl,
}: {
  protocolData: Protocol;
  useNewChainNames: boolean;
  useHourlyData: boolean;
  skipAggregatedTvl: boolean;
}) {
  const { misrepresentedTokens = false, hallmarks, methodology, ...restProtocolData } = protocolData as any
  const dummyRes = ([] as any[])

  const [historicalUsdTvl, historicalUsdTokenTvl, historicalTokenTvl, mcap, lastUsdHourlyRecord, lastUsdTokenHourlyRecord, lastTokenHourlyRecord] = await Promise.all([
    getAllProtocolItems(useHourlyData ? hourlyTvl : dailyTvl, protocolData.id),
    misrepresentedTokens ? dummyRes : getAllProtocolItems(useHourlyData ? hourlyUsdTokensTvl : dailyUsdTokensTvl, protocolData.id),
    misrepresentedTokens ? dummyRes : getAllProtocolItems(useHourlyData ? hourlyTokensTvl : dailyTokensTvl, protocolData.id),
    getCachedMCap(protocolData.gecko_id),
    getLatestProtocolItem(hourlyTvl, protocolData.id),
    getLatestProtocolItem(hourlyUsdTokensTvl, protocolData.id),
    getLatestProtocolItem(hourlyTokensTvl, protocolData.id),
  ]);

  let response: IProtocolResponse = {
    ...restProtocolData,
    chainTvls: {},
    tvl: [],
    chains: [],
    currentChainTvls: {},
    raises: getRaises(protocolData.id),
    metrics: getAvailableMetricsById(protocolData.id),
    mcap,
  };

  const lastRecord = historicalUsdTvl[historicalUsdTvl.length - 1];

  Object.entries(lastRecord ?? {}).forEach(([chain]) => {
    if (nonChains.includes(chain) && chain !== "tvl") {
      return;
    }

    const displayChainName = getChainDisplayName(chain, useNewChainNames);

    const container = {} as any;

    container.tvl = historicalUsdTvl
      ?.map((item) => ({
        date: item.SK,
        totalLiquidityUSD: selectChainFromItem(item, chain) && Number(selectChainFromItem(item, chain).toFixed(5)),
      }))
      .filter((item) => item.totalLiquidityUSD === 0 || item.totalLiquidityUSD);

    container.tokensInUsd = historicalUsdTokenTvl
      ?.map((item) => ({
        date: item.SK,
        tokens: normalizeEthereum(selectChainFromItem(item, chain)),
      }))
      .filter((item) => item.tokens);

    container.tokens = historicalTokenTvl
      ?.map((item) => ({
        date: item.SK,
        tokens: normalizeEthereum(selectChainFromItem(item, chain)),
      }))
      .filter((item) => item.tokens);

    if (container.tvl !== undefined && container.tvl.length > 0) {
      if (chain === "tvl") {
        response = {
          ...response,
          ...container,
        };
      } else {
        response.chainTvls[displayChainName] = { ...container };
      }
    }
  });

  if (!useHourlyData) {
    // check for falsy values and push lastHourlyRecord to dataset
    lastUsdHourlyRecord &&
      lastUsdHourlyRecord.SK !== historicalUsdTvl[historicalUsdTvl.length - 1]?.SK &&
      historicalUsdTvl.push(lastUsdHourlyRecord);
    lastUsdTokenHourlyRecord &&
      lastUsdTokenHourlyRecord.SK !== historicalUsdTokenTvl[historicalUsdTokenTvl.length - 1]?.SK &&
      historicalUsdTokenTvl.push(lastUsdTokenHourlyRecord);
    lastTokenHourlyRecord &&
      lastTokenHourlyRecord.SK !== historicalTokenTvl[historicalTokenTvl.length - 1]?.SK &&
      historicalTokenTvl.push(lastTokenHourlyRecord);
  }


  Object.entries(lastUsdHourlyRecord ?? {}).forEach(([chain, chainTvl]: [string, any]) => {
    if (nonChains.includes(chain) && chain !== "tvl") {
      return;
    }

    const displayChainName = getChainDisplayName(chain, useNewChainNames);
    addToChains(response.chains, displayChainName);
    if (chain !== "tvl") {
      response.currentChainTvls[displayChainName] = chainTvl ? Number(chainTvl.toFixed(5)) : 0;
    }
    if (chain !== "tvl" && response.chainTvls[displayChainName] === undefined) {
      response.chainTvls[displayChainName] = {
        tvl: [],
        tokensInUsd: [],
        tokens: [],
      };
    }
    const container = chain === "tvl" ? response : response.chainTvls[displayChainName];

    container?.tvl?.push(
      ...historicalUsdTvl
        ?.map((item) => ({
          date: item.SK,
          totalLiquidityUSD: selectChainFromItem(item, chain) && Number(selectChainFromItem(item, chain).toFixed(5)),
        }))
        .filter((item) => item.totalLiquidityUSD === 0 || item.totalLiquidityUSD)
    );

    container?.tokensInUsd?.push(
      ...historicalUsdTokenTvl
        ?.map((item) => ({
          date: item.SK,
          tokens: normalizeEthereum(selectChainFromItem(item, chain)),
        }))
        .filter((item) => item.tokens)
    );

    container?.tokens?.push(
      ...historicalTokenTvl
        ?.map((item) => ({
          date: item.SK,
          tokens: normalizeEthereum(selectChainFromItem(item, chain)),
        }))
        .filter((item) => item.tokens)
    );
  });

  const singleChain = transformNewChainName(protocolData.chain);

  if (response.chainTvls[singleChain] === undefined && response.chains.length === 0) {
    response.chains.push(singleChain);
    response.chainTvls[singleChain] = {
      tvl: response.tvl,
      tokensInUsd: response.tokensInUsd,
      tokens: response.tokens,
    };
  }

  if (
    response.chainTvls[singleChain] !== undefined &&
    response.chainTvls[singleChain].tvl.length < response.tvl.length
  ) {
    const singleChainTvls = response.chainTvls[singleChain].tvl;
    const first = singleChainTvls[0].date;
    response.chainTvls[singleChain].tvl = response.tvl.filter((t: any) => t.date < first).concat(singleChainTvls);
  }

  if (skipAggregatedTvl) {
    response.tvl = [];
    response.tokensInUsd = [];
    response.tokens = [];
  }

  const childProtocolsNames = protocolData.parentProtocol
    ? protocols.filter((p) => p.parentProtocol === protocolData.parentProtocol).map((p) => p.name)
    : [];

  const parentName = parentProtocols.find((p) => p.id === protocolData.parentProtocol)?.name ?? null;

  if (childProtocolsNames.length > 0 && parentName) {
    response.otherProtocols = [parentName, ...childProtocolsNames];
  }

  if (methodology)
    response.methodology = methodology;

  if (misrepresentedTokens === true)
    response.misrepresentedTokens = true;

  if (hallmarks) {
    response.hallmarks = hallmarks;
    response.hallmarks?.sort((a, b) => a[0] - b[0]);
  }

  return response;
}
