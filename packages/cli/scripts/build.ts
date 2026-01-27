#!/usr/bin/env bun

import solidPlugin from "../node_modules/@opentui/solid/scripts/solid-plugin"
import path from "path"
import fs from "fs"
import { $ } from "bun"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

process.chdir(dir)

import pkg from "../package.json"

const singleFlag = process.argv.includes("--single")
const skipInstall = process.argv.includes("--skip-install")

const allTargets: {
  os: string
  arch: "arm64" | "x64"
  abi?: "musl"
  avx2?: false
}[] = [
  {
    os: "linux",
    arch: "arm64",
  },
  {
    os: "linux",
    arch: "x64",
  },
  {
    os: "linux",
    arch: "x64",
    avx2: false,
  },
  {
    os: "linux",
    arch: "arm64",
    abi: "musl",
  },
  {
    os: "linux",
    arch: "x64",
    abi: "musl",
  },
  {
    os: "linux",
    arch: "x64",
    abi: "musl",
    avx2: false,
  },
  {
    os: "darwin",
    arch: "arm64",
  },
  {
    os: "darwin",
    arch: "x64",
  },
  {
    os: "darwin",
    arch: "x64",
    avx2: false,
  },
  {
    os: "win32",
    arch: "x64",
  },
  {
    os: "win32",
    arch: "x64",
    avx2: false,
  },
]

const targets = singleFlag
  ? allTargets.filter((item) => item.os === process.platform && item.arch === process.arch)
  : allTargets

console.log(`Building OpenDocker v${pkg.version}`)
console.log(`Target platforms: ${targets.length}`)
console.log("")

await $`rm -rf dist`

const binaries: Record<string, string> = {}

// Install platform-specific dependencies if needed
if (!skipInstall) {
  console.log("Installing platform-specific dependencies...")
  await $`bun install --os="*" --cpu="*" @opentui/core@${pkg.dependencies["@opentui/core"]}`
  await $`bun install --os="*" --cpu="*" @opentui/solid@${pkg.dependencies["@opentui/solid"]}`
  console.log("")
}

for (const item of targets) {
  const name = [
    pkg.name,
    // changing to windows instead of win32 for npm compatibility
    item.os === "win32" ? "windows" : item.os,
    item.arch,
    item.avx2 === false ? "baseline" : undefined,
    item.abi === undefined ? undefined : item.abi,
  ]
    .filter(Boolean)
    .join("-")
  
  console.log(`Building ${name}...`)
  await $`mkdir -p dist/${name}/bin`

  const parserWorker = fs.realpathSync(path.resolve(dir, "./node_modules/@opentui/core/parser.worker.js"))

  // Use platform-specific bunfs root path based on target OS
  const bunfsRoot = item.os === "win32" ? "B:/~BUN/root/" : "/$bunfs/root/"
  const workerRelativePath = path.relative(dir, parserWorker).replaceAll("\\", "/")

  // Windows executables need .exe extension
  const exeExtension = item.os === "win32" ? ".exe" : ""

  const result = await Bun.build({
    conditions: ["browser"],
    tsconfig: "./tsconfig.json",
    plugins: [solidPlugin],
    sourcemap: "external",
    compile: {
      autoloadBunfig: false,
      autoloadDotenv: false,
      target: name.replace(pkg.name, "bun").replace("windows", "win32") as any,
      outfile: `dist/${name}/bin/opendocker${exeExtension}`,
      execArgv: ["--"],
      windows: {},
    },
    entrypoints: ["./src/index.tsx", parserWorker],
    define: {
      OPENDOCKER_VERSION: `'${pkg.version}'`,
      OTUI_TREE_SITTER_WORKER_PATH: bunfsRoot + workerRelativePath,
    },
  })

  if (!result.success) {
    console.error(`Failed to build ${name}`)
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }

  await Bun.file(`dist/${name}/package.json`).write(
    JSON.stringify(
      {
        name,
        version: pkg.version,
        os: [item.os],
        cpu: [item.arch],
      },
      null,
      2,
    ),
  )
  binaries[name] = pkg.version
  console.log(`✓ ${name} built successfully`)
}

console.log("")
console.log("Build complete!")
console.log(`Built ${Object.keys(binaries).length} platform(s)`)

export { binaries }
