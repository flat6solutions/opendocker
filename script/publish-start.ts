#!/usr/bin/env bun

import { $ } from "bun"
import { Script } from "../packages/script/src/index.ts"
import { buildNotes, getLatestRelease } from "./changelog"

let notes: string[] = []

console.log("=== publishing ===\n")

const previous = await getLatestRelease()
notes = await buildNotes(previous, "HEAD")

// Update package.json version
const pkgPath = new URL("../packages/cli/package.json", import.meta.url).pathname
let pkg = await Bun.file(pkgPath).json()
pkg.version = Script.version
await Bun.file(pkgPath).write(JSON.stringify(pkg, null, 2) + "\n")
console.log(`Updated version to ${Script.version}`)

// Build
console.log("\n=== build ===\n")
await $`bun run build`.cwd("packages/cli")

// Publish to npm
console.log("\n=== publish to npm ===\n")
await import("../packages/cli/scripts/publish.ts")

// Restore working directory after publish script (which may have changed it)
const rootDir = new URL("..", import.meta.url).pathname
process.chdir(rootDir)

// Create archives for GitHub release
console.log("\n=== creating archives ===\n")
const distDir = new URL("../packages/cli/dist", import.meta.url).pathname

const dirs = await Array.fromAsync(
  new Bun.Glob("opendocker-*").scan({ cwd: distDir, onlyFiles: false })
).then((arr) => arr.filter((d) => !d.includes(".") && d !== "opendocker")) // Filter out archive files and main package

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

// Git commit, tag, and push
console.log("\n=== git ===\n")
await $`git commit -am "release: v${Script.version}"`
await $`git tag v${Script.version}`
await $`git push origin HEAD --tags`
await new Promise((resolve) => setTimeout(resolve, 5_000))

// Create draft GitHub release
console.log("\n=== github release ===\n")
const archives = await Array.fromAsync(
  new Bun.Glob("*.{tar.gz,zip}").scan({ cwd: distDir, absolute: true })
)

const notesContent = notes.join("\n") || "No notable changes"
await $`gh release create v${Script.version} -d --title "v${Script.version}" --notes ${notesContent} ${archives}`

const release = await $`gh release view v${Script.version} --json id,tagName`.json()

let output = `version=${Script.version}\n`
output += `release=${release.id}\n`
output += `tag=${release.tagName}\n`

if (process.env.GITHUB_OUTPUT) {
  await Bun.write(process.env.GITHUB_OUTPUT, output)
}

console.log("\n=== done ===")
console.log(`Released v${Script.version} (draft)`)
