import dexVolumes from "../../../DefiLlama-Adapters/volumes";
import data, { Protocol } from "../../protocols/data";
import config from "./config"
import type { IVolumesConfig } from "./config"
import getAllChainsFromDexAdapters from "../utils/getChainsFromDexAdapters";
/**
 * Using data from protocols since its more complete
 */

export interface Dex extends Protocol {
    volumeAdapter: string
    config?: IVolumesConfig
}

// Obtaining all dex protocols
const dexes = data.filter(d => d.category === "Dexes")
// Getting list of all volume adapters
const dexAdaptersKeys = Object.keys(dexVolumes).map(k => k.toLowerCase())
// Adding data to dex objects
const dexData: Dex[] = dexAdaptersKeys.map(adapterKey => {
    const dexFoundInProtocols = dexes.find(dexP =>
        dexP.name.toLowerCase()?.includes(adapterKey)
        || dexP.gecko_id?.includes(adapterKey)
        || dexP.module.split("/")[0]?.includes(adapterKey)
    )
    if (dexFoundInProtocols) return {
        ...dexFoundInProtocols,
        chains: getAllChainsFromDexAdapters([adapterKey]).map(chain => {
            const c = chain === 'avax' ? "avalanche" : chain
            return c[0].toUpperCase() + c.slice(1)
        }),
        volumeAdapter: adapterKey,
        config: config[adapterKey]
    }
    // TODO: Handle better errors
    //console.error(`Missing info for ${adapterKey} DEX!`)
    return undefined
}).filter(notUndefined);

function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

export default dexData