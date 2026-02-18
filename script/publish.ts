#!/usr/bin/env bun

import { $ } from "bun"
import { Script } from "../packages/script/src/index.ts"

async function main() {
  console.log("=== publish ===\n")

  console.log("=== build ===\n")
  await $`bun run build`.cwd("packages/cli")

  console.log("\n=== publish to npm ===\n")
  await import("../packages/cli/scripts/publish.ts")

  const rootDir = new URL("..", import.meta.url).pathname
  process.chdir(rootDir)

  console.log("\n=== creating archives ===\n")
  const distDir = new URL("../packages/cli/dist", import.meta.url).pathname
  const dirs = await Array.fromAsync(
    new Bun.Glob("opendocker-*").scan({ cwd: distDir, onlyFiles: false })
  ).then((arr) => arr.filter((d) => !d.includes(".") && d !== "opendocker"))

  for (const dir of dirs) {
    const fullPath = `${distDir}/${dir}`
    if (dir.includes("linux")) {
      await $`tar -czf ${distDir}/${dir}.tar.gz -C ${fullPath}/bin .`
      console.log(`Created ${dir}.tar.gz`)
    } else {
      await $`zip -rj ${distDir}/${dir}.zip ${fullPath}/bin/`
      console.log(`Created ${dir}.zip`)
    }
  }

  console.log("\n=== github release ===\n")
  const archives = await Array.fromAsync(
    new Bun.Glob("*.{tar.gz,zip}").scan({ cwd: distDir, absolute: true })
  )
  await $`gh release upload v${Script.version} --clobber ${archives}`
  await $`gh release edit v${Script.version} --draft=false`

  console.log("\n=== done ===")
  console.log(`Released v${Script.version}`)
}

await main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
