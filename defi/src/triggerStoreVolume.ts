import { wrapScheduledLambda } from "./utils/shared/wrap";
// TODO pull dexVolumes from db
import {adaptersDataVolumes} from "./dexVolumes/data";
import invokeLambda from "./utils/shared/invokeLambda";
import type { IHandlerEvent as IStoreDexVolumeHandlerEvent } from './dexVolumes/handlers/storeDexVolume'
import { handler as storeDexVolume } from "./dexVolumes/handlers/storeDexVolume";

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

const STEP = 10;

export interface IHandlerEvent {
  backfill: Array<{
    dexNames: string[]
    timestamp: IStoreDexVolumeHandlerEvent['timestamp']
  }>
}

export const handler = async (event?: IHandlerEvent) => {
  // TODO separate those that need to be called on the hour and those using graphs with timestamp
  if (event?.backfill) {
    console.info("Backfill event", event.backfill)
    for (const bf of event.backfill) {
      const protocolIndexes: IStoreDexVolumeHandlerEvent['protocolIndexes'] = []
      for (const dexName of bf.dexNames) {
        const dexIndex = adaptersDataVolumes.findIndex(va => va.volumeAdapter === dexName)
        if (dexIndex >= 0)
          protocolIndexes.push(dexIndex)
      }
      await invokeLambdas(protocolIndexes, bf.timestamp)
    }
  }
  else {
    const protocolIndexes = Array.from(Array(adaptersDataVolumes.length).keys())
    await invokeLambdas(protocolIndexes)
  }
};

const invokeLambdas = async (protocolIndexes: IStoreDexVolumeHandlerEvent['protocolIndexes'], timestamp?: IStoreDexVolumeHandlerEvent['timestamp']) => {
  shuffleArray(protocolIndexes);
  for (let i = 0; i < protocolIndexes.length; i += STEP) {
    const event = {
      protocolIndexes: protocolIndexes.slice(i, i + STEP),
      timestamp
    };
    console.info(`Storing volume: ${protocolIndexes} ${timestamp}`)
    const storeFunction = process.env.runLocal === 'true' ? storeDexVolume : runStoreDex
    // if (process.env.runLocal === 'true') await delay(1000)
    await storeFunction(event);
  }
}

export const runStoreDex = async (e: IStoreDexVolumeHandlerEvent) => invokeLambda(`defillama-prod-storeVolume`, e)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default wrapScheduledLambda(handler);
