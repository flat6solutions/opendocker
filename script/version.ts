#!/usr/bin/env bun

import { Script } from "../packages/script/src/index.ts"
import { $ } from "bun"
import { buildNotes, getLatestRelease } from "./changelog"


const output = [`version=${Script.version}`]


const previous = await getLatestRelease()
const notes = await buildNotes(previous, "HEAD")
const body = notes.join("\n") || "No notable changes"
const dir = process.env.RUNNER_TEMP ?? "/tmp"
const file = `${dir}/opendocker-release-notes.txt`
await Bun.write(file, body)
await $`gh release create v${Script.version} -d --title "v${Script.version}" --notes-file ${file}`
const release = await $`gh release view v${Script.version} --json tagName,databaseId`.json()
output.push(`release=${release.databaseId}`)
output.push(`tag=${release.tagName}`)


output.push(`repo=${process.env.GH_REPO ?? "flat6solutions/opendocker"}`)


if (process.env.GITHUB_OUTPUT) {
  await Bun.write(process.env.GITHUB_OUTPUT, output.join("\n"))
}


console.log("\n=== done ===")
console.log(`Prepared release v${Script.version} (draft)`)
