import { updateSnapshots, } from './snapshot'
import { updateTallys, } from './tally'
import { updateCompounds, } from './compound'

main().then(() => {
  console.log('done!')
  process.exit(0)
})

async function main() {
  await Promise.all([
    updateTallys(),
    updateSnapshots(),
    updateCompounds(),
  ])
}