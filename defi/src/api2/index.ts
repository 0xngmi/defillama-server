import * as HyperExpress from "hyper-express";
import { cache, initCache } from "./cache";
import sluggify from "../utils/sluggify";
import { cachedCraftProtocolV2 } from "./utils/craftProtocolV2";
import { cachedCraftParentProtocolV2 } from "./utils/craftParentProtocolV2";
import { initializeTVLCacheDB } from "./db";
import * as sdk from '@defillama/sdk'
import { get20MinDate } from "../utils/shared";

const webserver = new HyperExpress.Server()

const port = +(process.env.PORT ?? 5001)

type GetProtocolishOptions = {
  dataType: string,
  useHourlyData?: boolean,
  skipAggregatedTvl?: boolean,
  useNewChainNames?: boolean,
}

async function getProtocolishData(req: HyperExpress.Request, res: HyperExpress.Response, { dataType, useHourlyData = false, skipAggregatedTvl = true, useNewChainNames = true }: GetProtocolishOptions) {
  try {
    let name = sluggify({ name: req.path_parameters.name } as any)
    const protocolData = (cache as any)[dataType + 'SlugMap'][name];
    res.setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Expires": get20MinDate()
    })

    // check if it is a parent protocol
    if (!protocolData && dataType === 'protocol') {
      const parentProtocol = (cache as any)['parentProtocolSlugMap'][name];
      if (parentProtocol) {
        const responseData = await cachedCraftParentProtocolV2({
          parentProtocol: parentProtocol,
          useHourlyData,
          skipAggregatedTvl,
        });
        return res.json(responseData);
      }
    }

    if (!protocolData) {
      res.status(404)
      return res.send('Not found', true)
    }
    const responseData = await cachedCraftProtocolV2({
      protocolData,
      useNewChainNames,
      useHourlyData,
      skipAggregatedTvl,
    });
    return res.json(responseData);
  } catch (e) {
    sdk.log(e)
    res.status(500)
    return res.send('Internal Error', true)
  }
}

webserver.get("/protocol/:name", async (req, res) => getProtocolishData(req, res, { dataType: 'protocol', skipAggregatedTvl: false, useNewChainNames: false, }));
webserver.get("/treasury/:name", async (req, res) => getProtocolishData(req, res, { dataType: 'treasury' }));
webserver.get("/entity/:name", async (req, res) => getProtocolishData(req, res, { dataType: 'entities' }));
webserver.get("/updatedProtocol/:name", async (req, res) => getProtocolishData(req, res, { dataType: 'protocol', useHourlyData: false, skipAggregatedTvl: req.query_parameters.includeAggregatedTvl !== 'true' }));
webserver.get("/hourly/:name", async (req, res) => getProtocolishData(req, res, { dataType: 'protocol', useHourlyData: true, skipAggregatedTvl: false }));

async function main() {
  await initializeTVLCacheDB({ isApi2Server: true })
  await initCache()

  webserver.listen(port)
    .then(() => console.log('Webserver started on port ' + port))
    .catch(() => console.log('Failed to start webserver on port ' + port))
}

main()