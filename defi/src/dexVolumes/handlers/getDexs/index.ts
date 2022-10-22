import { successResponse, wrap, IResponse } from "../../../utils/shared";
import volumeAdapters, { Dex } from "../../dexAdapters";
import { getVolume, Volume, VolumeType } from "../../data/volume"
import allSettled from "promise.allsettled";
import { IRecordVolumeData } from "../storeDexVolume";
import { calcNdChange, generateAggregatedVolumesChartData, generateByDexVolumesChartData, getSumAllDexsToday, getSummaryByProtocolVersion, IChartData, IChartDataByDex, IGeneralStats, sumAllVolumes } from "../../utils/volumeCalcs";
import { formatTimestampAsDate, getTimestampAtStartOfDayUTC } from "../../../utils/date";
import getAllChainsFromDexAdapters, { formatChain, getChainByProtocolVersion, isDisabled, isDisabledByProtocolVersion } from "../../utils/getChainsFromDexAdapters";
import config from "../../dexAdapters/config";
import { ONE_DAY_IN_SECONDS } from "../getDexVolume";
import { sendDiscordAlert } from "../../utils/notify";
import { VolumeAdapter } from "@defillama/adapters/volumes/dexVolume.type";
import { importVolumeAdapter } from "../../../utils/imports/importDexAdapters";
import removeErrors from "../../utils/removeErrors";
import { getDisplayName } from "../../../adaptors/data/helpers/generateProtocolAdaptorsList";
import { Adapter } from "@defillama/adaptors/adapters/types";

export interface IGetDexsResponseBody extends IGeneralStats {
    totalDataChart: IChartData,
    totalDataChartBreakdown: IChartDataByDex,
    dexs: Omit<VolumeSummaryDex, 'volumes'>[]
    allChains: string[]
}

export interface VolumeSummaryDex extends Pick<Dex, 'name'> {
    displayName: string | null
    totalVolume24h: number | null
    volume24hBreakdown: IRecordVolumeData | null
    volumeAdapter: Dex['volumeAdapter']
    volumes?: Volume[]
    change_1d: number | null
    change_7d: number | null
    change_1m: number | null
    chains: string[] | null
    disabled: boolean | null
    protocolVersions: {
        [protVersion: string]: {
            totalVolume24h: number | null
            change_1d: number | null
            change_7d: number | null
            change_1m: number | null
            chains: string[] | null
            disabled: boolean
        } | null
    } | null
}

const MAX_OUTDATED_DAYS = 30

export const handler = async (event: AWSLambda.APIGatewayEvent, enableAlerts: boolean = false): Promise<IResponse> => {
    const pathChain = event.pathParameters?.chain?.toLowerCase()
    const excludeTotalDataChart = event.queryStringParameters?.excludeTotalDataChart?.toLowerCase() === 'true'
    const excludeTotalDataChartBreakdown = event.queryStringParameters?.excludeTotalDataChartBreakdown?.toLowerCase() === 'true'
    const chainFilter = pathChain ? decodeURI(pathChain) : pathChain
    let prevDayTime = 0
    const dexsResults = await allSettled(volumeAdapters.filter(va => va.config?.enabled).map<Promise<VolumeSummaryDex>>(async (adapter) => {
        let displayName = adapter.name
        try {
            const ada: VolumeAdapter = (await importVolumeAdapter(adapter)).default
            displayName = getDisplayName(adapter.name, ada as Adapter)

            const chainsSummary = getChainByProtocolVersion(adapter.volumeAdapter, chainFilter)
            let volumes = (await getVolume(adapter.id, VolumeType.dailyVolume))
            // This check is made to infer Volume[] type instead of Volume type
            if (!(volumes instanceof Array)) throw new Error("Wrong volume queried")

            // Process only volumes with a specific chain
            volumes = volumes.map(v => v.getCleanVolume(chainFilter)).filter(v => v !== null) as Volume[]

            if (volumes.length === 0) throw new Error(`${adapter.name} has no volumes for chain ${chainFilter}`)

            // Return last available data. Ideally last day volume, if not, prevents 0 volume values until data is updated or fixed
            let prevDayTimestamp = getTimestampAtStartOfDayUTC((Date.now() - ONE_DAY_IN_SECONDS * 1000) / 1000)
            let prevDayVolume = volumes[volumes.length - 1] //volumes.find(vol => vol.timestamp === prevDayTimestamp)
            if (prevDayTimestamp !== prevDayVolume.timestamp && !isDisabled(adapter.volumeAdapter)) {
                if (enableAlerts)
                    await sendDiscordAlert(`Volume not updated (using old data...)\nAdapter: ${adapter.name}\n${formatTimestampAsDate(prevDayTimestamp.toString())} <- Report date\n${formatTimestampAsDate(prevDayVolume.timestamp.toString())} <- Last data found`)
                // console.error("Volume not updated", adapter.name, prevDayTimestamp, prevDayVolume.timestamp, prevDayVolume)
                volumes.push(new Volume(prevDayVolume.type, prevDayVolume.dexId, prevDayTimestamp, prevDayVolume.data))
            }

            if ((prevDayTimestamp - prevDayVolume.timestamp >= ONE_DAY_IN_SECONDS * MAX_OUTDATED_DAYS) && !isDisabled(adapter.volumeAdapter)) {
                if (enableAlerts)
                    await sendDiscordAlert(`${adapter.name} has ${MAX_OUTDATED_DAYS} days old data... Not including in the response`)
                throw new Error(`${adapter.name} has ${(Math.abs(prevDayVolume.timestamp - prevDayTimestamp)) / (60 * 60 * 24)} days old data... Not including in the response\n${JSON.stringify(prevDayVolume)}`)
            }

            if (!isDisabled(adapter.volumeAdapter))
                prevDayTimestamp = prevDayVolume.timestamp

            if (prevDayTime < prevDayTimestamp) prevDayTime = prevDayTimestamp

            const change_1d = calcNdChange(volumes, 1, prevDayTimestamp)
            if (volumes.length !== 1 && (!change_1d || change_1d && (change_1d < -99 || change_1d > 10000)) && change_1d !== null) {
                if (enableAlerts)
                    await sendDiscordAlert(`${adapter.name} has a daily change of ${change_1d}, looks sus... Not including in the response`)
                throw new Error(`${adapter.name} has a daily change of ${change_1d}, looks sus... Not including in the response\n${JSON.stringify(prevDayVolume)}`)
            }

            const protocolVersionsSummary = getSummaryByProtocolVersion(volumes, prevDayTimestamp)
            return {
                name: adapter.name,
                disabled: isDisabled(adapter.volumeAdapter),
                displayName: displayName,
                volumeAdapter: adapter.volumeAdapter,
                totalVolume24h: !isDisabled(adapter.volumeAdapter) && prevDayVolume ? sumAllVolumes(prevDayVolume.data) : 0,
                volume24hBreakdown: !isDisabled(adapter.volumeAdapter) && prevDayVolume ? prevDayVolume.data : null,
                volumes: volumes.map(removeEventTimestampAttribute),
                change_1d: change_1d,
                change_7d: calcNdChange(volumes, 7, prevDayTimestamp),
                change_1m: calcNdChange(volumes, 30, prevDayTimestamp),
                chains: chainFilter ? [formatChain(chainFilter)] : getAllChainsFromDexAdapters([adapter.volumeAdapter]).map(formatChain),
                protocolVersions: protocolVersionsSummary ? Object.entries(protocolVersionsSummary).reduce((acc, [protName, summary]) => {
                    acc[protName] = {
                        ...summary,
                        chains: chainsSummary ? chainsSummary[protName] : null,
                        disabled: isDisabledByProtocolVersion(adapter.volumeAdapter, chainFilter, protName)
                    }
                    return acc
                }, {} as NonNullable<VolumeSummaryDex['protocolVersions']>) : null
            }
        } catch (error) {
            // console.error("ADAPTER", adapter.name, error)
            return {
                name: adapter.name,
                volumeAdapter: adapter.volumeAdapter,
                disabled: null, //volumes.length > 0 ? true : null,
                displayName: displayName,
                totalVolume24h: null,
                volume24hBreakdown: null,
                yesterdayTotalVolume: null,
                change_1d: null,
                change_7d: null,
                change_1m: null,
                chains: chainFilter ? [formatChain(chainFilter)] : getAllChainsFromDexAdapters([adapter.volumeAdapter]).map(formatChain),
                protocolVersions: null
            }
        }
    }))
    const rejectedDexs = dexsResults.filter(d => d.status === 'rejected').map(fd => fd.status === "rejected" ? fd.reason : undefined)
    rejectedDexs.forEach(console.error)
    const dexs = dexsResults.map(fd => fd.status === "fulfilled" && fd.value.disabled !== null ? fd.value : undefined).filter(d => d !== undefined) as VolumeSummaryDex[]
    const generalStats = getSumAllDexsToday(dexs.map(substractSubsetVolumes), undefined, prevDayTime)

    let dexsResponse: IGetDexsResponseBody['dexs']
    let totalDataChartResponse: IGetDexsResponseBody['totalDataChart']
    let totalDataChartBreakdownResponse: IGetDexsResponseBody['totalDataChartBreakdown']

    if (chainFilter === 'chains') {
        dexsResponse = [] //should be chainsResponse
        totalDataChartResponse = [] //generateByChainsChart(dexs)
        totalDataChartBreakdownResponse = [] //nothing 4 now
    } else if (chainFilter) {
        totalDataChartResponse = excludeTotalDataChart ? [] : generateAggregatedVolumesChartData(dexs)
        totalDataChartBreakdownResponse = excludeTotalDataChartBreakdown ? [] : generateByDexVolumesChartData(dexs)
        dexsResponse = dexs.map(removeVolumesObject)
    } else {
        totalDataChartResponse = excludeTotalDataChart ? [] : generateAggregatedVolumesChartData(dexs)
        totalDataChartBreakdownResponse = excludeTotalDataChartBreakdown ? [] : generateByDexVolumesChartData(dexs)
        dexsResponse = dexs.map(removeVolumesObject)
    }

    totalDataChartResponse = totalDataChartResponse.slice(totalDataChartResponse.findIndex(it => it[1] !== 0))
    const sumBreakdownItem = (item: { [chain: string]: number }) => Object.values(item).reduce((acc, current) => acc += current, 0)
    totalDataChartBreakdownResponse = totalDataChartBreakdownResponse.slice(totalDataChartBreakdownResponse.findIndex(it => sumBreakdownItem(it[1]) !== 0))

    return successResponse({
        totalDataChart: totalDataChartResponse,
        totalDataChartBreakdown: totalDataChartBreakdownResponse,
        ...generalStats,
        dexs: dexsResponse,
        allChains: getAllChainsUniqueString(getAllChainsFromDexAdapters(volumeAdapters.map(va => va.volumeAdapter)))// getAllChainsUnique(dexs)
    } as IGetDexsResponseBody, 10 * 60); // 10 mins cache
};

const substractSubsetVolumes = (dex: VolumeSummaryDex, _index: number, dexs: VolumeSummaryDex[], baseTimestamp?: number): VolumeSummaryDex => {
    const volumeAdapter = dex.volumeAdapter
    if (!volumeAdapter) throw Error("No volumeAdapter found")
    const includedVolume = config[volumeAdapter].includedVolume
    if (includedVolume && includedVolume.length > 0) {
        const includedSummaries = dexs.filter(dex => {
            const volumeAdapter = dex.volumeAdapter
            if (!volumeAdapter) throw Error("No volumeAdapter found")
            includedVolume.includes(volumeAdapter)
        })
        let computedSummary: VolumeSummaryDex = dex
        for (const includedSummary of includedSummaries) {
            const newSum = getSumAllDexsToday([computedSummary], includedSummary, baseTimestamp)
            computedSummary = {
                ...includedSummary,
                totalVolume24h: newSum['totalVolume'],
                change_1d: newSum['changeVolume1d'],
                change_7d: newSum['changeVolume7d'],
                change_1m: newSum['changeVolume30d'],
            }
        }
        return computedSummary
    }
    else
        return dex
}

type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

const removeVolumesObject = (dex: VolumeSummaryDex) => {
    delete dex['volumes']
    // @ts-ignore ignore volumeAdapter is not optional
    delete dex['volumeAdapter']
    return dex
}

export const removeEventTimestampAttribute = (v: Volume) => {
    delete v.data['eventTimestamp']
    return v
}

/* const getAllChainsUnique = (dexs: VolumeSummaryDex[]) => {
    const allChainsNotUnique = dexs.reduce((acc, { chains }) => chains !== null ? acc.concat(...chains) : acc, [] as string[])
    return allChainsNotUnique.filter((value, index, self) => {
        return self.indexOf(value) === index;
    })
} */

const getAllChainsUniqueString = (chains: string[]) => {
    return chains.map(formatChain).filter((value, index, self) => {
        return self.indexOf(value) === index;
    })
}

export default wrap(handler);