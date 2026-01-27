#!/usr/bin/env bun

import { $ } from "bun"
import { Script } from "../packages/script/src/index.ts"

console.log(`Undrafting release v${Script.version}...`)
await $`gh release edit v${Script.version} --draft=false`
console.log(`Release v${Script.version} is now public!`)
