#!/usr/bin/env bun

import { $ } from "bun"
import { createOpencode } from "@opencode-ai/sdk"

const repo = process.env.GITHUB_REPOSITORY ?? "flat6solutions/opendocker"

export async function getLatestRelease(): Promise<string> {
  return fetch(`https://api.github.com/repos/${repo}/releases/latest`)
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
    .then((data: any) => data.tag_name.replace(/^v/, ""))
    .catch(() => "0.0.0")
}

type Commit = {
  hash: string
  message: string
}

export async function getCommits(from: string, to: string): Promise<Commit[]> {
  const fromRef = from === "0.0.0" ? "" : from.startsWith("v") ? from : `v${from}`
  const toRef = to === "HEAD" ? to : to.startsWith("v") ? to : `v${to}`

  let compare = ""
  try {
    if (fromRef) {
      compare = await $`gh api "/repos/${repo}/compare/${fromRef}...${toRef}" --jq '.commits[] | {sha: .sha, message: .commit.message}'`.text()
    } else {
      // First release - get all commits
      compare = await $`gh api "/repos/${repo}/commits?per_page=100" --jq '.[] | {sha: .sha, message: .commit.message}'`.text()
    }
  } catch {
    console.log("Could not fetch commits from GitHub API")
    return []
  }

  const commits: Commit[] = []

  for (const line of compare.split("\n").filter(Boolean)) {
    try {
      const data = JSON.parse(line) as { sha: string; message: string }
      const message = data.message.split("\n")[0] ?? ""

      // Skip certain commit types
      if (message.match(/^(release:|chore:|ci:|test:)/i)) continue

      commits.push({
        hash: data.sha.slice(0, 7),
        message,
      })
    } catch {
      // Skip malformed JSON lines
    }
  }

  return commits
}

async function summarizeCommit(
  opencode: Awaited<ReturnType<typeof createOpencode>>,
  message: string
): Promise<string> {
  console.log("Summarizing commit:", message)
  const session = await opencode.client.session.create()
  const result = await opencode.client.session
    .prompt({
      path: { id: session.data!.id },
      body: {
        model: { providerID: "opencode", modelID: "claude-sonnet-4-5" },
        tools: {
          "*": false,
        },
        parts: [
          {
            type: "text",
            text: `Summarize this commit message for a changelog entry. Return ONLY a single line summary starting with a capital letter. Be concise but specific. If the commit message is already well-written, just clean it up (capitalize, fix typos, proper grammar). Do not include any prefixes like "fix:" or "feat:".


Commit: ${message}`,
          },
        ],
      },
      signal: AbortSignal.timeout(120_000),
    })
    .then((x) => x.data?.parts?.find((y) => y.type === "text")?.text ?? message)
  return result.trim()
}

function getRawChangelog(commits: Commit[]): string[] {
  const lines: string[] = []
  for (const commit of commits) {
    lines.push(`- ${commit.message}`)
  }
  return lines
}

async function summarizeWithOpenCode(commits: Commit[]): Promise<string[]> {
  console.log("Summarizing commits with OpenCode SDK...")

  const opencode = await createOpencode({ port: 0 })
  const lines: string[] = []
  const summarizeStart = Bun.nanoseconds()

  try {
    // Summarize commits in parallel with max 5 concurrent requests
    const BATCH_SIZE = 5
    const summaries: string[] = []

    for (let i = 0; i < commits.length; i += BATCH_SIZE) {
      const batch = commits.slice(i, i + BATCH_SIZE)
      const results = await Promise.all(batch.map((c) => summarizeCommit(opencode, c.message)))
      summaries.push(...results)
    }
    console.log(`Summarized ${summaries.length} commits in ${Math.round((Bun.nanoseconds() - summarizeStart) / 1_000_000)}ms`)

    for (let i = 0; i < commits.length; i++) {
      lines.push(`- ${summaries[i]}`)
    }

    console.log("---- Generated Changelog ----")
    console.log(lines.join("\n"))
    console.log("-----------------------------")
    console.log(`Changelog formatting complete in ${Math.round((Bun.nanoseconds() - summarizeStart) / 1_000_000)}ms`)
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.log("Changelog generation timed out, using raw commits")
      return getRawChangelog(commits)
    }
    throw error
  } finally {
    await opencode.server.close()
    console.log("OpenCode SDK server closed")
  }

  return lines
}

export async function buildNotes(from: string, to: string): Promise<string[]> {
  const commits = await getCommits(from, to)

  if (commits.length === 0) {
    return ["No notable changes"]
  }

  console.log(`Generating changelog for ${commits.length} commits since v${from}`)

  try {
    return await summarizeWithOpenCode(commits)
  } catch (error) {
    console.log("OpenCode SDK error, falling back to raw commits:", error)
    return getRawChangelog(commits)
  }
}

// CLI entrypoint
if (import.meta.main) {
  const from = process.argv[2] || (await getLatestRelease())
  const to = process.argv[3] || "HEAD"

  console.log(`Generating changelog: v${from} -> ${to}\n`)

  const notes = await buildNotes(from, to)
  console.log("\n=== Changelog ===")
  console.log(notes.join("\n"))
}
