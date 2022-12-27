import dynamodb from "../utils/shared/dynamodb";
import { dailyTokensTvl, dailyTvl, dailyUsdTokensTvl, hourlyTvl } from "../utils/getLastRecord";
import { getProtocol } from "./utils";

async function main() {
  const protocolName = 'OCP Finance'
  const dateFromStr = '2022-09-02'
  const dateToStr = '2022-08-16'
  console.log('Deteting data for protcol: ', protocolName)
  console.log('From: ', dateFromStr)
  console.log('Till: ', dateToStr)
  const protocol = getProtocol(protocolName)
  const deleteFrom = (+new Date(dateFromStr)) / 1000
  const deleteTo = (+new Date(dateToStr)) / 1000
  for (const tvlFunc of [dailyTokensTvl, dailyTvl, dailyUsdTokensTvl, hourlyTvl]) {
    const data = await dynamodb.query({
      ExpressionAttributeValues: {
        ":pk": tvlFunc(protocol.id),
      },
      KeyConditionExpression: "PK = :pk",
    });
    const items = (data.Items ?? [])
      .filter(d => d.SK < deleteFrom)
      .filter(d => d.SK > deleteTo)
    console.log('have to delete ', items.length, ' items, table:', tvlFunc(protocol.id))
    for (const d of items) {
      await dynamodb.delete({
        Key: {
          PK: d.PK,
          SK: d.SK,
        },
      });
    }
  }
}

main().then(() => {
  console.log('Done!!!')
  process.exit(0)
})
