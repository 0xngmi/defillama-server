import { Write, } from "../../utils/dbInterfaces";
import {
    addToDBWritesList,
} from "../../utils/database";
import { getApi } from "../../utils/sdk";


const token = ['0x7f69a2ba074dA1Fd422D994ee05C4B8CA83A32C7']
const pricer = ['0x93440F790f7E7ce2A74eF7051E8D4a0d7f05DF09']
const chain = 'hashkey'

export default async function getTokenPrices(timestamp: number) {
    const writes: Write[] = [];
    const api = await getApi(chain, timestamp, true)

    const [decimals, symbols, price] = await Promise.all([
        api.multiCall({ abi: 'uint8:decimals', calls: token }),
        api.multiCall({ abi: 'string:symbol', calls: token }),
        api.multiCall({ abi: 'uint256:getLatestPrice', calls: pricer })
    ])
    console.log("decimals", decimals);
    console.log("symbols", symbols);
    console.log("price", price)
    
    token.forEach((token: any, i: number) => {
        addToDBWritesList(writes, chain, token, price[i] / (10 ** decimals[i]), decimals[i], symbols[i], timestamp, 'pac', 0.98)
    })
    return writes
}

getTokenPrices(0)