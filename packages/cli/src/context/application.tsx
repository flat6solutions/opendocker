import { z } from "zod"
import { createStore } from "solid-js/store"
import { createSimpleContext } from "./helper"
import type { Docker } from "@/lib/docker"
import { KeybindsConfig } from "@/util/config"

const Container = z.object({
  id: z.string().describe("Unique container identifier"),
  name: z.string().describe("Container name"),
  state: z.string().describe("Container state (e.g. running, stopped)"),
  status: z.string().describe("Container status message"),
})
export type Container = z.infer<typeof Container>

const Image = z.object({
  id: z.string().describe("Unique image identifier"),
  name: z.string().describe("Image name"),
  tag: z.string().describe("Image tag"),
  size: z.string().describe("Image size"),
  created: z.string().describe("Image creation date"),
})
export type Image = z.infer<typeof Image>

const Volume = z.object({
  name: z.string().describe("Volume name"),
  driver: z.string().describe("Volume driver"),
  scope: z.string().describe("Volume scope"),
  mountpoint: z.string().describe("Volume mountpoint"),
  labels: z.record(z.string(), z.string()).describe("Volume labels"),
  options: z.record(z.string(), z.string()).nullable().describe("Volume options"),
  status: z.record(z.string(), z.string()).nullable().describe("Volume status"),
})
export type Volume = z.infer<typeof Volume>

type Config = {
  theme?: string,
  keybinds: KeybindsConfig,
}

export const { use: useApplication, provider: ApplicationProvider } = createSimpleContext({
  name: "Application",
  init: () => {
    const [store, setStore] = createStore<{
      containers: Container[],
      images: Image[],
      volumes: Volume[],
      activeContainer: string | null,
      activeImage: string | null,
      activeVolume: string | null,
      docker: Docker | null,
      activePane: string,
      filters: Record<string, string>,
      filtering: boolean,
      config: Config 
    }>({
      containers: [],
      images: [],
      volumes: [],
      activeContainer: null,
      activeImage: null,
      activeVolume: null,
      docker: null,
      activePane: "containers",
      filters: {},
      filtering: false,
      config: {
        keybinds: KeybindsConfig.parse({}),
        theme: "opencode",
      },
    })

    return {
      get containers() { return store.containers },
      get images() { return store.images },
      get volumes() { return store.volumes },
      get activeContainer() { return store.activeContainer },
      get activeImage() { return store.activeImage },
      get activeVolume() { return store.activeVolume },
      get docker() { return store.docker },
      get activePane() { return store.activePane },
      get filters() { return store.filters },
      get filtering() { return store.filtering },
      get config() { return store.config },

      setContainers: (v: Container[]) => setStore("containers", v),
      setImages: (v: Image[]) => setStore("images", v),
      setVolumes: (v: Volume[]) => setStore("volumes", v),
      setActiveContainer: (v: string | null) => setStore("activeContainer", v),
      setActiveImage: (v: string | null) => setStore("activeImage", v),
      setActiveVolume: (v: string | null) => setStore("activeVolume", v),
      setDocker: (v: Docker | null) => setStore("docker", v),
      setActivePane: (v: string) => setStore("activePane", v),
      setFilters: (v: Record<string, string>) => setStore("filters", v),
      setFiltering: (v: boolean) => setStore("filtering", v),
      setConfig: (v: Config) => setStore("config", v),
    }
  },
})
