#!/usr/bin/env bun

import { $ } from "bun"
import { Script } from "../packages/script/src/index.ts"


async function main() {
  console.log("=== publish ===\n")
  const tag = `v${Script.version}`


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


  console.log("\n=== git tag ===\n")
  await $`git fetch --force --tags`
  const remoteTag = await $`git ls-remote --tags origin ${tag}`.text()
  if (!remoteTag.trim()) {
    const localTag = await $`git tag --list ${tag}`.text()
    if (!localTag.trim()) {
      await $`git tag ${tag}`
      console.log(`Created ${tag}`)
    }
    await $`git push origin ${tag}`
    console.log(`Pushed ${tag}`)
  } else {
    console.log(`${tag} already on origin`)
  }


  console.log("\n=== github release ===\n")
  const archives = await Array.fromAsync(
    new Bun.Glob("*.{tar.gz,zip}").scan({ cwd: distDir, absolute: true })
  )
  await $`gh release upload ${tag} --clobber ${archives}`
  await $`gh release edit ${tag} --draft=false`


  console.log("\n=== done ===")
  console.log(`Released ${tag}`)
}


await main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
