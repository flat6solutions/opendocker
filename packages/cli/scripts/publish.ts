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

// Import binaries from build script (already ran)
const distDir = path.join(dir, "dist")
const platformDirs = fs.readdirSync(distDir).filter((name) => {
  const fullPath = path.join(distDir, name)
  const stat = fs.statSync(fullPath)
  return stat.isDirectory() && name.startsWith("opendocker-")
})

console.log(`Found ${platformDirs.length} platform packages`)

// Build the optionalDependencies map
const optionalDependencies: Record<string, string> = {}
for (const platformName of platformDirs) {
  optionalDependencies[platformName] = version
}

// Prepare the main package directory
const mainPkgDir = path.join(distDir, pkg.name)
await $`mkdir -p ${mainPkgDir}`

// Copy the bin directory (contains wrapper script)
await $`cp -r ./bin ${mainPkgDir}/bin`

// Copy the postinstall script
await $`cp ${path.join(__dirname, "postinstall.mjs")} ${mainPkgDir}/postinstall.mjs`

// Create the main package.json with optionalDependencies
await Bun.file(path.join(mainPkgDir, "package.json")).write(
  JSON.stringify(
    {
      name: pkg.name,
      version: version,
      description: pkg.description || "A CLI tool for managing Docker",
      bin: {
        [pkg.name]: `./bin/${pkg.name}`,
      },
      scripts: {
        postinstall: "node ./postinstall.mjs",
      },
      optionalDependencies,
    },
    null,
    2,
  )
)

console.log("Created main package with optionalDependencies:")
console.log(JSON.stringify(optionalDependencies, null, 2))

// Publish platform-specific packages first (in parallel)
const publishTasks = platformDirs.map(async (platformName) => {
  const platformDir = path.join(distDir, platformName)

  // Ensure binary is executable
  if (process.platform !== "win32") {
    await $`chmod -R 755 .`.cwd(platformDir)
  }

  console.log(`Publishing ${platformName}@${version}...`)

  try {
    await $`npm publish --access public`.cwd(platformDir)
    console.log(`  ✓ ${platformName}`)
  } catch (error) {
    const errorMessage = String(error)
    if (errorMessage.includes("403") || errorMessage.includes("cannot publish over")) {
      console.log(`  ✓ ${platformName} (already published)`)
    } else {
      throw error
    }
  }
})

await Promise.all(publishTasks)

// Publish main package last
console.log(`\nPublishing ${pkg.name}@${version}...`)
try {
  await $`npm publish --access public`.cwd(mainPkgDir)
  console.log(`✓ ${pkg.name}@${version}`)
} catch (error) {
  const errorMessage = String(error)
  if (errorMessage.includes("403") || errorMessage.includes("cannot publish over")) {
    console.log(`✓ ${pkg.name}@${version} (already published)`)
  } else {
    throw error
  }
}

console.log(`\nPublish complete!`)
