import protocols from '../protocols/data'
import parentProtocols from '../protocols/parentProtocols'
import { sliceIntoChunks } from '@defillama/sdk/build/util/index'
import { graphURL, metadataQuery, proposalQuery, } from './snapshotQueries'
import axios from 'axios'
import { getSnapshot, setSnapshot } from './cache'
import * as sdk from '@defillama/sdk'

export interface SnapshotCache {
  id: string;
  metadata: { [key: string]: any };
  proposals: { [key: string]: Proposal };
  stats?: { [key: string]: any };
}
export interface Proposal {
  id: string;
  state: string;
  space: any;
  scores: number[];
  scores_total: number;
  score_skew: number;
  start: number;
  month: string;
  strategies?: any;
}


export function getSnapshotIds() {
  const governance: string[] = protocols.filter(i => i.governanceID && i.governanceID![0]!.startsWith('snapshot')).map(i => i.governanceID![0])
  const parentProtocolsGov: string[] = parentProtocols.filter(i => i.governanceID && i.governanceID![0]!.startsWith('snapshot')).map(i => i.governanceID![0])

  governance.push(...parentProtocolsGov)
  const ids = governance.map(i => i.replace('snapshot:', ''))
  return [...new Set(ids)]
}


export async function getSnapshotMetadata(ids: string[]) {
  const { data: { data: { spaces, } } } = await axios.post(graphURL, {
    query: metadataQuery,
    operationName: 'Spaces',
    variables: { ids },
  }, {
    headers: {
      'ContentType': 'application/json',
    }
  })
  return spaces
}

export async function getProposals(ids: string[], recent?: boolean) {
  if (!ids.length) return []
  const ONE_WEEK = 7 * 24 * 3600
  const allProposals: Proposal[] = []
  const length = 1000
  let fetchAgain = false
  const variables: any = { ids, skip: 0, }
  if (recent) variables.startFrom = Math.floor(+Date.now() / 1e3 - ONE_WEEK)
  do {
    const { data: { data: { proposals, } } } = await axios.post(graphURL, {
      query: proposalQuery,
      operationName: 'Proposals',
      variables,
    }, {
      headers: {
        'ContentType': 'application/json',
      }
    })
    fetchAgain = proposals?.length === length
    if (fetchAgain)
      variables.skip += length
    allProposals.push(...proposals)
  } while (fetchAgain)
  return allProposals
}

export async function updateSnapshots() {
  const idsAll = getSnapshotIds()
  console.log('snapshot gov#', idsAll.length)
  const idChunks = sliceIntoChunks(idsAll, 31)
  for (const ids of idChunks) {
    const metadataAll = await getSnapshotMetadata(ids)
    const caches: SnapshotCache[] = await Promise.all(ids.map(getSnapshot))
    const idMap: { [key: string]: SnapshotCache } = {}
    ids.forEach((id, i) => idMap[id] = caches[i])
    const firstFetchIds: string[] = []
    const fetchOnlyProposals: string[] = []
    metadataAll.forEach((v: any) => {
      idMap[v.id].metadata = v
      idMap[v.id].id = v.id
      if (!idMap[v.id].proposals) firstFetchIds.push(v.id)
      else fetchOnlyProposals.push(v.id)
    })

    for (const id of firstFetchIds) await addAllProposals(idMap[id])
    const recentProposals = await getProposals(fetchOnlyProposals, true)
    recentProposals.forEach(i => {
      const proposals = idMap[i.space.id].proposals!
      proposals[i.id] = { ...(proposals[i.id] ?? {}), ...i }
    })
    Object.values(idMap).map(updateStats)
    await Promise.all(fetchOnlyProposals.map(id => setSnapshot(id, idMap[id])))
  }
}

async function addAllProposals(cache: SnapshotCache) {
  cache.proposals = {}
  const proposals = await getProposals([cache.id])
  proposals.forEach((v) => cache.proposals![v.id] = v)
  updateStats(cache)
  await setSnapshot(cache.id, cache)
}

function updateStats(cache: SnapshotCache) {
  if (!cache.proposals)  sdk.log('Updating: ', cache.id)
  if (!cache.proposals) cache.proposals = {}
  const { proposals, metadata } = cache
  const proposalsArray = Object.values(proposals)
  const stats = cache.stats ?? {}

  stats.proposalsCount = metadata.proposalsCount
  stats.followersCount = metadata.followersCount
  stats.name = metadata.name
  stats.id = metadata.id
  stats.strategyCount = metadata.strategies.length
  stats.followersCount = metadata.followersCount

  proposalsArray.forEach(i => {
    i.month = (new Date(i.start * 1000)).toISOString().slice(0, 7)
    delete i.strategies
    if (i.scores_total > 1) {
      const highestScore = max(i.scores)
      i.score_skew = highestScore! / i.scores_total
    }
  })
  stats.proposalsByDate = [...proposalsArray].sort((a, b) => b.start - a.start).map(i => i.id)
  stats.proposalsBySkew = [...proposalsArray].sort((a, b) => a.score_skew - b.score_skew).map(i => i.id)
  stats.proposalsByScore = [...proposalsArray].sort((a, b) => b.scores_total - a.scores_total).map(i => i.id)

  addStateSplit(stats, proposalsArray)
  addDateSplit(stats, proposalsArray)

  cache.stats = stats


  function addStateSplit(obj: any, arry: any) {
    obj.states = arry.reduce((acc: any, i: any) => {
      if (!acc[i.state]) acc[i.state] = 0
      acc[i.state] += 1
      return acc
    }, {})
  }

  function addDateSplit(obj: any, arry: any) {
    obj.months = arry.reduce((acc: any, i: any) => {
      if (!acc[i.month]) acc[i.month] = { proposals: [] }
      acc[i.month].proposals.push(i.id)
      return acc
    }, {})

    // get state split within each month
    Object.values(obj.months).forEach((obj: any) => {
      const _props = obj.proposals.map((i: any) => proposals[i])
      addStateSplit(obj, _props)
    })
  }
}

function max(arry: number[]) {
  return arry.reduce((prev, curr) => curr > prev ? curr : prev)
}