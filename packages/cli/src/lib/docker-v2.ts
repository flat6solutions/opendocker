import { access, readdir } from "node:fs/promises"
import http from "node:http"
import { homedir } from "node:os"
import { join } from "node:path"
import { z } from "zod"

export namespace DockerV2 {
  const DEFAULT_SOCKET = "/var/run/docker.sock"
  const REQUEST_TIMEOUT_MS = 2_000
  const FALLBACK_LOCAL_SOCKETS = [
    "/var/run/docker.sock",
    join(homedir(), ".docker", "run", "docker.sock"),
  ]

  const DockerConfigSchema = z.object({
    currentContext: z.string().optional(),
  })

  const DockerContextMetaSchema = z.object({
    Name: z.string().optional(),
    Endpoints: z.object({
      docker: z.object({
        Host: z.string().optional(),
      }).optional(),
    }).optional(),
  })

  type DockerHealth = "healthy" | "unhealthy" | "starting" | "exited"

  interface DockerContainer {
    Id: string
    Names: string[]
    State: string
    Status: string
  }

  export interface ContainerV2 {
    id: string
    name: string
    state: string
    status: string
    health?: DockerHealth
  }

  async function pathExists(filePath: string): Promise<boolean> {
    return access(filePath).then(() => true).catch(() => false)
  }

  function parseJson(text: string): unknown | undefined {
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  }

  function toLocalSocketPath(host: string): string | undefined {
    if (host.startsWith("unix://")) {
      return host.slice("unix://".length)
    }

    if (host.startsWith("/")) {
      return host
    }

    return undefined
  }

  async function readDockerConfigContext(): Promise<string | undefined> {
    const configPath = join(homedir(), ".docker", "config.json")
    const raw: unknown = await Bun.file(configPath).json().catch(() => undefined)
    const parsed = DockerConfigSchema.safeParse(raw)

    if (!parsed.success) {
      return undefined
    }

    const context = parsed.data.currentContext?.trim()
    return context && context.length > 0 ? context : undefined
  }

  async function readContextSocket(contextName: string): Promise<string | undefined> {
    const metaRoot = join(homedir(), ".docker", "contexts", "meta")
    const dirs = await readdir(metaRoot, { withFileTypes: true }).catch(() => [])

    for (const dir of dirs) {
      if (!dir.isDirectory()) {
        continue
      }

      const metaPath = join(metaRoot, dir.name, "meta.json")
      const raw: unknown = await Bun.file(metaPath).json().catch(() => undefined)
      const parsed = DockerContextMetaSchema.safeParse(raw)

      if (!parsed.success) {
        continue
      }

      if (parsed.data.Name !== contextName) {
        continue
      }

      const host = parsed.data.Endpoints?.docker?.Host
      if (!host) {
        continue
      }

      const socketPath = toLocalSocketPath(host)
      if (!socketPath) {
        return undefined
      }

      if (await pathExists(socketPath)) {
        return socketPath
      }
    }

    return undefined
  }

  function inferHealth(status: string): DockerHealth | undefined {
    const normalized = status.toLowerCase()

    if (normalized.includes("unhealthy")) {
      return "unhealthy"
    }

    if (normalized.includes("health: starting") || normalized.includes("(starting)")) {
      return "starting"
    }

    if (normalized.includes("healthy")) {
      return "healthy"
    }

    return undefined
  }

  async function request(socketPath: string, path: string, method: string = "GET"): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = http.request({ socketPath, path, method }, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })

        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Docker API ${res.statusCode}: ${data}`))
            return
          }

          if (!data.trim()) {
            reject(new Error("Docker API returned empty response"))
            return
          }

          const parsed = parseJson(data)
          if (parsed === undefined) {
            reject(new Error("Docker API returned invalid JSON"))
            return
          }

          resolve(parsed)
        })
      })

      req.on("error", reject)
      req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        req.destroy(new Error(`Docker request timed out after ${REQUEST_TIMEOUT_MS}ms`))
      })
      req.end()
    })
  }

  export async function getSocket(): Promise<string> {
    const dockerHost = process.env.DOCKER_HOST?.trim()
    const envSocket = dockerHost ? toLocalSocketPath(dockerHost) : undefined

    if (envSocket && await pathExists(envSocket)) {
      return envSocket
    }

    const contextName = await readDockerConfigContext()
    if (contextName && contextName !== "default") {
      const contextSocket = await readContextSocket(contextName)
      if (contextSocket) {
        return contextSocket
      }
    }

    for (const candidate of FALLBACK_LOCAL_SOCKETS) {
      if (await pathExists(candidate)) {
        return candidate
      }
    }

    return DEFAULT_SOCKET
  }

  export async function getContainers(): Promise<ContainerV2[]> {
    const socketPath = await getSocket()
    const raw = await request(socketPath, "/containers/json?all=1")
    const parsed = z.array(z.object({
      Id: z.string(),
      Names: z.array(z.string()),
      State: z.string(),
      Status: z.string(),
    })).safeParse(raw)

    if (!parsed.success) {
      return []
    }

    return parsed.data
      .map((container: DockerContainer): ContainerV2 => {
        const primaryName = container.Names[0] ?? container.Id.slice(0, 12)
        return {
          id: container.Id,
          name: primaryName.replace(/^\//, ""),
          state: container.State,
          status: container.Status,
          health: inferHealth(container.Status),
        }
      })
      .sort((a, b) => {
        if (a.state === "running" && b.state !== "running") return -1
        if (b.state === "running" && a.state !== "running") return 1
        return a.name.localeCompare(b.name)
      })
  }
}
