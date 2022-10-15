import { successResponse, wrap, IResponse } from "../../../utils/shared";
import sluggify from "../../../utils/sluggify";
import { getAdaptorRecord, AdaptorRecord, AdaptorRecordType } from "../../db-utils/adaptor-record";
import { IRecordAdaptorRecordData } from "../../db-utils/adaptor-record";
import loadAdaptorsData from "../../data"
import { IJSON, ProtocolAdaptor } from "../../data/types";
import { AdapterType } from "@defillama/adaptors/adapters/types";
import generateProtocolAdaptorSummary from "../helpers/generateProtocolAdaptorSummary";

export interface VolumeHistoryItem {
    dailyVolume: IRecordAdaptorRecordData;
    timestamp: number;
}

export interface IHandlerBodyResponse extends Pick<ProtocolAdaptor,
    "name"
    | "logo"
    | "address"
    | "url"
    | "description"
    | "audits"
    | "category"
    | "twitter"
    | "audit_links"
    | "forkedFrom"
    | "gecko_id"
    | "disabled"
> {
    volumeHistory: VolumeHistoryItem[] | null
    total1dVolume: number | null
    change_1d: number | null
}

export const ONE_DAY_IN_SECONDS = 60 * 60 * 24

const DEFAULT_CHART_BY_ADAPTOR_TYPE: IJSON<string> = {
    [AdapterType.VOLUME]: AdaptorRecordType.dailyVolumeRecord,
    [AdapterType.FEES]: AdaptorRecordType.dailyFeesRecord
}

export const handler = async (event: AWSLambda.APIGatewayEvent): Promise<IResponse> => {
    const protocolName = event.pathParameters?.name?.toLowerCase()
    const adaptorType = event.pathParameters?.type?.toLowerCase() as AdapterType
    if (!protocolName || !adaptorType) throw new Error("Missing name or type")

    const adaptorsData = loadAdaptorsData(adaptorType)
    const dexData = adaptorsData.default.find(
        (prot) => sluggify(prot) === protocolName
    );
    if (!dexData) throw new Error("DEX data not found!")
    let dexDataResponse = {}
    try {
        let volumes = await getAdaptorRecord(dexData.id, DEFAULT_CHART_BY_ADAPTOR_TYPE[adaptorType] as AdaptorRecordType, "ALL")
        volumes = volumes
        // This check is made to infer Volume type instead of Volume[] type
        if (volumes instanceof AdaptorRecord) throw new Error("Wrong volume queried")

        const generatedSummary = await generateProtocolAdaptorSummary(dexData, adaptorType, undefined, undefined)

        dexDataResponse = {
            name: generatedSummary.name,
            disabled: generatedSummary.disabled,
            logo: dexData.logo,
            address: dexData.address,
            url: dexData.url,
            description: dexData.description,
            audits: dexData.audits,
            category: dexData.category,
            twitter: dexData.twitter,
            audit_links: dexData.audit_links,
            forkedFrom: dexData.forkedFrom,
            gecko_id: dexData.gecko_id,
            volumeHistory: formatChartHistory(generatedSummary.volumes),
            total1dVolume: generatedSummary.totalVolume24h, // yesterdaysVolume ? sumAllVolumes(yesterdaysVolume) : 0,
            change_1d: generatedSummary.change_1d // calcNdChange(volumes, 1, yesterdaysVolumeObj.timestamp)
        } as IHandlerBodyResponse
    } catch (error) {
        console.error(error)
        dexDataResponse = {
            name: dexData.name,
            logo: dexData.logo,
            address: dexData.address,
            url: dexData.url,
            description: dexData.description,
            audits: dexData.audits,
            category: dexData.category,
            twitter: dexData.twitter,
            audit_links: dexData.audit_links,
            forkedFrom: dexData.forkedFrom,
            gecko_id: dexData.gecko_id,
            disabled: dexData.disabled,
            volumeHistory: null,
            total1dVolume: null,
            change_1d: null
        } as IHandlerBodyResponse
    }

    return successResponse(dexDataResponse as IHandlerBodyResponse, 10 * 60); // 10 mins cache
};

const formatChartHistory = (volumes: AdaptorRecord[] | null) => {
    if (volumes === null) return []
    return volumes.map<VolumeHistoryItem>(v => ({
        dailyVolume: v.data,
        timestamp: v.sk
    }))
}

export default wrap(handler);