import { Producer } from "kafkajs";
import { Topic, topics as allTopics, validate } from "./jsonValidation";
import { getProducer } from "./kafka";

export type Dynamo = {
  SK: number;
  PK: string;
  adapter: string;
  confidence: number;
  price: number;
  redirect?: string;
  decimals?: number;
  symbol?: string;
  timestamp?: number;
  mcap?: number;
};

async function produceTopics(
  items: Dynamo[],
  topic: Topic,
  producer: Producer,
) {
  const messages: string[] = [];

  items.map((item) => {
    const { symbol, decimals, price, SK } = item;
    if (topic != "coins-timeseries" && SK != 0) return;
    if (topic != "coins-metadata" && !price) return;
    if (topic == "coins-metadata" && (!symbol || decimals == null)) return;
    const messageObject: object = convertToMessage(item, topic);
    validate(messageObject, topic);
    const message = JSON.stringify(messageObject);
    if (messages.includes(message)) {
      message;
      return;
    }
    messages.push(message);
  });

  await producer.send({
    topic: `${topic}`,
    messages: messages.map((value) => ({ value })),
  });
}
function convertToMessage(item: Dynamo, topic: Topic): object {
  const {
    PK,
    symbol,
    decimals,
    price,
    confidence,
    SK,
    adapter,
    redirect,
    mcap,
  } = item;

  const { chain, address, pid } = splitPk(PK);
  const redirectPid = redirect ? splitPk(redirect).pid : undefined;

  switch (topic) {
    case "coins-metadata":
      return {
        symbol,
        decimals: Number(decimals),
        address,
        pid,
        chain,
        source: adapter,
        redirect: redirectPid,
      };
    case "coins-current":
      return { pid, price, confidence, source: adapter, mcap };
    case "coins-timeseries":
      return { pid, price, confidence, source: adapter, ts: SK, mcap };
    default:
      throw new Error(`Topic '${topic}' is not valid`);
  }
}
function splitPk(pk: string): { chain: string; address: string; pid: string } {
  const assetPrefix: string = "asset#";
  const coingeckoPrefix: string = "coingecko#";

  if (pk.toLowerCase().startsWith(coingeckoPrefix)) {
    const address = pk.substring(coingeckoPrefix.length).toLowerCase();
    return {
      chain: "coingecko",
      address,
      pid: `coingecko:${address}`,
    };
  }

  if (pk.startsWith(assetPrefix)) pk = pk.substring(assetPrefix.length);
  const chain = pk.split(":")[0].toLowerCase();
  const address = pk.substring(pk.split(":")[0].length + 1).toLowerCase();
  return { chain, address, pid: `${chain}:${address}` };
}

export default async function produce(
  items: Dynamo[],
  topics: Topic[] = allTopics,
) {
  try {
    if (!items.length) return;
    const invalidTopic = topics.find((t: any) => {
      !allTopics.includes(t);
    });
    if (invalidTopic) throw new Error(`invalid topic: ${invalidTopic}`);
    const producer: Producer = await getProducer();
    await Promise.all(
      topics.map((topic: Topic) => produceTopics(items, topic, producer)),
    );
  } catch (error) {
    console.error("Error producing messages", error);
  }
}
