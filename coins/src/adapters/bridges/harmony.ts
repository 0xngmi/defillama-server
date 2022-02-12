import {fetch, formatExtraTokens} from "../utils"

const networkToIdentifier = {
    "ETHEREUM": "ethereum",
    "BINANCE": "bsc",
} as { [network: string]: string | undefined }

export default async function bridge() {
    const bridge = (
        await fetch("https://be4.bridge.hmny.io/tokens/?page=0&size=1000")
    ).content as any[];

    return bridge.map(token => {
        const chain = networkToIdentifier[token.network];
        if (chain === undefined) {
            return null
        }
        return {
            from: `harmony:${token.hrc20Address}`,
            to: `${chain}:${token.erc20Address}`,
            decimals: Number(token.decimals),
            symbol: token.symbol,
        }
    }).filter(t => t !== null).concat(extraTokens)
}

const extraTokens = formatExtraTokens("harmony", [
    ["0x224e64ec1bdce3870a6a6c777edd450454068fec", "coingecko#terrausd", "UST", 18],
    ["0xe1c110e1b1b4a1ded0caf3e42bfbdbb7b5d7ce1c", "coingecko#elk-finance", "ELK", 18],
])