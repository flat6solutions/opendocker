#!/usr/bin/env bun

import { $ } from "bun"
import { Script } from "../packages/script/src/index.ts"
import { buildNotes, getLatestRelease } from "./changelog"

console.log("=== version ===\n")

const previous = await getLatestRelease()
const notes = await buildNotes(previous, "HEAD")

console.log("\n=== github release draft ===\n")
const notesContent = notes.join("\n") || "No notable changes"
const dir = process.env.RUNNER_TEMP ?? "/tmp"
const file = `${dir}/opendocker-release-notes.txt`
await Bun.write(file, notesContent)
await $`gh release create v${Script.version} -d --title "v${Script.version}" --notes-file ${file}`

const release = await $`gh release view v${Script.version} --json id,tagName`.json()

const output = [`version=${Script.version}`, `release=${release.id}`, `tag=${release.tagName}`].join("\n")
if (process.env.GITHUB_OUTPUT) {
  await Bun.write(process.env.GITHUB_OUTPUT, output)
}

console.log("\n=== done ===")
console.log(`Prepared release v${Script.version} (draft)`)

process.exit(0)
