import { formatTimestampAsDate, getTimestampAtStartOfDayUTC } from "../../utils/date";
import { IJSON, ProtocolAdaptor } from "../data/types";
import { AdaptorRecord, IRecordAdaptorRecordData } from "../db-utils/adaptor-record";
import { IGeneralStats, ProtocolAdaptorSummary } from "../handlers/getOverview";
import { ONE_DAY_IN_SECONDS } from "../handlers/getProtocol";

import getDataPoints from "./getDataPoints";

const sumAllVolumes = (breakdownVolumes: IRecordAdaptorRecordData, protVersion?: string) => {
    if (breakdownVolumes) {
        return Object.values(breakdownVolumes)
            .reduce<number>((acc, volume) => {
                if (typeof volume === 'number') return acc
                return acc + Object.entries(volume)
                    .filter(([protV, _]) => protVersion ? protV === protVersion : true)
                    .reduce<number>(sumObject, 0)
            }, 0)
    }
    else return 0
}

const sumObject = (acc: number, [_key, current]: [string, any]): number => {
    if (typeof current === 'object') {
        return acc + Object.entries(current)
        // .filter(([tokenSymbol, _]) => tokenSymbolFilter ? tokenSymbol === tokenSymbolFilter : true)
        .reduce<number>((vacc, [_key, current]) => sumObject(vacc, [_key, current]), 0)
    }
    else {
        console.log("else", current)
        return acc + Number(current)
    }
}


const getSumAllDexsToday = (
    dexs: ProtocolAdaptorSummary[],
    dex2Substract?: ProtocolAdaptorSummary,
    baseTimestamp: number = (Date.now() / 1000) - ONE_DAY_IN_SECONDS
): IGeneralStats => {
    const yesterdaysTimestamp = getTimestampAtStartOfDayUTC(baseTimestamp);
    const timestamp1d = yesterdaysTimestamp - ONE_DAY_IN_SECONDS * 1
    const timestamp7d = yesterdaysTimestamp - ONE_DAY_IN_SECONDS * 7
    const timestamp30d = yesterdaysTimestamp - ONE_DAY_IN_SECONDS * 30
    let totalVolume = 0
    let totalVolume1d = 0
    let totalVolume7d = 0
    let totalVolume30d = 0
    let dex2SubstractVolumes: any = {}
    for (const dex of dexs) {
        if (dex2Substract) {
            dex2SubstractVolumes['totalVolume'] = dex2Substract.recordsMap?.[String(yesterdaysTimestamp)]?.data
            dex2SubstractVolumes['totalVolume1d'] = dex2Substract.recordsMap?.[String(timestamp1d)]?.data
            dex2SubstractVolumes['totalVolume7d'] = dex2Substract.recordsMap?.[String(timestamp7d)]?.data
            dex2SubstractVolumes['totalVolume30d'] = dex2Substract.recordsMap?.[String(timestamp30d)]?.data
        }
        const yesterdaysVolume = dex.recordsMap?.[String(yesterdaysTimestamp)]?.data
        const volume1d = dex.recordsMap?.[String(timestamp1d)]?.data
        const volume7d = dex.recordsMap?.[String(timestamp7d)]?.data
        const volume30d = dex.recordsMap?.[String(timestamp30d)]?.data
        totalVolume += yesterdaysVolume ? sumAllVolumes(yesterdaysVolume) - sumAllVolumes(dex2SubstractVolumes['totalVolume']) : 0
        totalVolume1d += volume1d ? sumAllVolumes(volume1d) - sumAllVolumes(dex2SubstractVolumes['totalVolume1d']) : 0
        totalVolume7d += volume7d ? sumAllVolumes(volume7d) - sumAllVolumes(dex2SubstractVolumes['totalVolume7d']) : 0
        totalVolume30d += volume30d ? sumAllVolumes(volume30d) - sumAllVolumes(dex2SubstractVolumes['totalVolume30d']) : 0
    }
    return {
        total24h: totalVolume,
        change_1d: formatNdChangeNumber(((totalVolume - totalVolume1d) / totalVolume1d) * 100) ?? 0,
        change_7d: formatNdChangeNumber(((totalVolume - totalVolume7d) / totalVolume7d) * 100) ?? 0,
        change_1m: formatNdChangeNumber(((totalVolume - totalVolume30d) / totalVolume30d) * 100) ?? 0,
        breakdown24h: null
    }
}

export type IChartData = [string, number][] // [timestamp, volume]

const generateAggregatedVolumesChartData = (protocols: ProtocolAdaptorSummary[]): IChartData => {
    const chartData: IChartData = []
    const dataPoints = getDataPoints()
    for (const dataPoint of dataPoints) {
        let total = 0
        for (const protocol of protocols) {
            const volumeObj = protocol.recordsMap?.[String(dataPoint)]?.data
            total += volumeObj ? sumAllVolumes(volumeObj) : 0
        }
        chartData.push([`${dataPoint}`, total])
    }
    return chartData
}

export type IChartDataByDex = Array<[string, {
    [dex: string]: number
}]> // [timestamp, {chain: volume}]

const generateByDexVolumesChartData = (protocols: ProtocolAdaptorSummary[]): IChartDataByDex => {
    const chartData: IChartDataByDex = []
    const dataPoints = getDataPoints()
    for (const dataPoint of dataPoints) {
        const dayBreakDown: IChartDataByDex[0][1] = {}
        for (const protocol of protocols) {
            const volumeObj = protocol.recordsMap?.[String(dataPoint)]?.data
            if (volumeObj)
                dayBreakDown[protocol.module] = sumAllVolumes(volumeObj)
        }
        chartData.push([`${dataPoint}`, dayBreakDown])
    }
    return chartData
}

const calcNdChange = (volumes: IJSON<AdaptorRecord>, nDaysChange: number, baseTimestamp?: number, extend?: boolean) => {
    let totalVolume: number | null = 0
    let totalVolumeNd: number | null = 0
    let yesterdaysTimestamp = getTimestampAtStartOfDayUTC(baseTimestamp ?? ((Date.now() / 1000) - ONE_DAY_IN_SECONDS));
    let yesterdaysVolume = volumes?.[String(yesterdaysTimestamp)]?.data
    if (extend) {
        if (!yesterdaysVolume)
            for (let i = 1; i <= 3; i++) {
                yesterdaysTimestamp = yesterdaysTimestamp - (i * ONE_DAY_IN_SECONDS)
                yesterdaysVolume = volumes?.[String(yesterdaysTimestamp)]?.data
                if (yesterdaysVolume) break
            }
    }
    const timestampNd = yesterdaysTimestamp - (nDaysChange * ONE_DAY_IN_SECONDS)
    let volumeNd = volumes?.[String(timestampNd)]?.data
    if (extend) {
        if (!volumeNd)
            for (let i = 1; i <= 3; i++) {
                volumeNd = volumes?.[String(timestampNd - (i * ONE_DAY_IN_SECONDS))]?.data
                if (volumeNd) break
            }
    }
    totalVolume = yesterdaysVolume ? totalVolume + sumAllVolumes(yesterdaysVolume) : null
    totalVolumeNd = volumeNd ? totalVolumeNd + sumAllVolumes(volumeNd) : null
    const ndChange = totalVolume && totalVolumeNd ? (totalVolume - totalVolumeNd) / totalVolumeNd * 100 : null
    return formatNdChangeNumber(ndChange)
}

const formatNdChangeNumber = (number: number | null) => {
    if (number === Number.POSITIVE_INFINITY || number === Number.NEGATIVE_INFINITY || Number.isNaN(number) || number === null)
        return null
    return Math.round((number + Number.EPSILON) * 100) / 100
}

export const getStatsByProtocolVersion = (volumes: AdaptorRecord[], prevDayTimestamp: number, protocolData: NonNullable<ProtocolAdaptor['protocolsData']>) => {
    const raw = volumes.reduce((accVols, volume) => {
        for (const [chain, protocolsData] of Object.entries(volume.data)) {
            if (typeof protocolsData === 'number') return accVols
            const protocolNames = Object.keys(protocolsData)
            for (const protocolName of protocolNames) {
                if (!accVols[protocolName]) accVols[protocolName] = {}
                const accData = accVols[protocolName][String(volume.timestamp)]?.data
                let accChain = accData?.[chain]
                if (typeof accChain === 'number') accChain = {}
                accVols[protocolName][String(volume.timestamp)] = new AdaptorRecord(volume.type, volume.adaptorId, volume.timestamp, {
                    ...accData,
                    [chain]: {
                        ...accChain,
                        [protocolName]: protocolsData[protocolName]
                    }
                })
            }
        }
        return accVols
    }, {} as IJSON<IJSON<AdaptorRecord>>)
    const summaryByProtocols = Object.entries(raw).reduce((acc, [protVersion, protVolumes]) => {
        const prevDayVolume = protVolumes[prevDayTimestamp]
        acc[protVersion] = {
            total24h: prevDayVolume ? sumAllVolumes(prevDayVolume.data, protVersion) : protocolData[protVersion].disabled ? null : 0,
            change_1d: calcNdChange(protVolumes, 1, prevDayTimestamp),
            change_7d: calcNdChange(protVolumes, 7, prevDayTimestamp),
            change_1m: calcNdChange(protVolumes, 30, prevDayTimestamp),
            breakdown24h: null
        }
        return acc
    }, {} as IJSON<IGeneralStats>)
    return summaryByProtocols
}

export {
    sumAllVolumes,
    getSumAllDexsToday,
    generateAggregatedVolumesChartData,
    generateByDexVolumesChartData,
    calcNdChange
}