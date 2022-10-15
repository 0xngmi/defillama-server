import generateProtocolAdaptorsList from "../helpers/generateProtocolAdaptorsList";
import volume_imports from "../../../utils/imports/adapters_volumes"
import config from "./config";
import { AdaptorRecordType } from "../../db-utils/adaptor-record";

// TODO: needs to be optimized. Currently loads to memory all adaptors
export const importModule = (module: string) => volume_imports[module]

// KEYS USED TO MAP ATTRIBUTE -> KEY IN DYNAMO
export const KEYS_TO_STORE = {
    [AdaptorRecordType.dailyVolumeRecord]: "dailyVolume",
    [AdaptorRecordType.totalVolumeRecord]: "totalVolume"
}

export default generateProtocolAdaptorsList(volume_imports, config)