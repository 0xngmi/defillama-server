import { IHandlerEvent as ITriggerStoreVolumeEventHandler } from "../../../triggerStoreVolume"
import fs, { writeFileSync } from "fs"
import path from "path"
import volumeAdapters from '../../dexAdapters'
import { importVolumeAdapter } from "../../../utils/imports/importDexAdapters"
import { VolumeAdapter } from "@defillama/adapters/volumes/dexVolume.type"

const DAY_IN_MILISECONDS = 1000 * 60 * 60 * 24

export default async () => {
    // comment dexs that you dont want to backfill
    const DEXS_LIST: string[] = [
        // 'mooniswap',
        // 'quickswap',
        // 'dodo', check spikes
        // 'uniswap' //backfilled
        // 'curve', //enabled
        // 'terraswap', //backfilled, peding to check and enable ?
        // 'serum', //backfilled (needs extra data?)
        // 'klayswap', //backfilled (needs extra data?)
        // 'osmosis', //backfilled
        // 'balancer', //backfilled
        // 'bancor', //backfilled
        // 'champagneswap', //backfilled
        // 'katana', //backfilled
        // 'pancakeswap', //backfilled
        // 'raydium', //backfilled
        // 'soulswap', //backfilled
        // 'spiritswap', //backfilled
        // 'spookyswap', //backfilled
        // 'sushiswap', //backfilled
        // 'traderjoe', //backfilled
    ]

    let startTimestamp = 0
    // Looking for start time from adapter, if not found will default to the above
    const dex = volumeAdapters.find(dex => dex.volumeAdapter === DEXS_LIST[0])
    if (dex) {
        const dexAdapter: VolumeAdapter = (await importVolumeAdapter(dex)).default
        if ("volume" in dexAdapter) {
            const st = await Object.values(dexAdapter.volume)
                .reduce(async (accP, { start }) => {
                    const acc = await accP
                    const currstart = await start().catch(() => 0)
                    return (typeof currstart === 'number' && currstart < acc) ? currstart : acc
                }, Promise.resolve(Date.now() / 1000))
            startTimestamp = st
        } else {
            const st = await Object.values(dexAdapter.breakdown).reduce(async (accP, dexAdapter) => {
                const acc = await accP
                const bst = await Object.values(dexAdapter).reduce(async (accP, { start }) => {
                    const acc = await accP
                    const currstart = await start().catch(() => 0)
                    return (typeof currstart === 'number' && currstart < acc) ? currstart : acc
                }, Promise.resolve(Date.now() / 1000))

                return bst < acc ? bst : acc
            }, Promise.resolve(Date.now() / 1000))
            startTimestamp = st
        }
        if (startTimestamp > 0) startTimestamp *= 1000
        else startTimestamp = new Date(Date.UTC(2018, 0, 1)).getTime()
    }
    // For specific ranges (remember months starts with 0)
     const startDate = new Date(Date.UTC(2022, 7, 5))
    // For new adapters
    // const startDate = new Date(startTimestamp)
    console.info("Starting timestamp", startTimestamp, "->", startDate)
    const endDate = new Date()
    const dates: Date[] = []
    for (let dayInMilis = startDate.getTime(); dayInMilis <= endDate.getTime(); dayInMilis += DAY_IN_MILISECONDS) {
        const date = new Date(dayInMilis)
        dates.push(date)
    }
    const event: ITriggerStoreVolumeEventHandler = {
        backfill: dates.map(date => ({
            dexNames: DEXS_LIST,
            timestamp: date.getTime() / 1000
        }))
    }

    const eventFileLocation = path.resolve(__dirname, "output", `backfill_event.json`);
    ensureDirectoryExistence(eventFileLocation)
    writeFileSync(eventFileLocation, JSON.stringify(event, null, 2))
    console.log(`Event stored ${eventFileLocation}`)
}

function ensureDirectoryExistence(filePath: string) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}