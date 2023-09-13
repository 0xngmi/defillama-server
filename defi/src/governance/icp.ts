import axios from 'axios'
import { GovCache, Proposal } from './types';
// import ic from 'ic0';
import { PromisePool } from "@supercharge/promise-pool";
import { updateStats } from './utils';
import { setCompound, getCompound } from './cache';

const MAX_PROPOSALS_PER_REQUEST: number = 100;
// Proposals with these topics should not be included in the data fetched
export const EXCLUDED_TOPICS = ["TOPIC_EXCHANGE_RATE", "TOPIC_NEURON_MANAGEMENT"];
const HARDCODED_SUPPLY = 50456078503492260;

// Proposal response onject from the NNS data API
interface NnsProposalResponse {
  action: string,
  action_nns_function: string,
  deadline_timestamp_seconds: number,
  decided_timestamp_seconds: number,
  executed_timestamp_seconds: number,
  failed_timestamp_seconds: number,
  id: number,
  "latest_tally": {
    "no": number,
    "timestamp_seconds": number,
    "total": number,
    "yes": number
  },
  "payload": any,
  proposal_id: number,
  proposal_timestamp_seconds: number,
  proposer: string,
  reject_cost_e8s: number,
  reward_status: string,
  settled_at: null,
  status: string,
  summary: string,
  title: string,
  topic: string,
  updated_at: string,
  url: string
}

/**
 * Returns metadata for the NNS on the internet computer
 * @returns {{ [key: string]: any }}
 */
export async function get_metadata() {
  var { data, status } = await axios.get(
    'https://ic-api.internetcomputer.org/api/v3/metrics/latest-proposal-id'
    ,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );
  // Connection to the NNS governance canister (Smart Contract)
  // const nns_icp_ledger = ic('ryjl3-tyaaa-aaaaa-aaaba-cai');

  return {
    // NNS Governance canister id
    id: "rrkah-fqaaa-aaaaa-aaaaq-cai",
    type: "Network Nervous System",
    proposalsCount: data.latest_proposal_id,
    symbol: "NNS",
    chainName: "Internet Computer",
    name: "Network Nervous System",
    tokes: [{
      // NNS ICP ledger canister id
      id: "ryjl3-tyaaa-aaaaa-aaaba-cai",
      type: "ICRC-1 Ledger",
      name: "Network Nervous System Internet Computer Protocol Ledger",
      symbol: "NNS ICP Ledger",
      // supply:parseInt(await nns_icp_ledger.call('icrc1_total_supply')).toString(),
      // decimals:parseInt(await nns_icp_ledger.call('icrc1_decimals')).toString(),
      supply: HARDCODED_SUPPLY,
      decimals: "8"
    }]
  }
}

/**
 * Returns an array of NNS proposals. The parameter limit states the number of proposals to be 
 * fetched starting from the proposal with the highest proposal id.
 * The offset parameter states the offset from the proposal with the highest proposal id.
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Proposal[]>}
 */
export async function get_proposals_interval(limit: number, offset: number): Promise<Proposal[]> {
  const nns_url: string = `https://ic-api.internetcomputer.org/api/v3/proposals?limit=${limit >= MAX_PROPOSALS_PER_REQUEST ? MAX_PROPOSALS_PER_REQUEST : limit}&offset=${offset}`
  const { data, status } = await axios.get(
    nns_url,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );
  let nns_proposals: Array<NnsProposalResponse> = data.data;
  let converted_proposals: Proposal[] = [];
  nns_proposals.forEach((p: NnsProposalResponse) => { converted_proposals.push(convert_proposal_format(p)) })
  return converted_proposals;
};

/**
 * Returns a NNS proposal given its proposal id.
 * @param {number} proposal_id
 * @returns {Promise<Proposal>}
 */
export async function get_nns_proposal(proposal_id: number): Promise<Proposal> {
  const nns_url: string = `https://ic-api.internetcomputer.org/api/v3/proposals/${proposal_id}`

  const { data, status } = await axios.get(
    nns_url,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );
  let nns_proposals: NnsProposalResponse = data;
  let converted_proposals = convert_proposal_format(nns_proposals);
  return converted_proposals;
}

/**
 * Converts the proposals fetched from the NNS Proposal API to the proposal format used in this repo
 * @param {NnsProposalResponse} proposal
 * @returns {Proposal}
 */
function convert_proposal_format(proposal: NnsProposalResponse): Proposal {
  return {
    id: proposal.proposal_id.toString(),
    title: proposal.topic,
    state: proposal.status,
    app: "Internet Computer",
    description: proposal.summary,
    space: { canister_id: "rrkah-fqaaa-aaaaa-aaaaq-cai" },
    choices: ["Yes", "No", "Undecided"],
    scores: [proposal.latest_tally.yes, proposal.latest_tally.no, proposal.latest_tally.total - proposal.latest_tally.yes - proposal.latest_tally.no],
    scores_total: proposal.latest_tally.total,
    quorum: 0.03,
    votes: 0,
    score_skew: 0,
    score_curve: 0,
    score_curve2: 0,
    start: proposal.proposal_timestamp_seconds,
    end: proposal.latest_tally.timestamp_seconds,
    executed: proposal.status === 'EXECUTED'
  };
}

/**
 * Given a Government Cache instance this function checks whether there are any new proposals missing 
 * from the cache and updates open proposals withing the last 12 weeks.
 * @param {GovCache} cache
 * @returns {Promise<GovCache>}
 */
export async function update_internet_computer_cache(cache: GovCache): Promise<GovCache> {
  // Update recent proposals
  cache = await update_recent_proposals(cache);

  const { data, status } = await axios.get(
    'https://ic-api.internetcomputer.org/api/v3/metrics/latest-proposal-id'
    ,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );
  let latest_nns_proposal_id = data.latest_proposal_id
  let nns_proposals_in_cache: string[] = Object.keys(cache.proposals);
  nns_proposals_in_cache.reverse();
  const latest_nns_proposal_in_cache = nns_proposals_in_cache.reduce((a: any, b: any) => a > +b ? a : b, 3)

  console.log(nns_proposals_in_cache.length, latest_nns_proposal_in_cache)
  // The proposals 0-2 are nor available => the lowest proposal id is 3
  let proposal_left_to_fetch = latest_nns_proposal_id - latest_nns_proposal_in_cache;

  // Keep fetching proposals as long as there are proposals left to be fetched
  while (proposal_left_to_fetch > 0) {
    console.log(`Fetching ${proposal_left_to_fetch} proposals`)
    // The maximum number of proposals is limited by the NNS
    let limit = Math.min(MAX_PROPOSALS_PER_REQUEST, proposal_left_to_fetch);

    // The starting point of the interval is the lowest proposal id that has not yet been fetched plus the range length
    let offset = proposal_left_to_fetch - limit;
    (await get_proposals_interval(limit, offset))
      .filter((p: Proposal) => p.title ? !EXCLUDED_TOPICS.includes(p.title) : false)
      .forEach((p: Proposal) => cache.proposals[p.id] = p);

    // Pump the lowest proposal id by the range length
    proposal_left_to_fetch -= limit;
    if (proposal_left_to_fetch < 9000) {
      proposal_left_to_fetch = 0
    }
  }
  return cache;
}

/**
 * Given a Government Cache this function will check all proposals in the last 12 weeks for an update in their state. 
 * Unless a prposal has reached a terminal state, it will be updated, given it was created in the past 12 weeks.
 * @param {GovCache} cache
 * @returns {Promise<GovCache>}
 */
async function update_recent_proposals(cache: GovCache): Promise<GovCache> {
  if (!cache.proposals) cache.proposals = {};
  // Get current UNIX timestamp in seconds
  const now = Math.floor(Date.now() / 1000);
  // 12 weeks in seconds
  let time_frame = 12 * 7 * 24 * 60 * 60
  // There are two proposal states that are terminal
  let terminal_proposal_states = ["EXECUTED", "FAILED", "REJECTED"];

  // Go through all proposals in the past 12 weeks and update those which have not yet reached a terminal state
  let proposal_ids = Object.keys(cache.proposals);
  proposal_ids.reverse();

  await PromisePool.withConcurrency(42)
    .for(proposal_ids)
    .process(async (key) => {
      let current_proposal = cache.proposals[key];
      // If the current proposal was created more than 12 weeks ago, the updating process is completed
      if (current_proposal.start + time_frame < now)
        return

      // Only update those proposals which have not reached a terminal state yet
      if (!terminal_proposal_states.includes(current_proposal.state)) {
        cache.proposals[key] = await get_nns_proposal(parseInt(key));
      }
    });

  return cache;
}

const GOV_ID = 'icp'

export async function addICPProposals(overview: any = {}) {
  let cache = await getCompound(GOV_ID)
  await update_internet_computer_cache(cache as any)
  cache.metadata = {
    "id": "internet-computer",
    "type": "ICP",
    "tokens": [
      {
        "id": "ICP",
        "type": "other",
        "name": "Internet Computer",
        "symbol": "ICP",
        "supply": HARDCODED_SUPPLY,
        "decimals": 8
      }
    ],
    "strategies": [{
      "name": "erc20-balance-of",
      "network": "ICP",
    }],
    "name": "Internet Computer",
    "slug": "icp",
    "network": "icp",
    "chainName": "ICP",
    "symbol": "ICP",
  }
  cache.id = GOV_ID
  updateStats(cache, overview, cache.id)
  if (overview[cache.id]) {
    Object.values(overview[cache.id].months ?? {}).forEach((month: any) => delete month.proposals)
  }
  await setCompound(cache.id, cache)
  return overview
}
