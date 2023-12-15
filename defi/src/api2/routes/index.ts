import * as HyperExpress from "hyper-express";
import { cache, getLastHourlyRecord, getLastHourlyTokensUsd, protocolHasMisrepresentedTokens, } from "../cache";
import { readRouteData, readFromPGCache, deleteFromPGCache, } from "../cache/file-cache";
import sluggify from "../../utils/sluggify";
import { cachedCraftProtocolV2 } from "../utils/craftProtocolV2";
import { cachedCraftParentProtocolV2 } from "../utils/craftParentProtocolV2";
import { get20MinDate } from "../../utils/shared";
import { getTokensInProtocolsInternal } from "../../getTokenInProtocols";
import { successResponse, errorResponse, errorWrapper as ew } from "./utils";
import { getSimpleChainDatasetInternal } from "../../getSimpleChainDataset";
import craftCsvDataset from "../../storeTvlUtils/craftCsvDataset";
import { getCurrentUnixTimestamp } from "../../utils/date";
import { getClosestProtocolItem } from "../db";
import { hourlyTokensTvl, hourlyUsdTokensTvl } from "../../utils/getLastRecord";
import { computeInflowsData } from "../../getInflows";
import { getFormattedChains } from "../../getFormattedChains";

export default function setRoutes(router: HyperExpress.Router, routerBasePath: string) {
  // todo add logging middleware to all routes
  // router.get("/hourly/:name", (async (req, res) => getProtocolishData(req, res, { dataType: 'protocol', useHourlyData: true, skipAggregatedTvl: false })));  // too expensive to handle here
  // router.get("/config/:chain/:contract", ew(getContractName));  // too many requests to handle here
  // add secret route to delete from PG cache

  router.get("/protocol/:name", ew(async (req: any, res: any) => getProtocolishData(req, res, { dataType: 'protocol', skipAggregatedTvl: false, useNewChainNames: false, })));
  router.get("/treasury/:name", ew(async (req: any, res: any) => getProtocolishData(req, res, { dataType: 'treasury' })));
  router.get("/entity/:name", ew(async (req: any, res: any) => getProtocolishData(req, res, { dataType: 'entities' })));
  router.get("/updatedProtocol/:name", (async (req, res) => getProtocolishData(req, res, { dataType: 'protocol', useHourlyData: false, skipAggregatedTvl: req.query_parameters.includeAggregatedTvl !== 'true' })));

  router.get("/tokenProtocols/:symbol", ew(getTokenInProtocols));
  router.get("/protocols", protocolsRouteResponse);
  router.get("/config", configRouteResponse);
  router.get("/lite/charts", liteChartsRouteResponse);

  router.get("/treasuries", defaultFileHandler);
  router.get("/entities", defaultFileHandler);
  router.get('/chains', defaultFileHandler)
  router.get('/v2/chains', defaultFileHandler)
  router.get("/tvl/:name", ew(tvlHandler));
  router.get("/config/smol/:name", ew(smolConfigHandler));
  router.get("/raises", defaultFileHandler);
  router.get("/hacks", defaultFileHandler);
  router.get("/oracles", defaultFileHandler);
  router.get("/forks", defaultFileHandler);
  router.get("/categories", defaultFileHandler);
  router.get("/langs", defaultFileHandler);
  router.get("/lite/charts/:chain", defaultFileHandler);

  router.get("/simpleChainDataset/:chain", ew(getSimpleChainDataset));
  router.get("/dataset/:protocol", ew(getDataset));


  router.get("/inflows/:protocol/:timestamp", ew(getInflows))
  router.get("/lite/protocols2", defaultFileHandler);
  router.get("/lite/v2/protocols", defaultFileHandler);
  router.get("/chains2", ew(getFormattedChainsData))
  router.get("/chains2/:category", ew(getFormattedChainsData))
  router.get("/config/yields", defaultFileHandler)
  router.get("/outdated", defaultFileHandler)


  function defaultFileHandler(req: HyperExpress.Request, res: HyperExpress.Response) {
    const fullPath = req.path;
    const routerPath = fullPath.replace(routerBasePath, '');
    return fileResponse(routerPath, res);
  }

  function configRouteResponse(_req: HyperExpress.Request, res: HyperExpress.Response) {
    return fileResponse('configs', res);
  }

  function liteChartsRouteResponse(_req: HyperExpress.Request, res: HyperExpress.Response) {
    return fileResponse('lite/charts-total', res);
  }

  function protocolsRouteResponse(req: HyperExpress.Request, res: HyperExpress.Response) {
    if (req.query_parameters.includeChains === 'true')
      return fileResponse('protocols-with-chains', res);
    return fileResponse('protocols', res);
  }

  function tvlHandler(req: HyperExpress.Request, res: HyperExpress.Response) {
    let name = sluggify({ name: req.path_parameters.name } as any)

    let protocolData = cache.protocolSlugMap[name]
    if (protocolData) return successResponse(res, getLastHourlyRecord(protocolData)?.tvl, 10 * 60);

    const parentData = cache.parentProtocolSlugMap[name]
    if (parentData) {
      const childProtocols = cache.childProtocols[parentData.id] ?? []
      if (childProtocols.length < 1 || childProtocols.map((p: any) => p.name).includes(parentData.name))
        return errorResponse(res, 'bad parent protocol')

      const tvl = childProtocols.map(getLastHourlyRecord).reduce((acc: number, cur: any) => acc + cur.tvl, 0);
      return successResponse(res, tvl, 10 * 60);
    }

    return errorResponse(res, 'Protocol not found')
  }

  function smolConfigHandler(req: HyperExpress.Request, res: HyperExpress.Response) {
    let name = sluggify({ name: req.path_parameters.name } as any)
    let protocolData = cache.protocolSlugMap[name]
    if (protocolData) return successResponse(res, protocolData, 10 * 60);
    protocolData = cache.parentProtocolSlugMap[name]
    if (protocolData) return successResponse(res, protocolData, 10 * 60);
    return errorResponse(res, 'Protocol not found')
  }

  async function fileResponse(filePath: string, res: HyperExpress.Response) {
    try {
      res.set('Cache-Control', 'public, max-age=600'); // Set caching to 10 minutes
      res.json(await readRouteData(filePath))
    } catch (e) {
      console.error(e);
      return errorResponse(res, 'Internal server error', { statusCode: 500 })
    }
  }

  router.get('/debug-pg/*', debugHandler)
  router.delete('/debug-pg/*', debugHandler)

  async function debugHandler(req: any, res: any) {
    const fullPath = req.path;
    const routerPath = fullPath.replace(routerBasePath + '/debug-pg', '');
    console.log('debug-pg', routerPath)
    try {

      switch (req.method) {
        case 'GET':
          return res.json(await readFromPGCache(routerPath))
        case 'DELETE':
          await deleteFromPGCache(routerPath)
          return res.json({ success: true })
        default:
          throw new Error('Unsupported method')
      }
    } catch (e) {
      console.error(e);
      return errorResponse(res, 'Internal server error', { statusCode: 500 })
    }
  }
}

async function getProtocolishData(req: HyperExpress.Request, res: HyperExpress.Response, { dataType, useHourlyData = false, skipAggregatedTvl = true, useNewChainNames = true }: GetProtocolishOptions) {
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

  if (!protocolData)
    return errorResponse(res, 'Protocol not found')

  const responseData = await cachedCraftProtocolV2({
    protocolData,
    useNewChainNames,
    useHourlyData,
    skipAggregatedTvl,
  });
  return res.json(responseData);
}

async function getTokenInProtocols(req: HyperExpress.Request, res: HyperExpress.Response) {
  let symbol = req.path_parameters.symbol
  if (!symbol)
    return errorResponse(res, 'Ser you need to provide a token')
  
  res.setHeaders({ "Expires": get20MinDate() })

  const responseData = await getTokensInProtocolsInternal(symbol, {
    protocolList: cache.metadata.protocols,
    protocolHasMisrepresentedTokens: protocolHasMisrepresentedTokens as any,
    getLastHourlyTokensUsd: getLastHourlyTokensUsd as any,
  });

  return successResponse(res, responseData, 10);
}

async function getSimpleChainDataset(req: HyperExpress.Request, res: HyperExpress.Response) {
  let param = req.path_parameters.chain ?? ''
  if (param.endsWith('.csv')) param = param.slice(0, -4)

  const chain = param
  const params = req.query_parameters
  const options = {
    ...params,
    getHistTvlMeta: () => cache.historicalTvlForAllProtocolsMeta,
    readFromPG: true,
  }
  const { error, filename, csv } = await getSimpleChainDatasetInternal(chain, options)
  if (error) {
    console.log(error)
    return errorResponse(res)
  }

  res.setHeaders({ "Expires": get20MinDate() })
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)

  return successResponse(res, csv, 30, { isJson: false })
}

async function getDataset(req: HyperExpress.Request, res: HyperExpress.Response) {
  let param = req.path_parameters.protocol?.toLowerCase() ?? ''
  if (param.endsWith('.csv')) param = param.slice(0, -4)

  const protocolName = param
  const filename = `${protocolName}.csv`;
  const name = sluggify({ name: protocolName } as any)
  const protocolData = cache.protocolSlugMap[name];
  if (!protocolData)
    return errorResponse(res, 'Protocol not found')
  
  const csv = await craftCsvDataset([protocolData], true, false, { readFromPG: true });

  res.setHeaders({ "Expires": get20MinDate() })
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)

  return successResponse(res, csv, 30, { isJson: false })
}

type GetProtocolishOptions = {
  dataType: string,
  useHourlyData?: boolean,
  skipAggregatedTvl?: boolean,
  useNewChainNames?: boolean,
}

async function getInflows(req: HyperExpress.Request, res: HyperExpress.Response) {
  let name = sluggify({ name: req.path_parameters.protocol } as any)
  const protocolData = cache.protocolSlugMap[name]
  if (!protocolData)
    return errorResponse(res, 'Protocol not found')

  const protocolId = protocolData.id
  const tokensToExclude = req.query_parameters.tokensToExclude?.split(",") ?? []
  const timestamp = Number(req.path_parameters.timestamp)
  const endTimestamp = Number(req.query_parameters?.end ?? getCurrentUnixTimestamp());

  const old = await getClosestProtocolItem(hourlyTokensTvl, protocolId, timestamp, { searchWidth: 2 * 3600 })

  if (old.SK === undefined)
    return errorResponse(res, 'No data at that timestamp')

  const [currentTokens, currentUsdTokens] = await Promise.all(
    [hourlyTokensTvl, hourlyUsdTokensTvl].map((prefix) => getClosestProtocolItem(prefix, protocolId, endTimestamp, 2 * 3600))
  );

  if (!currentTokens || !currentTokens.SK || !currentUsdTokens || !currentTokens.SK)
    return errorResponse(res, 'No data')

  const responseData = computeInflowsData(protocolData, currentTokens, currentUsdTokens, old, tokensToExclude)

  return successResponse(res, responseData, 1);
}

async function getFormattedChainsData(req: HyperExpress.Request, res: HyperExpress.Response) {
  let category = req.path_parameters.category ?? ''
  return successResponse(res, await getFormattedChains(category), 30);
}