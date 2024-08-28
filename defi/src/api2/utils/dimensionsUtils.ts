import { ProtocolAdaptor } from "../../adaptors/data/types";
import { AdaptorRecord, AdaptorRecordType, GetAdaptorRecordOptions } from "../../adaptors/db-utils/adaptor-record";
import { sluggifyString } from "../../utils/sluggify";
import { cache } from "../cache";
import { readFromPGCache, writeToPGCache } from "../db";
import { AdapterType } from "@defillama/dimension-adapters/adapters/types";
import parentProtocols from "../../protocols/parentProtocols";
import { RUN_TYPE } from ".";
import { getTimeSDaysAgo } from "./time";
import { ACCOMULATIVE_ADAPTOR_TYPE } from "../../adaptors/handlers/getOverviewProcess";

const parentProtocolMap: any = {}
parentProtocols.forEach(protocol => {
  parentProtocolMap[protocol.id] = protocol
})

export function getAdapterCacheKey(adaptor: ProtocolAdaptor, type: AdaptorRecordType, mode: "ALL" | "LAST" | "TIMESTAMP" = "ALL") {
  return `${adaptor.protocolType ?? 'protocol'}-${adaptor.id}-${type}-${mode}`
}

export function getFileCacheKey(adaptorRecordType: AdapterType) {
  return `dimensions-data-v1/${adaptorRecordType}`
}


export function getFileCacheKeyV2() {
  return `dimensions-data-v2-v1.0.0`
}

// to ensure that we pull the cache data only once
export async function getDimensionsCacheV2(_cacheType = RUN_TYPE.API_SERVER) {
  const timeKey = 'dimensions cache init'

  console.time(timeKey)

  const fileKey = getFileCacheKeyV2()
  const adapterTypesMap = await readFromPGCache(fileKey).then(data => data ?? {})

  console.timeEnd(timeKey)

  return adapterTypesMap
}

export async function storeDimensionsCacheV2(data: any) {
  const fileKey = getFileCacheKeyV2()
  
  return writeToPGCache(fileKey, data)
}

let cacheLoaded = false

export async function loadDimensionsCache() {
  for (const adaptorRecordType of Object.values(AdapterType)) {
    const fileKey = getFileCacheKey(adaptorRecordType)
    const data = await readFromPGCache(fileKey)
    cache.feesAdapterCache[fileKey] = data
    Object.entries(data).forEach(([key, value]) => {
      data[key] = AdaptorRecord.fromJSON(value)
    })
  }
  cacheLoaded = true
}

export async function getAdaptorRecord2({ adapter, type, mode = 'ALL', adaptorType }: GetAdaptorRecordOptions): Promise<AdaptorRecord[] | AdaptorRecord> {
  if (!cacheLoaded) throw new Error("Dimensions Cache not loaded")
  if (!adaptorType) throw new Error("adaptorType is required")

  const fileKey = getFileCacheKey(adaptorType)
  if (!cache.feesAdapterCache[fileKey]) throw new Error("Cache not found: " + fileKey)

  const cacheKey = getAdapterCacheKey(adapter, type, mode)
  return cache.feesAdapterCache[fileKey][cacheKey]
}

export function computeSummary({ records, versionKey, chain, recordType, }: {
  records: any,
  versionKey?: string,
  recordType: string,
  chain?: string,
}) {
  const allKeys = Object.keys(records)
  allKeys.sort()
  const summary: any = {}
  let todayStr = getTimeSDaysAgo(0)
  let moveADayBack = false
  if (!records[todayStr]) {
    moveADayBack = true
    todayStr = getTimeSDaysAgo(0, moveADayBack)
  }
  let yesterdayStr = getTimeSDaysAgo(1, moveADayBack)
  const lastWeekTimeStrings = Array.from({ length: 7 }, (_, i) => getTimeSDaysAgo(i, moveADayBack))

  const accumulativeRecordType = ACCOMULATIVE_ADAPTOR_TYPE[recordType]
  if (accumulativeRecordType) { // this means current recordType is not accumulative
    summary.total24h = getValue(records[todayStr])
    summary.total48hto24h = getValue(records[yesterdayStr])
    summary.total7d = lastWeekTimeStrings.map((dateStr: string) => getValue(records[dateStr])).reduce((acc: number, i: any) => acc + i, 0)
    summary.totalAllTime = 0
    
    for (const key in allKeys) {
      const record = records[key]
      const totalValue = getValue(record, accumulativeRecordType)
      if (totalValue) {
        summary.totalAllTime = totalValue

      } else {
        summary.totalAllTime += getValue(record)
      }
    }
  }

  function getValue(record: any, rType = recordType) {
    if (!record) return 0
    let data
    if (!versionKey) {
      data = record.aggregated?.[rType]
    } else {
      data = record.breakdown?.[rType]?.[versionKey]
    }
    if (!data) return 0
    return (chain ? data.chains?.[chain] : data.value) ?? 0
  }
  return summary
}