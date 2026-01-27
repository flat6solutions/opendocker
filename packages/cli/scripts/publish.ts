#!/usr/bin/env bun

import { $ } from "bun"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"))
const version = pkg.version

console.log(`Publishing opendocker@${version}`)

// Get all platform packages from dist/
const distDir = path.join(dir, "dist")
const platformDirs = fs.readdirSync(distDir).filter((name) => {
  const fullPath = path.join(distDir, name)
  const stat = fs.statSync(fullPath)
  return stat.isDirectory() && name.startsWith("opendocker-")
})

console.log(`Found ${platformDirs.length} platform packages`)

// Update and publish platform-specific packages
for (const platformName of platformDirs) {
  const platformDir = path.join(distDir, platformName)
  const platformPkgPath = path.join(platformDir, "package.json")

  const platformPkg = JSON.parse(fs.readFileSync(platformPkgPath, "utf-8"))
  platformPkg.version = version
  fs.writeFileSync(platformPkgPath, JSON.stringify(platformPkg, null, 2) + "\n")

  console.log(`Publishing ${platformName}@${version}...`)

  try {
    await $`npm publish --access public`.cwd(platformDir)
    console.log(`  ${platformName}`)
  } catch (error) {
    const errorMessage = String(error)
    if (errorMessage.includes("403") || errorMessage.includes("cannot publish over")) {
      console.log(`  ${platformName} (already published)`)
    } else {
      throw error
    }
  }
}

// Publish main package
console.log(`\nPublishing opendocker@${version}...`)
try {
  await $`npm publish --access public`.cwd(dir)
  console.log(`opendocker@${version}`)
} catch (error) {
  const errorMessage = String(error)
  if (errorMessage.includes("403") || errorMessage.includes("cannot publish over")) {
    console.log(`opendocker@${version} (already published)`)
  } else {
    throw error
  }
}

console.log(`\nPublish complete!`)
