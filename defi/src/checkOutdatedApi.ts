import { wrapScheduledLambda } from "./utils/shared/wrap";
//import protocols from "./protocols/data";
import axios from "axios"
import { sendMessage } from "./utils/discord";

const urls = [
    // HTML
    "https://defillama.com/yields",
    "https://defillama.com/",
    "https://defillama.com/chains",
    "https://defillama.com/stablecoins",
    "https://defillama.com/stablecoins/chains",

    // API
    "https://api.llama.fi/protocols",
    "https://api.llama.fi/protocol/Lido", // multiple
    "https://api.llama.fi/updatedProtocol/Lido", // multiple
    "https://api.llama.fi/charts",
    "https://api.llama.fi/charts/Ethereum", // multiple
    "https://api.llama.fi/tvl/Lido", // multiple
    "https://api.llama.fi/chains",

    // Stablecoins
    "https://stablecoins.llama.fi/stablecoins",
    "https://stablecoins.llama.fi/stablecoincharts/all",
    "https://stablecoins.llama.fi/stablecoincharts/Ethereum", // multiple
    "https://stablecoins.llama.fi/stablecoin/tether", // multiple
    "https://stablecoins.llama.fi/stablecoinchains",
    "https://stablecoins.llama.fi/stablecoinprices",

    // Yields
    "https://yields.llama.fi/pools",
    "https://yields.llama.fi/chart/747c1d2a-c668-4682-b9f9-296708a3dd90", // multiple

    // Internal
    "https://api.llama.fi/lite/protocols2",
    "https://api.llama.fi/lite/charts",
    "https://api.llama.fi/lite/charts/Ethereum", // multiple
]

const maxAgeAllowed = {
    "https://defillama.com/stablecoins": 3600*1.5,
    "https://defillama.com/stablecoins/chains": 3600*1.5,
} as { [url:string]: number}

const alert = (message: string) => sendMessage(message, process.env.MONITOR_WEBHOOK!)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const handler = async () => {
    const responses = {} as any
    // Main urls
    await Promise.all(urls.map(async url => {
        try {
            const res = await axios.get(url)
            const lastModified = res.headers["last-modified"]
            if (lastModified) {
                const timeDiff = (new Date().getTime() - new Date(lastModified).getTime()) / 1e3
                if (timeDiff > 3600) {
                    alert(`${url} was last modified ${(timeDiff / 3600).toFixed(2)} hours ago (${lastModified})`)
                }
            } else {
                const maxAge = maxAgeAllowed[url] ?? 3600;
                const age = res.headers.age
                if (age && Number(age) > maxAge) {
                    await sleep(5e3) // 5s -> allow page to regenerate if nobody has used it in last hour
                    const newAge = (await axios.get(url)).headers.age
                    if (newAge && Number(newAge) > maxAge) {
                        alert(`${url} was last updated ${(Number(newAge) / 3600).toFixed(2)} hours ago`)
                    }
                }
            }
            responses[url] = res.data;
        } catch (e) {
            alert(`${url} failed`)
        }
    }))
    // TODO: test a random sample of endpoints market with `multiple`
};

export default wrapScheduledLambda(handler);
