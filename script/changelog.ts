#!/usr/bin/env bun

import { $ } from "bun"

const team = ["opendocker", "votsuk"] // Add your team GitHub usernames

export async function getLatestRelease(): Promise<string> {
  return fetch("https://api.github.com/repos/votsuk/opendocker/releases/latest")
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
    .then((data: any) => data.tag_name.replace(/^v/, ""))
    .catch(() => "0.0.0")
}

type Commit = {
  hash: string
  author: string | null
  message: string
}

export async function getCommits(from: string, to: string): Promise<Commit[]> {
  const fromRef = from === "0.0.0" ? "" : from.startsWith("v") ? from : `v${from}`
  const toRef = to === "HEAD" ? to : to.startsWith("v") ? to : `v${to}`

  let compare = ""
  try {
    if (fromRef) {
      compare = await $`gh api "/repos/votsuk/opendocker/compare/${fromRef}...${toRef}" --jq '.commits[] | {sha: .sha, login: .author.login, message: .commit.message}'`.text()
    } else {
      // First release - get all commits
      compare = await $`gh api "/repos/votsuk/opendocker/commits?per_page=100" --jq '.[] | {sha: .sha, login: .author.login, message: .commit.message}'`.text()
    }
  } catch {
    console.log("Could not fetch commits from GitHub API")
    return []
  }

  const commits: Commit[] = []

  for (const line of compare.split("\n").filter(Boolean)) {
    try {
      const data = JSON.parse(line) as { sha: string; login: string | null; message: string }
      const message = data.message.split("\n")[0] ?? ""

      // Skip certain commit types
      if (message.match(/^(release:|chore:|ci:|test:)/i)) continue

      commits.push({
        hash: data.sha.slice(0, 7),
        author: data.login,
        message,
      })
    } catch {
      // Skip malformed JSON lines
    }
  }

  return commits
}

async function summarizeWithOpenCode(commits: Commit[]): Promise<string[]> {
  const apiKey = process.env.OPENCODE_API_KEY
  if (!apiKey) {
    console.log("No OPENCODE_API_KEY, using raw commit messages")
    return commits.map((c) => {
      const attribution = c.author && !team.includes(c.author) ? ` (@${c.author})` : ""
      return `- ${c.message}${attribution}`
    })
  }

  console.log("Summarizing commits with OpenCode...")

  // Use OpenCode API to summarize commits
  const response = await fetch("https://api.opencode.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      messages: [
        {
          role: "user",
          content: `Summarize these git commits for a changelog. Return a markdown bullet list with concise, user-friendly descriptions. Group similar changes. Do not include commit hashes. Start each line with "- ".

Commits:
${commits.map((c) => `- ${c.message}`).join("\n")}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    console.log("OpenCode API error, using raw commits")
    return commits.map((c) => `- ${c.message}`)
  }

  const data = (await response.json()) as any
  const content = data.choices?.[0]?.message?.content ?? ""

  // Extract bullet points from response
  const lines = content
    .split("\n")
    .filter((l: string) => l.trim().startsWith("-"))
    .map((l: string) => l.trim())

  // Add attributions for external contributors
  const contributors = [...new Set(commits.filter((c) => c.author && !team.includes(c.author)).map((c) => c.author))]

  if (contributors.length > 0) {
    lines.push("")
    lines.push(`**Contributors:** ${contributors.map((c) => `@${c}`).join(", ")}`)
  }

  return lines
}

export async function buildNotes(from: string, to: string): Promise<string[]> {
  const commits = await getCommits(from, to)

  if (commits.length === 0) {
    return ["No notable changes"]
  }

  console.log(`Generating changelog for ${commits.length} commits since v${from}`)
  return summarizeWithOpenCode(commits)
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
