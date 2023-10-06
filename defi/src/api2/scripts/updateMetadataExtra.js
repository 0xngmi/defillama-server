const metadata = require('../metadata.json')
const fs = require('fs')

updateItemInfo(metadata.protocols)
updateItemInfo(metadata.treasuries)
updateItemInfo(metadata.entities)
fs.writeFileSync(__dirname + '/../metadata.json', JSON.stringify(metadata))


function updateItemInfo(protocols) {
  for (const protocol of protocols) {
    if (!protocol.module || protocol.module === 'dummy.js') {
      protocol.misrepresentedTokens = false
      protocol.hallmarks = []
      continue
    }

    try {
      const module = require('@defillama/adapters/projects/' + protocol.module)
      protocol.misrepresentedTokens = module.misrepresentedTokens
      protocol.hallmarks = module.hallmarks
    } catch (e) {
      console.error(e)
    }
  }
}
