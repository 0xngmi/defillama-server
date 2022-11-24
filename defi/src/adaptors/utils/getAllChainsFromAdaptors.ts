import { DISABLED_ADAPTER_KEY, Adapter } from "@defillama/dimension-adapters/adapters/types";
import { CHAIN } from "@defillama/dimension-adapters/helpers/chains";
import { IImportsMap } from "../data/helpers/generateProtocolAdaptorsList";
import { IJSON, ProtocolAdaptor } from "../data/types";

export const getStringArrUnique = (arr: string[]) => {
    return arr.filter((value, index, self) => {
        return self.indexOf(value) === index;
    })
}

const getAllChainsFromAdaptors = (dexs2Filter: string[], imports_obj: IImportsMap, filter: boolean = true) => {
    return getStringArrUnique(dexs2Filter.reduce((acc, adapterName) => {
        const adaptor = imports_obj[adapterName].default
        if (!adaptor) return acc
        if ("adapter" in adaptor) {
            const chains = Object.keys(adaptor.adapter).filter(c => !filter || c !== DISABLED_ADAPTER_KEY)
            for (const chain of chains)
                if (!acc.includes(chain)) acc.push(chain)
        } else if ("breakdown" in adaptor) {
            for (const brokenDownDex of Object.values(adaptor.breakdown)) {
                const chains = Object.keys(brokenDownDex).filter(c => !filter || c !== DISABLED_ADAPTER_KEY)
                for (const chain of chains)
                    if (!acc.includes(chain)) acc.push(chain)
            }
        } else console.error("Invalid adapter", adapterName, imports_obj[adapterName])
        return acc
    }, [] as string[]))
}

export const getAllProtocolsFromAdaptor = (adaptorModule: string, adaptor: Adapter) => {
    if (!adaptor) return []
    if ("adapter" in adaptor) {
        return [adaptorModule]
    } else if ("breakdown" in adaptor) {
        return Object.keys(adaptor.breakdown).filter(c => c !== DISABLED_ADAPTER_KEY)
    } else
        throw new Error(`Invalid adapter ${adaptorModule}`)
}

export const isDisabled = (adaptor: Adapter) => {
    if ("adapter" in adaptor) {
        return Object.keys(adaptor.adapter).includes(DISABLED_ADAPTER_KEY)
    } else if ("breakdown" in adaptor) {
        for (const brokenDownDex of Object.values(adaptor.breakdown)) {
            if (!Object.keys(brokenDownDex).includes(DISABLED_ADAPTER_KEY))
                return false
        }
        return true
    }
    else
        throw new Error(`Invalid adapter`)
}

export const getChainByProtocolVersion = (moduleAdapterName: string, moduleAdapter: Adapter, chainFilter?: string, filter: boolean = true): IJSON<string[]> => {
    if ("adapter" in moduleAdapter) {
        return {
            [moduleAdapterName]: Object.keys(moduleAdapter.adapter).filter(c => (!filter || c !== DISABLED_ADAPTER_KEY))
        }
    } else if ("breakdown" in moduleAdapter) {
        const chainsAcc = {} as IJSON<string[]>
        for (const [protVersion, brokenDownDex] of Object.entries(moduleAdapter.breakdown)) {
            const chains = Object.keys(brokenDownDex).filter(c => (!filter || c !== DISABLED_ADAPTER_KEY))
            for (const c of chains) {
                const chain = c
                if (chainFilter && chain !== formatChainKey(chainFilter)) continue
                if (chainsAcc[protVersion]) {
                    if (!chainsAcc[protVersion].includes(chain)) chainsAcc[protVersion].push(chain)
                }
                else chainsAcc[protVersion] = [chain]
            }
        }
        return chainsAcc
    } else throw new Error("Invalid adapter")
}

/* export const isDisabledByProtocolVersion = (moduleAdapterName: string, moduleAdapter: Adapter, chainFilter?: string, protV?: string) => {
    const chs = getChainByProtocolVersion(moduleAdapterName, moduleAdapter, chainFilter, false)
    if (!chs || !protV) return false
    return chs[protV] ? chs[protV].includes(DISABLED_ADAPTER_KEY) : true
} */

export const getProtocolsData = (adapterKey: string, moduleAdapter: Adapter): ProtocolAdaptor['protocolsData'] => {
    const chainsByProt = getChainByProtocolVersion(adapterKey, moduleAdapter, undefined, false)
    const isDisabled = (protV: string) => chainsByProt[protV] ? chainsByProt[protV].includes(DISABLED_ADAPTER_KEY) : false
    return Object.entries(chainsByProt).reduce((acc, [prot, chains]) => ({
        ...acc, [prot]: {
            chains: chains.filter(c => c !== DISABLED_ADAPTER_KEY),
            disabled: isDisabled(prot)
        }
    }), {})
}

/* export const formatChain = (chain: string) => {
    let c = chain
    if (chain === 'avax') c = "avalanche"
    else if (chain === 'terra') c = 'terra classic'
    return c[0].toUpperCase() + c.slice(1)
} */

export const formatChain = (chain: string) => {
    if (!chain) return chain
    let c = chain.toLowerCase()
    if (c === 'avax') return "Avalanche"
    if (c === 'bsc') return c.toUpperCase()
    if (c === 'xdai') return "xDai"
    if (c === 'terra' || c === 'terra-classic') return "Terra Classic"
    return c[0].toUpperCase() + c.slice(1)
}

export const formatChainKey = (chain: string) => {
    if (chain === 'avalanche') return CHAIN.AVAX
    if (chain === 'terra classic' || chain === 'terra-classic') return CHAIN.TERRA
    if (chain.toLowerCase() === 'karura') return CHAIN.KARURA
    return chain
}

export default getAllChainsFromAdaptors