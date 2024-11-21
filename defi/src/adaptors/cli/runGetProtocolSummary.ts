import "./setup.ts"
import { handler, IHandlerBodyResponse } from "../handlers/getProtocol";
import { performance } from "perf_hooks";

(async () => {
    const start = performance.now()
    const r = await handler({
        pathParameters: {
            name: "pancakeswap",
            type: "dexs"
        },
        /* queryStringParameters: {
            dataType: "dailyRevenue"
        } */
    } as unknown as AWSLambda.APIGatewayEvent)
    const end = performance.now()
    const d = JSON.parse(r.body) as Partial<IHandlerBodyResponse>
    console.log(JSON.stringify(d.totalDataChartBreakdown?.slice(-5), null, 2))
    console.log(d.totalDataChart?.slice(0, 5))
    console.log(d.childProtocols)
    console.log((end - start) / 1000)
    //console.log(JSON.stringify(d, null, 2))
})()