import postgres from "postgres";
import { Address, LogArray } from "@defillama/sdk/build/types";
import { getCurrentUnixTimestamp } from "../src/utils/date";
import { Chain } from "@defillama/sdk/build/general";
import { DeployerInsert, OwnerInsert, SupplyInsert, TokenInsert } from "./types";
import setEnvSecrets from "../src/utils/shared/setEnvSecrets";
import sleep from "../src/utils/shared/sleep";

let auth: string[];

async function queryPostgresWithRetry(query: any, sql: any, counter: number = 0): Promise<any> {
  try {
    // console.log("created a new pg instance");
    const res = await sql`
        ${query}
        `;
    sql.end();
    return res;
  } catch (e) {
    if (counter > 5) throw e;
    await sleep(5000 + 2e4 * Math.random());
    return await queryPostgresWithRetry(query, sql, counter + 1);
  }
}

export async function generateAuth() {
  if (!process.env.COINS2_AUTH) await setEnvSecrets();
  auth = process.env.COINS2_AUTH?.split(",") ?? [];
  if (!auth || auth.length != 3) throw new Error("there arent 3 auth params");
}
export async function storeTokenOwnerLogs(logArray?: LogArray): Promise<void> {
  if (!logArray || !logArray.length) return;

  const timestamp = getCurrentUnixTimestamp();
  const inserts: OwnerInsert[] = [];

  logArray.map((l: OwnerInsert) => {
    const token = l.token.toLowerCase();
    const holder = l.holder.toLowerCase();
    const duplicate = inserts.find(
      (i: OwnerInsert) => i.chain == l.chain && i.token == l.token && i.holder == l.holder
    );
    if (duplicate) return;

    inserts.push({
      timestamp,
      chain: l.chain,
      token,
      holder,
      amount: l.amount,
    });
  });

  await generateAuth();
  const sql = postgres(auth[0]);
  await queryPostgresWithRetry(
    sql`
    insert into bridgecontracts
    ${sql(inserts, "chain", "token", "holder", "timestamp", "amount")}
    on conflict (chain, token, holder)
    do update
    set timestamp = excluded.timestamp, amount = excluded.amount
  `,
    sql
  );
}
export async function storeDeployers(chain: string, deployers: { [token: Address]: Address }) {
  if (!Object.keys(deployers).length) return;

  const inserts: DeployerInsert[] = [];
  Object.keys(deployers).map((token: string) => {
    inserts.push({
      token,
      deployer: deployers[token],
      chain,
    });
  });

  await generateAuth();
  const sql = postgres(auth[0]);
  await queryPostgresWithRetry(
    sql`
    insert into tokendeployers
    ${sql(inserts, "token", "deployer", "chain")}
    on conflict (chain, token)
    do nothing
  `,
    sql
  );
}
export async function storeAllTokens(tokens: string[]) {
  if (!tokens.length) return;

  const inserts: TokenInsert[] = [];
  tokens.map((t: string) => {
    const [chain, token] = t.split(":");
    if (!token) return;
    inserts.push({ chain, token });
  });

  if (!inserts.length) return;
  await generateAuth();
  const sql = postgres(auth[0]);
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
export async function updateAllTokenSupplies(supplies: SupplyInsert[]) {
  if (!supplies.length) return;
  await generateAuth();
  const sql = postgres(auth[0]);
  await queryPostgresWithRetry(
    sql`
  insert into alltokens
  ${sql(supplies, "supply", "chain", "token")}
  on conflict (chain, token)
  do update
  set supply = excluded.supply
  `,
    sql
  );
}
export async function fetchTokenOwnerLogs(chain: Chain, margin: number = 6 * 60 * 60): Promise<any> {
  const earliest = getCurrentUnixTimestamp() - margin;
  await generateAuth();
  const sql = postgres(auth[0]);
  const res = await queryPostgresWithRetry(
    sql`
      select token, holder, amount from bridgecontracts
      where timestamp > ${earliest}
      and chain = ${chain}
    `,
    sql
  );
  return res;
}
export async function fetchTokenDeployers(chain: Chain): Promise<any> {
  await generateAuth();
  const sql = postgres(auth[0]);
  const res = await queryPostgresWithRetry(
    sql`
      select token, deployer from tokendeployers
      where chain = ${chain}
    `,
    sql
  );
  return res;
}
export async function fetchAllTokens(chain: Chain): Promise<any> {
  await generateAuth();
  const sql = postgres(auth[0]);
  const res = await queryPostgresWithRetry(
    sql`
      select token, supply from alltokens
      where chain = ${chain}
    `,
    sql
  );

  const obj: { [token: string]: number | undefined } = {};
  res.map((t: any) => {
    obj[t.token] = t.supply;
  });
  return obj;
}
export async function fetchTokenSupplies(chain: Chain, tokens: Address[]): Promise<any> {
  await generateAuth();
  const sql = postgres(auth[0]);
  const res = await queryPostgresWithRetry(
    sql`
      select token, supply from alltokens
      where chain = ${chain} and 
      token in ${sql(tokens.map((t: string) => t.toLowerCase()))}
    `,
    sql
  );

  const obj: { [token: string]: number | undefined } = {};
  res.map((t: any) => {
    obj[t.token] = t.supply;
  });
  return obj;
}
export async function fetchDeployedContracts(params: {
  deployerAddresses: Address[];
  startTimestamp: number;
  endTimestamp: number;
  chain: Chain;
}): Promise<Address[]> {
  const sql = postgres(process.env.INDEXA_DB!);
  const res = await queryPostgresWithRetry(
    sql`
      select created_contract_address 
        from ${sql(`${params.chain}.transactions`)} 
      where
        created_contract_address != 'null' and
        block_time between ${new Date(params.startTimestamp * 1000)} and ${new Date(params.endTimestamp * 1000)} and
        from_address in ${sql(params.deployerAddresses.map((c: string) => Buffer.from(c.slice(2), "hex")))}
    `,
    sql
  );
  return res.map((r: any) => `0x${r.created_contract_address.toString("hex")}`);
}
