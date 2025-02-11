import getTokenPrices from "./pac";

export function pac(timestamp: number = 0) {
  return getTokenPrices(timestamp)
}