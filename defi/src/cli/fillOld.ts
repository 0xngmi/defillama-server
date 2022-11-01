require("dotenv").config();

import dynamodb from "../utils/shared/dynamodb";
import { getProtocol, } from "./utils";
import { getBlocksRetry } from "../storeTvlInterval/blocks";
import {
  dailyTokensTvl,
  dailyTvl,
  dailyUsdTokensTvl,
} from "../utils/getLastRecord";
import { getClosestDayStartTimestamp } from "../utils/date";
import { storeTvl } from "../storeTvlInterval/getAndStoreTvl";
import {
  getCoingeckoLock,
  releaseCoingeckoLock,
} from "../utils/shared/coingeckoLocks";
import type { Protocol } from "../protocols/data";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { importAdapter } from "./utils/importAdapter";

const secondsInDay = 24 * 3600;

type DailyItems = (DocumentClient.ItemList | undefined)[];
async function deleteItemsOnSameDay(dailyItems: DailyItems, timestamp: number) {
  for (const items of dailyItems) {
    const itemsOnSameDay =
      items?.filter(
        (item) => getClosestDayStartTimestamp(item.SK) === timestamp
      ) ?? [];
    for (const item of itemsOnSameDay) {
      await dynamodb.delete({
        Key: {
          PK: item.PK,
          SK: item.SK,
        },
      });
    }
  }
}

async function getAndStore(
  timestamp: number,
  protocol: Protocol,
  dailyItems: DailyItems
) {
  const adapterModule = await importAdapter(protocol)
  let ethereumBlock = 1e15, chainBlocks = {}
  if (!process.env.SKIP_BLOCK_FETCH) {
    const res = await getBlocksRetry(timestamp, { adapterModule })
    ethereumBlock = res.ethereumBlock
    chainBlocks = res.chainBlocks
  }

  const tvl = await storeTvl(
    timestamp,
    ethereumBlock,
    chainBlocks,
    protocol,
    adapterModule,
    {},
    4,
    getCoingeckoLock,
    false,
    false,
    true,
    () => deleteItemsOnSameDay(dailyItems, timestamp)
  );
  console.log(timestamp, new Date(timestamp * 1000).toDateString(), tvl);
}

function getDailyItems(pk: string) {
  return dynamodb
    .query({
      ExpressionAttributeValues: {
        ":pk": pk,
      },
      KeyConditionExpression: "PK = :pk",
    })
    .then((res) => res.Items);
}

const main = async () => {
  const protocolToRefill = process.argv[2]
  const latestDate = (process.argv[3] ?? "now") === "now" ? undefined : Number(process.argv[3]); // undefined -> start from today, number => start from that unix timestamp
  const batchSize = Number(process.argv[4] ?? 1); // how many days to fill in parallel
  if(process.env.HISTORICAL !== "true"){
    throw new Error(`You must set HISTORICAL="true" in your .env`)
  }
  const protocol = getProtocol(protocolToRefill);
  const adapter = await importAdapter(protocol);
  if (adapter.timetravel === false) {
    throw new Error("Adapter doesn't support refilling");
  }
  const dailyTvls = await getDailyItems(dailyTvl(protocol.id));
  const dailyTokens = await getDailyItems(dailyTokensTvl(protocol.id));
  const dailyUsdTokens = await getDailyItems(dailyUsdTokensTvl(protocol.id));
  const dailyItems = [dailyTvls, dailyTokens, dailyUsdTokens];
  const start = adapter.start ?? 0;
  const now = Math.round(Date.now() / 1000);
  let timestamp = getClosestDayStartTimestamp(latestDate ?? now);
  if (timestamp > now) {
    timestamp = getClosestDayStartTimestamp(timestamp - secondsInDay);
  }
  setInterval(() => {
    releaseCoingeckoLock();
  }, 1.5e3);
  while (timestamp > start) {
    const batchedActions = [];
    for (let i = 0; i < batchSize && timestamp > start; i++) {
      batchedActions.push(getAndStore(timestamp, protocol, dailyItems));
      timestamp = getClosestDayStartTimestamp(timestamp - secondsInDay);
    }
    await Promise.all(batchedActions);
  }
};
main().then(() => {
  console.log('Done!!!')
  process.exit(0)
})

