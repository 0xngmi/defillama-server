import "./setup.ts"
import { handler, IGetDexsResponseBody } from "../handlers/getDexs";

(async () => {
    const r = await handler()
    const rr = JSON.parse(r.body) as IGetDexsResponseBody
    console.log(rr.totalDataChart[rr.totalDataChart.length-1])
    console.log(rr.totalDataChart.length)
    /*     console.log("totalVolume", rr.totalVolume)
        console.log("changeVolume1d", rr.changeVolume1d)
        console.log("changeVolume7d", rr.changeVolume7d)
        console.log("changeVolume30d", rr.changeVolume30d) */
})()