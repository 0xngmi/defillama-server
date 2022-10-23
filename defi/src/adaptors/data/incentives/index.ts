import generateProtocolAdaptorsList from "../helpers/generateProtocolAdaptorsList";
import incentives_imports from "../../../utils/imports/incentives_adapters"
import config from "./config";
import { AdaptorRecordType } from "../../db-utils/adaptor-record";

// TODO: needs to be optimized. Currently loads to memory all adaptors
export const importModule = (module: string) => incentives_imports[module]

// KEYS USED TO MAP ATTRIBUTE -> KEY IN DYNAMO
export const KEYS_TO_STORE = {
    [AdaptorRecordType.tokenIncentives]: "tokens"
}

export default generateProtocolAdaptorsList(incentives_imports, config)