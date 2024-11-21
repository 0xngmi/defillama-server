import { getAllAirtableRecords } from "./utils/airtable";
import { successResponse, wrap, IResponse } from "./utils/shared";

const SECTOR = "Description (very smol)";
const VALUATION = "Valuation (millions)";

export async function getRaisesInternal() {
  let allRecords = await getAllAirtableRecords('appGpVsrkpqsZ9qHH/Raises')

  const formattedRaises = allRecords
    .filter(
      (r) =>
        r.fields["Company name (pls match names in defillama)"] !== undefined &&
        r.fields["Date (DD/MM/YYYY, the correct way)"] !== undefined
    )
    .map((r) => ({
      date: new Date(r.fields["Date (DD/MM/YYYY, the correct way)"]).getTime() / 1000,
      name: r.fields["Company name (pls match names in defillama)"],
      round: r.fields["Round"] ?? null,
      amount: r.fields["Amount raised (millions)"] ?? null,
      chains: r.fields["Chain"] ?? [],
      sector: r.fields[SECTOR]?.endsWith("\n") ? r.fields[SECTOR].slice(-1) : r.fields[SECTOR] || null,
      category: r.fields["General Sector"] ?? null,
      source: r.fields["Source (twitter/news links better because blogposts go down quite often)"],
      leadInvestors: r.fields["Lead Investor"] ?? [],
      otherInvestors: r.fields["Other investors"] ?? [],
      valuation: r.fields[VALUATION]?.endsWith("\n") ? r.fields[VALUATION].slice(-1) : r.fields[VALUATION] || null,
      defillamaId: r.fields["DefiLlama Id"],
    }));
  return { raises: formattedRaises }
}

const handler = async (_event: AWSLambda.APIGatewayEvent): Promise<IResponse> => {
  return successResponse(await getRaisesInternal(), 30 * 60);
};

export default wrap(handler);
