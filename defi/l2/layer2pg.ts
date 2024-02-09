import { Chain } from "@defillama/sdk/build/general";
import { TokenInsert } from "./types";
import sleep from "../src/utils/shared/sleep";
import { mixedCaseChains } from "./constants";
import { getCoins2Connection } from "../src/getDBConnection";

export async function queryPostgresWithRetry(query: any, sql: any, counter: number = 0): Promise<any> {
  try {
    // console.log("created a new pg instance");
    const res = await sql`
        ${query}
        `;
    return res;
  } catch (e) {
    if (counter > 5) throw e;
    await sleep(5000 + 2e4 * Math.random());
    return await queryPostgresWithRetry(query, sql, counter + 1);
  }
}


function splitKey(inserts: TokenInsert[], key: string) {
  const index = key.indexOf(":");
  let [chain, token1] = [key.substring(0, index), key.substring(index + 1)];
  if (!chain && token1.startsWith("0x")) {
    chain = "ethereum";
  } else if (!chain) {
    return;
  }
  const token = mixedCaseChains.includes(chain) ? token1 : token1.toLowerCase();
  if (!token) return;
  inserts.push({ chain, token });
}

export async function storeAllTokens(tokens: string[]) {
  if (!tokens.length) return;

  const inserts: TokenInsert[] = [];
  tokens.map((t: string) => splitKey(inserts, t));

  if (!inserts.length) return;
  const sql = await getCoins2Connection()
  await queryPostgresWithRetry(
    sql`
    insert into alltokens
    ${sql(inserts, "chain", "token")}
    on conflict (chain, token)
    do nothing
  `,
    sql
  );
}

export async function storeNotTokens(tokens: string[]) {
  if (!tokens.length) return;

  const inserts: TokenInsert[] = [];
  tokens.map((t: string) => splitKey(inserts, t));

  if (!inserts.length) return;
  const sql = await getCoins2Connection()
  await queryPostgresWithRetry(
    sql`
    insert into nottokens
    ${sql(inserts, "chain", "token")}
    on conflict (chain, token)
    do nothing
  `,
    sql
  );
}

export async function fetchAllTokens(chain: Chain): Promise<string[]> {
  const sql = await getCoins2Connection()
  const res = await queryPostgresWithRetry(
    sql`
      select token from alltokens
      where chain = ${chain}
    `,
    sql
  );

  return res.map((r: any) => r.token);
}

export async function fetchNotTokens(chain: Chain): Promise<string[]> {
  const sql = await getCoins2Connection()
  const res = await queryPostgresWithRetry(
    sql`
      select token from nottokens
      where chain = ${chain}
    `,
    sql
  );

  return res.map((r: any) => r.token);
}
