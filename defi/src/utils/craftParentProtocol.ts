import type { IParentProtocol } from "../protocols/types";
import protocols from "../protocols/data";
import { errorResponse } from "./shared";
import craftProtocol from "./craftProtocol";
import { IProtocolResponse, ICurrentChainTvls, IChainTvl, ITokens } from "../types";

interface ICombinedTvls {
  currentChainTvls: ICurrentChainTvls;
  chainTvls: {
    [chain: string]: {
      tvl: {
        [date: number]: number;
      };
      tokensInUsd: {
        [date: number]: {
          [token: string]: number;
        };
      };
      tokens: {
        [date: number]: {
          [token: string]: number;
        };
      };
    };
  };
  tokensInUsd: {
    [date: number]: {
      [token: string]: number;
    };
  };
  tokens: {
    [date: number]: {
      [token: string]: number;
    };
  };
  tvl: {
    [date: number]: number;
  };
}

const SIX_HOURS = 6 * 60 * 60;

export default async function craftParentProtocol(
  parentProtocol: IParentProtocol,
  useNewChainNames: boolean,
  useHourlyData: boolean
) {
  const childProtocols = protocols.filter((protocol) => protocol.parentProtocol === parentProtocol.id);

  if (childProtocols.length < 1 || childProtocols.map((p) => p.name).includes(parentProtocol.name)) {
    return errorResponse({
      message: "Protocol is not in our database",
    });
  }

  const childProtocolsTvls = await Promise.all(
    childProtocols.map(async (c) => await craftProtocol(c, useNewChainNames, useHourlyData, true))
  );

  const { currentChainTvls, chainTvls, tokensInUsd, tokens, tvl } = childProtocolsTvls.reduce<ICombinedTvls>(
    (acc, curr) => {
      // TOTAL TVL OF EACH CHAIN
      for (const name in curr.currentChainTvls) {
        acc.currentChainTvls = {
          ...acc.currentChainTvls,
          [name]: (acc.currentChainTvls[name] || 0) + curr.currentChainTvls[name],
        };
      }

      // TVL, NO.OF TOKENS, TOKENS IN USD OF EACH CHAIN BY DATE
      for (const chain in curr.chainTvls) {
        // TVLS OF EACH CHAIN BY DATE
        curr.chainTvls[chain].tvl.forEach(({ date, totalLiquidityUSD }) => {
          let nearestDate = date;

          if (!acc.chainTvls[chain]) {
            acc.chainTvls[chain] = {
              tvl: {},
              tokensInUsd: {},
              tokens: {},
            };
          }

          acc.chainTvls[chain].tvl = {
            ...acc.chainTvls[chain].tvl,
            [nearestDate]: (acc.chainTvls[chain].tvl[nearestDate] || 0) + totalLiquidityUSD,
          };
        });
        // TOKENS IN USD OF EACH CHAIN BY DATE
        curr.chainTvls[chain].tokensInUsd?.forEach(({ date, tokens }) => {
          let nearestDate = date;

          if (!acc.chainTvls[chain]) {
            acc.chainTvls[chain] = {
              tvl: {},
              tokensInUsd: {},
              tokens: {},
            };
          }

          if (!acc.chainTvls[chain].tokensInUsd[nearestDate]) {
            acc.chainTvls[chain].tokensInUsd[nearestDate] = {};
          }

          for (const token in tokens) {
            acc.chainTvls[chain].tokensInUsd[nearestDate][token] =
              (acc.chainTvls[chain].tokensInUsd[nearestDate][token] || 0) + tokens[token];
          }
        });
        // NO.OF TOKENS IN EACH CHAIN BY DATE
        curr.chainTvls[chain].tokens?.forEach(({ date, tokens }) => {
          let nearestDate = date;

          if (!acc.chainTvls[chain]) {
            acc.chainTvls[chain] = {
              tvl: {},
              tokensInUsd: {},
              tokens: {},
            };
          }

          if (!acc.chainTvls[chain].tokens[nearestDate]) {
            acc.chainTvls[chain].tokens[nearestDate] = {};
          }

          for (const token in tokens) {
            acc.chainTvls[chain].tokens[nearestDate][token] =
              (acc.chainTvls[chain].tokens[nearestDate][token] || 0) + tokens[token];
          }
        });
      }

      if (curr.tokensInUsd) {
        curr.tokensInUsd.forEach(({ date, tokens }) => {
          let nearestDate = date;

          // if (index > curr.tokensInUsd!.length - 3 && !acc.tokensInUsd[date]) {

          //   for (let i = date - SIX_HOURS; i <= date + SIX_HOURS; i++) {
          //     if (acc.tokensInUsd[i]) {
          //       nearestDate = i;
          //     }
          //   }
          // }

          Object.keys(tokens).forEach((token) => {
            if (!acc.tokensInUsd[nearestDate]) {
              acc.tokensInUsd[nearestDate] = {};
            }

            acc.tokensInUsd[nearestDate][token] = (acc.tokensInUsd[nearestDate][token] || 0) + tokens[token];
          });
        });
      }

      if (curr.tokens) {
        curr.tokens.forEach(({ date, tokens }) => {
          let nearestDate = date;

          // if (index > curr.tokens!.length - 3 && !acc.tokens[date]) {

          //   for (let i = date - SIX_HOURS; i <= date + SIX_HOURS; i++) {
          //     if (acc.tokens[i]) {
          //       nearestDate = i;
          //     }
          //   }
          // }

          Object.keys(tokens).forEach((token) => {
            if (!acc.tokens[nearestDate]) {
              acc.tokens[nearestDate] = {};
            }

            acc.tokens[nearestDate][token] = (acc.tokens[nearestDate][token] || 0) + tokens[token];
          });
        });
      }

      curr.tvl.forEach(({ date, totalLiquidityUSD }, index) => {
        let nearestDate = date;

        if (index > curr.tvl.length - 3 && !acc.tvl[date]) {
          for (let i = date - SIX_HOURS; i <= date + SIX_HOURS; i++) {
            if (acc.tvl[i]) {
              nearestDate = i;
            }
          }
        }

        acc.tvl[nearestDate] = (acc.tvl[nearestDate] || 0) + totalLiquidityUSD;
      });

      return acc;
    },
    {
      currentChainTvls: {},
      chainTvls: {},
      tokens: {},
      tokensInUsd: {},
      tvl: {},
    }
  );

  //  FORMAT NO.OF TOKENS BY DATE TO MATCH TYPE AS IN NORMAL PROTOCOL RESPONSE
  const formattedTokens: ITokens = [];
  for (const date in tokens) {
    formattedTokens.push({ date: Number(date), tokens: tokens[date] });
  }

  //  FORMAT TOTAL TOKENS VALUE IN USD BY DATE TO MATCH TYPE AS IN NORMAL PROTOCOL RESPONSE
  const formattedTokensInUsd: ITokens = [];
  for (const date in tokensInUsd) {
    formattedTokensInUsd.push({
      date: Number(date),
      tokens: tokensInUsd[date],
    });
  }

  //  FORMAT TVL, TOKENS, TOKENS IN USD BY DATE OF EACH CHAIN TO MATCH TYPE AS IN NORMAL PROTOCOL RESPONSE
  const formattedChainTvls: IChainTvl = {};
  for (const chain in chainTvls) {
    const tvl = Object.entries(chainTvls[chain].tvl).map(([date, totalLiquidityUSD]) => ({
      date: Number(date),
      totalLiquidityUSD,
    }));

    const tokens: ITokens = [];
    for (const date in chainTvls[chain].tokens) {
      tokens.push({
        date: Number(date),
        tokens: chainTvls[chain].tokens[date],
      });
    }

    const tokensInUsd: ITokens = [];
    for (const date in chainTvls[chain].tokensInUsd) {
      tokens.push({
        date: Number(date),
        tokens: chainTvls[chain].tokensInUsd[date],
      });
    }

    formattedChainTvls[chain] = {
      tvl,
      tokens,
      tokensInUsd,
    };
  }

  // FORMAT TVL BY DATE TO MATCH TYPE AS IN NORMAL PROTOCOL RESPONSE
  const formattedTvl = Object.entries(tvl).map(([date, totalLiquidityUSD]) => ({
    date: Number(date),
    totalLiquidityUSD,
  }));

  const response: IProtocolResponse = {
    ...parentProtocol,
    currentChainTvls,
    chainTvls: formattedChainTvls,
    tokens: formattedTokens,
    tokensInUsd: formattedTokensInUsd,
    tvl: formattedTvl,
    isParentProtocol: true,
  };

  // Filter overall tokens, tokens in usd by date if data is more than 6MB
  const jsonData = JSON.stringify(response);
  const dataLength = jsonData.length;

  if (dataLength >= 5.8e6) {
    response.tokens = null;
    response.tokensInUsd = null;

    for (const chain in response.chainTvls) {
      response.chainTvls[chain].tokens = null;
      response.chainTvls[chain].tokensInUsd = null;
    }
  }

  if (childProtocolsTvls.length > 0) {
    response.otherProtocols = childProtocolsTvls[0].otherProtocols;

    // show all hallmarks of child protocols on parent protocols chart
    response.hallmarks = [];
    childProtocolsTvls
      .filter((childModule) => childModule.hallmarks)
      .forEach((m) => {
        m.hallmarks?.forEach((hallmark: [number, string]) => response.hallmarks?.push(hallmark));
      });

    response.hallmarks.sort((a, b) => a[0] - b[0]);
  }

  return response;
}
