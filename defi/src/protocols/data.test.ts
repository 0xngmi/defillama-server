import protocols, {Protocol} from "./data";
import { baseIconsUrl } from "../constants";
import { normalizeChain, chainCoingeckoIds, getChainDisplayName, transformNewChainName } from "../utils/normalizeChain";
const fs = require("fs");

const protocolsThatCantBeImported = ["Genshiro", "Shiden dApp Staking", "Astar dApps Staking"]
async function importProtocol(protocol:Protocol){
  if(protocol.name.startsWith('Karura ') || protocolsThatCantBeImported.includes(protocol.name)){
    return {}
  } else {
    return import(`../../DefiLlama-Adapters/projects/${protocol.module}`);
  }
}

test("all the dynamic imports work", async () => {
  for (const protocol of protocols) {
    await importProtocol(protocol)
  }
});

const ignored = ['default', 'staking', 'pool2', 'treasury', "hallmarks", "borrowed"]
test("all chains are on chainMap", async () => {
  for (const protocol of protocols) {
    const module = await importProtocol(protocol)
    Object.entries(module).map(entry=>{
      if(!ignored.includes(entry[0]) && typeof entry[1] === "object"){
        const chain = getChainDisplayName(entry[0], true)
       if(chainCoingeckoIds[chain] === undefined){
         throw new Error(`${chain} (found in ${protocol.name}) should be on chainMap`)
       }
      }
    })
    protocol.chains.concat(protocol.chain).map(chainRaw=>{
      const chain = transformNewChainName(chainRaw)
      if(chainCoingeckoIds[chain] === undefined && chain !== "Multi-Chain"){
        throw new Error(`${chain} (found in ${protocol.name}) should be on chainMap`)
      }
    })
  }
});

test("projects have a single chain or each chain has an adapter", async () => {
  for (const protocol of protocols) {
    const module = await importProtocol(protocol)
    const chains = protocol.chains.map((chain) => normalizeChain(chain));
    if (chains.length > 1) {
      chains.forEach((chain) => {
        if (module[chain] === undefined) {
          if(chain === "avalanche" && module["avax"] !== undefined){
            return
          }
          throw new Error(
            `Protocol "${protocol.name}" doesn't have chain "${chain}" on their module`
          );
        }
      });
    }
  }
});

test("no id is repeated", async () => {
  const ids = [];
  for (const protocol of protocols) {
    expect(ids).not.toContain(protocol.id);
    ids.push(protocol.id);
  }
});

test("no coingeckoId is repeated", async () => {
  const ids = [];
  for (const protocol of protocols) {
    const id = protocol.gecko_id
    if(typeof id === "string"){
      expect(ids).not.toContain(id);
      ids.push(id);
    }
  }
});


test("icon exists", async () => {
  for (const protocol of protocols) {
    const icon = protocol.logo?.substr(baseIconsUrl.length + 1);
    if (icon !== undefined) {
      const path = `./icons/${icon}`;
      if (!fs.existsSync(path)) {
        throw new Error(`Icon ${path} doesn't exist`);
      }
    }
  }
});
