import { wrap, IResponse } from "./utils/shared";
import { craftProtocolResponse, wrapResponseOrRedirect } from "./getProtocol";

const handler = async (event: AWSLambda.APIGatewayEvent): Promise<IResponse> => {
  const includeAggregatedTvl = event.queryStringParameters?.includeAggregatedTvl?.toLowerCase();

  const response = await craftProtocolResponse({
    rawProtocolName: event.pathParameters?.protocol,
    useNewChainNames: true,
    useHourlyData: false,
    skipAggregatedTvl: includeAggregatedTvl && includeAggregatedTvl === "true" ? false : true,
  });

  return wrapResponseOrRedirect(response, "updated/");
};

export default wrap(handler);
