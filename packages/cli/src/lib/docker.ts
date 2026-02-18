import http from "http"
import type { Container, Image, Volume } from "@/context/application"

const DEFAULT_SOCKET = "/var/run/docker.sock"

interface DockerContainer {
  Id: string
  Names: string[]
  State: string
  Status: string
}

interface DockerImage {
  Id: string
  RepoTags: string[] | null
  Size: number
  Created: number
}

interface DockerVolume {
  Name: string
  Driver: string
  Scope: string
  Mountpoint: string
  Labels: Record<string, string> | null
  Options: Record<string, string> | null
  Status: Record<string, string> | null
}

export interface ImageHistoryItem {
  Id: string
  Created: number
  CreatedBy: string
  Size: number
  Comment: string
  Tags: string[] | null
}

export class Docker {
  private static instance: Docker | null = null
  private socketPath: string

  private constructor(socket: string) {
    this.socketPath = socket
  }

  public static getInstance(): Docker {
    if (!Docker.instance) {
      Docker.instance = new Docker(DEFAULT_SOCKET)
      Docker.detectAndUpdateSocket()
    }
    return Docker.instance
  }

  private static async detectAndUpdateSocket() {
    try {
      const detectedSocket = await Docker.getSocket()

      if (Docker.instance && detectedSocket !== Docker.instance.socketPath) {
        console.log(`Updating socket from ${Docker.instance.socketPath} to ${detectedSocket}`)
        Docker.instance.socketPath = detectedSocket
      }
    } catch (error) {
      console.error("Failed to detect docker socket:", error)
    }
  }

  public static async getSocket(): Promise<string> {
    try {
      const res =
        await Bun.$`docker context inspect --format '{{.Endpoints.docker.Host}}' | sed 's|unix://||'`.text()
      return res.trim() || "/var/run/docker.sock"
    } catch (error) {
      console.error("Failed to get docker socket:", error)
      return "/var/run/docker.sock"
    }
  }

  private request(path: string, method: string = "GET"): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        socketPath: this.socketPath,
        path: path,
        method: method,
      }

      const req = http.request(options, (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => {
          try {
            resolve(JSON.parse(data))
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err}`))
          }
        })
      })

      req.on("error", reject)
      req.end()
    })
  }

  public async streamContainers(): Promise<Array<Container>> {
    const containers: DockerContainer[] = await this.request("/containers/json?all=1")

    return containers
      .map((container: DockerContainer) => ({
        id: container.Id,
        name: container.Names[0].replace("/", ""),
        state: container.State,
        status: container.Status,
      }))
      .sort((a, b) => {
        if (a.state === "running" && b.state !== "running") return -1
        if (b.state === "running" && a.state !== "running") return 1
        return a.name.localeCompare(b.name)
      })
  }

  public async streamImages(): Promise<Array<Image>> {
    const images: DockerImage[] = await this.request("/images/json")

    return images
      .map((image: DockerImage) => {
        const fullName = image.RepoTags?.[0] ?? "<none>:<none>"
        const lastColonIndex = fullName.lastIndexOf(":")
        const name = lastColonIndex > 0 ? fullName.substring(0, lastColonIndex) : fullName
        const tag = lastColonIndex > 0 ? fullName.substring(lastColonIndex + 1) : "<none>"
        const bytes = image.Size
        const mb = Math.round(bytes / 1_000_000)
        const createdDate = new Date(image.Created * 1000)
        const created = createdDate.toLocaleDateString()

        return {
          id: image.Id,
          name,
          tag,
          size: `${mb} MB`,
          created,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  public async getContainer(id: string): Promise<string> {
    const data = await this.request(`/containers/${id}/json`)
    return data.Name
  }

  public getLogsStream(containerId: string): http.ClientRequest {
    const options = {
      socketPath: this.socketPath,
      path: `/containers/${containerId}/logs?follow=1&stdout=1&stderr=1&tail=100`,
      method: "GET",
    }

    return http.request(options)
  }

  public async streamImageHistory(imageId: string): Promise<ImageHistoryItem[]> {
    return this.request(`/images/${imageId}/history`)
  }

  public async streamVolumes(): Promise<Array<Volume>> {
    const response = await this.request("/volumes")
    const volumes: DockerVolume[] = response.Volumes || []

    return volumes
      .map((volume: DockerVolume) => ({
        name: volume.Name,
        driver: volume.Driver,
        scope: volume.Scope,
        mountpoint: volume.Mountpoint,
        labels: volume.Labels || {},
        options: volume.Options,
        status: volume.Status,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}
