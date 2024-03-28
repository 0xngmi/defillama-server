import postgres from "postgres";
import { queryPostgresWithRetry } from "../l2/layer2pg";
import { ChartData, FinalChainData, FinalData } from "./types";
import setEnvSecrets from "../src/utils/shared/setEnvSecrets";
import { getCurrentUnixTimestamp } from "../src/utils/date";

let auth: string[] = [];
const secondsInADay = 86400;
async function iniDbConnection() {
  await setEnvSecrets();
  auth = process.env.COINS2_AUTH?.split(",") ?? [];
  if (!auth || auth.length != 3) throw new Error("there arent 3 auth params");

  return postgres(auth[0], { idle_timeout: 90 });
}
export default async function storeHistoricalToDB(res: any) {
  const sql = await iniDbConnection();

  const read = await queryPostgresWithRetry(
    sql`
        select * from chainassets
        limit 1
        `,
    sql
  );
  const columns = read.columns.map((c: any) => c.name);

  try {
    const promises: Promise<void>[] = [];
    Object.keys(res).map(async (k: string) => {
      if (!columns.includes(k)) {
        promises.push(
          queryPostgresWithRetry(
            sql`
                alter table chainassets
                add ${sql(k)} text
                `,
            sql
          )
        );
      }
    });
    await Promise.all(promises);
  } catch {}

  const insert: { [key: string]: string } = {};
  columns.map((k: string) => {
    insert[k] = k in res ? JSON.stringify(res[k]) : "{}";
  });

  await queryPostgresWithRetry(
    sql`
        insert into chainassets
        ${sql([insert], ...columns)}
        on conflict (timestamp)
        do nothing
        `,
    sql
  );

  sql.end();
}
function removeTokenBreakdown(data: FinalChainData): FinalChainData {
  const overviewData: any = {};
  Object.entries(data).map(([key, value]) => {
    overviewData[key] = Number(value.total).toFixed();
  });

  return overviewData;
}
function parsePgData(timeseries: any[], chain: string) {
  const result: ChartData[] = [];
  timeseries.map((t: any) => {
    if (chain != "*") {
      const rawData = JSON.parse(t[chain]);
      if (!rawData) return;
      const data = removeTokenBreakdown(rawData);
      result.push({ timestamp: t.timestamp, data });
      return;
    }

    const data: FinalData = {};

    Object.keys(t).map((c: string) => {
      if (c == "timestamp") return;
      const rawData = JSON.parse(t[c]);
      if (!rawData) return;
      // DEBUG:
      // data[c] = rawData
      data[c] = removeTokenBreakdown(rawData);
    });

    result.push({ timestamp: t.timestamp, data });
  });

  result.sort((a: ChartData, b: ChartData) => Number(a.timestamp) - Number(b.timestamp));
  return result;
}
export async function fetchHistoricalFromDB(chain: string = "*") {
  const sql = await iniDbConnection();

  const timeseries = await queryPostgresWithRetry(
    chain == "*" ? sql`select * from chainassets` : sql`select ${sql(chain)}, timestamp from chainassets`,
    sql
  );
  sql.end();

  const result = parsePgData(timeseries, chain);
  // DEBUG:
  // return result
  return findDailyEntries(result);
}
function findDailyEntries(raw: ChartData[], period: number = secondsInADay): ChartData[] {
  const clean: ChartData[] = [];
  const timestamps = raw.map((r: ChartData) => Number(r.timestamp));

  let timestamp = Math.floor(timestamps[0] / period) * period;
  const cleanEnd = Math.floor(timestamps[timestamps.length - 1] / period) * period;

  while (timestamp < cleanEnd) {
    const index = timestamps.indexOf(
      timestamps.reduce((p, c) => (Math.abs(c - timestamp) < Math.abs(p - timestamp) ? c : p))
    );
    clean.push({ data: raw[index].data, timestamp: timestamp.toString() });
    timestamp += period;
  }

  clean.push(raw[raw.length - 1]);

  return clean;
}
export async function fetchFlows(period: number) {
  const sql = await iniDbConnection();

  const nowTimestamp = getCurrentUnixTimestamp();
  const startTimestamp = nowTimestamp - period;
  const timestampWithMargin = startTimestamp - period;

  const timeseries = await queryPostgresWithRetry(
    sql`
      select * from chainassets
      where timestamp > ${timestampWithMargin}
      `,
    sql
  );
  sql.end();

  const result = parsePgData(timeseries, "*");

  if (!result.length) throw new Error(`No data found`);
  const start: any = result.reduce(function (prev, curr) {
    return Math.abs(Number(curr.timestamp) - startTimestamp) < Math.abs(Number(prev.timestamp) - startTimestamp)
      ? curr
      : prev;
  });
  const end: any = result[result.length - 1];

  const percs: any = {};
  const chains = Object.keys(end.data);

  chains.map((chain: string) => {
    percs[chain] = {};
    Object.keys(end.data[chain]).map((k: string) => {
      const a = start.data[chain][k];
      const b = end.data[chain][k];

      if (a != "0" && b == "0") percs[chain][k] = -100;
      else if (b == "0") percs[chain][k] = 0;
      else if (a == "0") percs[chain][k] = 100;
      else percs[chain][k] = ((100 * (b - a)) / a).toFixed(2);
    });
  });

  return percs;
}
