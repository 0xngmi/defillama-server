import protocols from "../protocols/data";
import { writeFileSync, readdirSync } from "fs"

writeFileSync("./src/utils/imports/adapters.ts",
    `export default {
    ${protocols.map(p => `"${p.module}": require("@defillama/adapters/projects/${p.module}"),`).join('\n')}
}`)

const excludeLiquidation = ["test.ts", "utils", "README.md"]
writeFileSync("./src/utils/imports/adapters_liquidations.ts",
    `export default {
    ${readdirSync("./DefiLlama-Adapters/liquidations").filter(f => !excludeLiquidation.includes(f))
        .map(f => `"${f}": require("@defillama/adapters/liquidations/${f}"),`).join('\n')}
}`)


// For adapters type adaptor
function getDirectories(source: string) {
    return readdirSync(source, { withFileTypes: true })
        .map(dirent => dirent.name)
}

function removeDotTs(s: string) {
    const splitted = s.split('.')
    if (splitted.length > 1)
        splitted.pop()
    return splitted.join('.')
}

const importPaths = [
    {
        basePackagePath: "@defillama/adaptors", // how is defined in package.json
        baseFolderPath: "./adapters", // path relative to current working directory -> `cd /defi`
        folderPath: "volumes", // path relative to baseFolderPath
        excludeKeys: ["README"]
    },
    {
        basePackagePath: "@defillama/adaptors",
        baseFolderPath: "./adapters",
        folderPath: "fees",
        excludeKeys: []
    }
]

for (const importPath of importPaths) {
    const paths_keys = getDirectories(`${importPath.baseFolderPath}/${importPath.folderPath}`).map(removeDotTs).filter(key => !importPath.excludeKeys.includes(key))
    writeFileSync(`./src/utils/imports/adapters_${importPath.folderPath.replace("/", "_")}.ts`,
        `
        import { Adapter } from "@defillama/adaptors/adapters/types";
        export default {
        ${paths_keys.map(path => `"${path}": require("${importPath.basePackagePath}/${importPath.folderPath}/${path}"),`).join('\n')}
        } as {[key:string]: {default: Adapter} }`)
}