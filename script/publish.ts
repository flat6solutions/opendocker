#!/usr/bin/env bun

import { $ } from "bun"
import { Script } from "../packages/script/src/index.ts"
import { fileURLToPath } from "url"


console.log("=== publishing ===\n")


const pkgjsons = await Array.fromAsync(
  new Bun.Glob("**/package.json").scan({
    absolute: true,
  }),
).then((arr) => arr.filter((x) => !x.includes("node_modules") && !x.includes("dist")))


for (const file of pkgjsons) {
  let pkg = await Bun.file(file).text()
  pkg = pkg.replaceAll(/"version": "[^"]+"/g, `"version": "${Script.version}"`)
  console.log("updated:", file)
  await Bun.file(file).write(pkg)
}


await $`bun install`


console.log("\n=== build ===\n")
await $`bun run scripts/build.ts --all`.cwd("packages/cli")


console.log("\n=== cli ===\n")
await import(`../packages/cli/scripts/publish.ts`)


if (Script.release) {
  await $`git commit -am "release: v${Script.version}"`
  await $`git tag v${Script.version}`
  await $`git push origin main --tags`
  await $`gh release edit v${Script.version} --draft=false --repo ${process.env.GH_REPO}`
}


console.log("\n=== done ===")
console.log(`Released v${Script.version}`)
