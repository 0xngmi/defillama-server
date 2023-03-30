import { wrapScheduledLambda } from "./utils/shared/wrap";
import { treasuries } from "./protocols/data";
import invokeLambda from "./utils/shared/invokeLambda";

function shuffleArray(array:number[]) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

const step = 40;
const handler = async () => {
  const protocolIndexes = Array.from(Array(treasuries.length).keys());
  shuffleArray(protocolIndexes);
  for (let i = 0; i < treasuries.length; i += step) {
    const event = {
      protocolIndexes: protocolIndexes.slice(i, i+step)
    };
    await invokeLambda(`defillama-prod-storeTreasuryInterval`, event);
  }
};

export default wrapScheduledLambda(handler);
