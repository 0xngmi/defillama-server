import { getTimestampAtStartOfDayUTC } from "../../utils/date";
import { Volume } from "../data/volume";
import { VolumeSummaryDex } from "../handlers/getDexs";
import { ONE_DAY_IN_SECONDS } from "../handlers/getDexVolume";
import { IRecordVolumeData } from "../handlers/storeDexVolume";
import getDataPoints from "./getDataPoints";

const sumAllVolumes = (breakdownVolumes: IRecordVolumeData) =>
    Object.values(breakdownVolumes).reduce((acc, volume) =>
        acc + Object.values(volume)
            .reduce<number>((vacc, current) => typeof current === 'number' ? vacc + current : vacc, 0)
        , 0)

export interface IGeneralStats {
    totalVolume: number;
    changeVolume1d: number;
    changeVolume7d: number;
    changeVolume30d: number;
}

const getSumAllDexsToday = (dexs: VolumeSummaryDex[]) => {
    const yesterdaysTimestamp = getTimestampAtStartOfDayUTC(Date.now() / 1000) - ONE_DAY_IN_SECONDS;
    const timestamp1d = yesterdaysTimestamp - ONE_DAY_IN_SECONDS * 1  // (new Date(yesterdaysTimestamp * 1000)).setDate((new Date(yesterdaysTimestamp * 1000).getDate() - 1)) / 1000
    const timestamp7d = yesterdaysTimestamp - ONE_DAY_IN_SECONDS * 7  // (new Date(yesterdaysTimestamp * 1000)).setDate((new Date(yesterdaysTimestamp * 1000).getDate() - 7)) / 1000
    const timestamp30d = yesterdaysTimestamp - ONE_DAY_IN_SECONDS * 30  // (new Date(yesterdaysTimestamp * 1000)).setDate((new Date(yesterdaysTimestamp * 1000).getDate() - 30)) / 1000
    let totalVolume = 0
    let totalVolume1d = 0
    let totalVolume7d = 0
    let totalVolume30d = 0
    for (const dex of dexs) {
        const yesterdaysVolume = dex.volumes?.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === yesterdaysTimestamp)?.data
        const volume1d = dex.volumes?.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === timestamp1d)?.data
        const volume7d = dex.volumes?.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === timestamp7d)?.data
        const volume30d = dex.volumes?.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === timestamp30d)?.data
        totalVolume += yesterdaysVolume ? sumAllVolumes(yesterdaysVolume) : 0
        totalVolume1d += volume1d ? sumAllVolumes(volume1d) : 0
        totalVolume7d += volume7d ? sumAllVolumes(volume7d) : 0
        totalVolume30d += volume30d ? sumAllVolumes(volume30d) : 0
    }
    return {
        totalVolume,
        changeVolume1d: formatNdChangeNumber(((totalVolume - totalVolume1d) / totalVolume1d) * 100),
        changeVolume7d: formatNdChangeNumber(((totalVolume - totalVolume7d) / totalVolume7d) * 100),
        changeVolume30d: formatNdChangeNumber(((totalVolume - totalVolume30d) / totalVolume30d) * 100),
    }
}

export type IChartData = [[string, number]]

const generateAggregatedVolumesChartData = (dexs: VolumeSummaryDex[]): IChartData => {
    const chartData: IChartData = [["0", 0]] // initial value is removed with a shift before returning, added so ts stops complaining
    const dataPoints = getDataPoints()
    for (const dataPoint of dataPoints) {
        let total = 0
        for (const dex of dexs) {
            const volumeObj = dex.volumes?.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === dataPoint)?.data
            total += volumeObj ? sumAllVolumes(volumeObj) : 0
        }
        chartData.push([`${dataPoint}`, total])
    }
    chartData.shift()
    return chartData
}

const calcNdChange = (volumes: Volume[], nDaysChange: number) => {
    let totalVolume: number | null = 0
    let totalVolumeNd: number | null = 0
    const yesterdaysTimestamp = getTimestampAtStartOfDayUTC((Date.now() / 1000) - ONE_DAY_IN_SECONDS);
    const timestampNd = yesterdaysTimestamp - (nDaysChange * ONE_DAY_IN_SECONDS)
    const yesterdaysVolume = volumes.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === yesterdaysTimestamp)?.data
    const volumeNd = volumes.find(v => getTimestampAtStartOfDayUTC(v.timestamp) === timestampNd)?.data
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

export const getSummaryByProtocolVersion = (volumes: Volume[], prevDayVolume?: Volume) => {
    const raw = volumes.reduce((accVols, volume) => {
        Object.entries(volume.data).forEach(([chain, protocolsData]) => {
            const protocolNames = Object.keys(protocolsData)
            if (protocolNames.length <= 1) return
            for (const protocolName of protocolNames) {
                if (accVols[protocolName]) {
                    accVols[protocolName].push(new Volume(volume.type, volume.dexId, volume.timestamp, {
                        [chain]: {
                            [protocolName]: protocolsData[protocolName]
                        }
                    }))
                }
                else {
                    accVols[protocolName] = [(new Volume(volume.type, volume.dexId, volume.timestamp, {
                        [chain]: {
                            [protocolName]: protocolsData[protocolName]
                        }
                    }))]
                }
            }
        })
        return accVols
    }, {} as { [protocol: string]: Volume[] })
    delete raw['error']
    const summaryByProtocols = Object.entries(raw).reduce((acc, [protVersion, protVolumes]) => {
        acc[protVersion] = {
            totalVolume24h: prevDayVolume ? sumAllVolumes(prevDayVolume.data) : 0,
            change_1d: calcNdChange(protVolumes, 1),
            change_7d: calcNdChange(protVolumes, 7),
            change_1m: calcNdChange(protVolumes, 30),
        }
        return acc
    }, {} as {
        // TODO: improve types
        [protV: string]: {
            totalVolume24h: number | null
            change_1d: number | null
            change_7d: number | null
            change_1m: number | null
        }
    })
    return Object.keys(summaryByProtocols).length > 1 ? summaryByProtocols : null
}

export {
    sumAllVolumes,
    getSumAllDexsToday,
    generateAggregatedVolumesChartData,
    calcNdChange
}