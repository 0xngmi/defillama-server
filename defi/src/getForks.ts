import { processProtocols, TvlItem } from './storeGetCharts';
import { successResponse, wrap, IResponse } from './utils/shared';
import type { Protocol } from './protocols/data';
import { extraSections } from './utils/normalizeChain';

interface SumDailyTvls {
  [timestamp: number]: {
    [fork: string]: {
      [key: string]: number;
    };
  };
}

interface ForkedProtocols {
  [fork: string]: Set<string>;
}

interface Item {
  [key: string]: number;
}

function sum(
  total: SumDailyTvls,
  fork: string,
  time: number,
  item: Item = {},
  forkedProtocols: ForkedProtocols,
  protocol: string
) {
  if (total[time] === undefined) {
    total[time] = {};
  }

  const data = total[time][fork] || {};

  for (const i in item) {
    const section: string = i.includes('-') ? i.split('-')[1] : i;
    if (section === 'tvl' || extraSections.includes(section)) {
      data[section] = (data[section] || 0) + item[section];
    }
  }

  total[time][fork] = data;

  if (forkedProtocols[fork] == undefined) {
    forkedProtocols[fork] = new Set();
  }
  forkedProtocols[fork].add(protocol);
}

const handler = async (_event: AWSLambda.APIGatewayEvent): Promise<IResponse> => {
  const sumDailyTvls = {} as SumDailyTvls;
  const forkedProtocols = {} as ForkedProtocols;

  await processProtocols(async (timestamp: number, item: TvlItem, protocol: Protocol) => {
    try {
      let forks = protocol.forkedFrom;

      if (forks) {
        forks.forEach((fork) => {
          sum(sumDailyTvls, fork, timestamp, item, forkedProtocols, protocol.name);
        });
        return;
      }
    } catch (error) {
      console.log(protocol.name, error);
    }
  });

  return successResponse(
    {
      chart: sumDailyTvls,
      forks: Object.fromEntries(Object.entries(forkedProtocols).map((c) => [c[0], Array.from(c[1])])),
    },
    10 * 60
  ); // 10 mins cache
};

export default wrap(handler);
